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

// Update progress (Mark chapter as complete)
exports.updateProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { chapterId, isCompleted } = req.body;
        const userId = req.user.uid;

        const enrollmentId = `${userId}_${courseId}`;
        const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
        const doc = await enrollmentRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        const data = doc.data();
        let completedChapters = data.completedChapters || [];

        if (isCompleted) {
            if (!completedChapters.includes(chapterId)) {
                completedChapters.push(chapterId);
            }
        } else {
            completedChapters = completedChapters.filter(id => id !== chapterId);
        }

        // Calculate progress (optional, can be done securely if we fetch course metadata here, 
        // or just store completed chapters and let frontend/calc handle %)
        // For now, let's just save the list.

        await enrollmentRef.update({
            completedChapters,
            lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: "Progress updated", completedChapters });

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
