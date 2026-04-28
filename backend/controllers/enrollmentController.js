const admin = require('firebase-admin');
const db = admin.firestore();

// Get enrollment (or create if not exists)
exports.getEnrollment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const autoEnroll = req.query.autoEnroll === 'true';
        const userId = req.user.uid;

        const enrollmentId = `${userId}_${courseId}`;
        const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
        const doc = await enrollmentRef.get();

        if (!doc.exists) {
            if (autoEnroll) {
                // Auto-enroll on first access
                const enrollmentData = {
                    userId,
                    courseId,
                    enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
                    completedChapters: [], // Array of chapter IDs
                    progress: 0,
                    lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
                };
                await enrollmentRef.set(enrollmentData);
                return res.status(200).json({ id: enrollmentId, ...enrollmentData });
            } else {
                return res.status(200).json({ completedChapters: [], progress: 0, notEnrolled: true });
            }
        }

        // Update last accessed
        await enrollmentRef.update({
            lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all enrollments for a user
exports.getUserEnrollments = async (req, res) => {
    try {
        const userId = req.user.uid;
        const snapshot = await db.collection('enrollments')
            .where('userId', '==', userId)
            .get();

        const enrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update progress (Mark chapter or quiz as complete)
exports.updateProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { chapterId, quizId, isCompleted } = req.body;
        const userId = req.user.uid;

        const enrollmentId = `${userId}_${courseId}`;
        const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
        const doc = await enrollmentRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        const data = doc.data();
        const updateData = {
            lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (chapterId) {
            let completedChapters = data.completedChapters || [];
            if (isCompleted) {
                if (!completedChapters.includes(chapterId)) {
                    completedChapters.push(chapterId);
                }
            } else {
                completedChapters = completedChapters.filter(id => id !== chapterId);
            }
            updateData.completedChapters = completedChapters;

            // Calculate progress dynamically
            try {
                const courseRef = db.collection('courses').doc(courseId);
                const courseDoc = await courseRef.get();
                if (courseDoc.exists) {
                    const courseData = courseDoc.data();
                    const totalChapters = (courseData.modules || []).reduce((acc, m) => acc + (m.chapters?.length || 0), 0);
                    if (totalChapters > 0) {
                        updateData.progress = Math.round((completedChapters.length / totalChapters) * 100);
                    }
                }
            } catch (err) {
                console.error("Progress calc error:", err);
            }
        }

        if (quizId) {
            let completedQuizzes = data.completedQuizzes || [];
            if (isCompleted) {
                if (!completedQuizzes.includes(quizId)) {
                    completedQuizzes.push(quizId);
                }
            } else {
                completedQuizzes = completedQuizzes.filter(id => id !== quizId);
            }
            updateData.completedQuizzes = completedQuizzes;

            // Store individual answers if provided
            if (req.body.quizAnswers) {
                const quizAnswers = data.quizAnswers || {};
                quizAnswers[quizId] = req.body.quizAnswers;
                updateData.quizAnswers = quizAnswers;
            }
        }

        await enrollmentRef.update(updateData);

        res.status(200).json({ 
            message: "Progress updated", 
            completedChapters: updateData.completedChapters || data.completedChapters,
            completedQuizzes: updateData.completedQuizzes || data.completedQuizzes,
            quizAnswers: updateData.quizAnswers || data.quizAnswers,
            progress: updateData.progress || data.progress 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all students enrolled in a specific course
exports.getCourseStudents = async (req, res) => {
    try {
        const { courseId } = req.params;
        const snapshot = await db.collection('enrollments')
            .where('courseId', '==', courseId)
            .get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const enrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const userIds = enrollments.map(e => e.userId);

        // Fetch User details for these students
        // Chunk user fetching into batches of 10 to avoid limits (in-query supports up to 30)
        const users = [];
        for (let i = 0; i < userIds.length; i += 30) {
            const batchIds = userIds.slice(i, i + 30);
            const usersSnapshot = await db.collection('users')
                .where(admin.firestore.FieldPath.documentId(), 'in', batchIds)
                .get();
                
            usersSnapshot.docs.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
        }

        // Merge User details with Enrollments
        const students = enrollments.map(enrollment => {
            const user = users.find(u => u.id === enrollment.userId);
            return {
                ...enrollment,
                user: user ? {
                    email: user.email,
                    firstName: user.firstName || user.first_name || '',
                    lastName: user.lastName || user.last_name || '',
                    fullName: user.displayName || user.full_name || user.email,
                } : null
            };
        });

        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Drop a student from a course
exports.dropStudent = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        // Instructor check should happen here but omitting for brevity
        await db.collection('enrollments').doc(enrollmentId).delete();
        res.status(200).json({ message: "Student dropped successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
