const admin = require('firebase-admin');
const db = admin.firestore();

// Create or update a submission
exports.submitAssessment = async (req, res) => {
    try {
        const { courseId, chapterId, textResponse, fileUrl } = req.body;
        const userId = req.user.uid;

        if (!courseId || !chapterId) {
            return res.status(400).json({ message: "courseId and chapterId are required" });
        }

        const submissionId = `${userId}_${chapterId}`;
        console.log(`[Submission] Creating/Updating ${submissionId} for course ${courseId}`);
        const submissionRef = db.collection('submissions').doc(submissionId);

        const submissionData = {
            userId,
            courseId,
            chapterId,
            textResponse: textResponse || "",
            fileUrl: fileUrl || "",
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            graded: false, // reset graded status if re-submitting before grade
        };

        await submissionRef.set(submissionData, { merge: true });

        // Optionally, register a 0 grade in gradebook to indicate submission needs grading
        // Or leave it un-graded. For now, just save submission.

        res.status(200).json({ message: "Assessment submitted successfully", id: submissionId, ...submissionData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single student's submission for a chapter
exports.getSubmission = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const userId = req.user.uid;

        const submissionId = `${userId}_${chapterId}`;
        console.log(`[Submission] Fetching ${submissionId}`);
        const doc = await db.collection('submissions').doc(submissionId).get();

        if (!doc.exists) {
            console.log(`[Submission] Not found: ${submissionId}`);
            return res.status(200).json(null); // No submission yet
        }

        const data = { id: doc.id, ...doc.data() };
        
        // If the submission record isn't marked as graded, check the Gradebook (grades collection) as a fallback
        // This ensures grades entered directly in the Gradebook are shown to students
        if (!data.graded && data.courseId && data.chapterId) {
            const assignmentId = `assessment_${data.courseId}_${data.chapterId}`;
            const gradeId = `${userId}_${assignmentId}`;
            const gradeDoc = await db.collection('grades').doc(gradeId).get();
            if (gradeDoc.exists) {
                const gradeData = gradeDoc.data();
                console.log(`[Submission] Found fallback grade for ${submissionId}`);
                data.graded = true;
                data.score = gradeData.score;
                data.feedback = gradeData.feedback || data.feedback;
            }
        }

        console.log(`[Submission] Found: ${submissionId}, graded: ${data.graded}`);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all submissions for a course (Instructor View)
exports.getCourseSubmissions = async (req, res) => {
    try {
        const { courseId } = req.params;
        const snapshot = await db.collection('submissions')
            .where('courseId', '==', courseId)
            .get();

        const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get user details for these submissions
        const userIds = [...new Set(submissions.map(s => s.userId))];
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

        const enrichedSubmissions = submissions.map(sub => {
            const user = users.find(u => u.id === sub.userId);
            return {
                ...sub,
                user: user ? {
                    email: user.email,
                    fullName: user.displayName || user.firstName || 'Anonymous',
                } : null
            };
        });

        res.status(200).json(enrichedSubmissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all submissions across all courses (Instructor/Admin View)
exports.getAllSubmissions = async (req, res) => {
    try {
        const snapshot = await db.collection('submissions').get();
        const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`[Review] Fetched ${submissions.length} submissions`);

        if (submissions.length === 0) {
            return res.status(200).json([]);
        }

        // Get unique user IDs
        const userIds = [...new Set(submissions.map(s => s.userId))];
        const users = [];
        
        // Fetch users in batches of 30
        for (let i = 0; i < userIds.length; i += 30) {
            const batchIds = userIds.slice(i, i + 30);
            const usersSnapshot = await db.collection('users')
                .where(admin.firestore.FieldPath.documentId(), 'in', batchIds)
                .get();
                
            usersSnapshot.docs.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
        }

        // We can also fetch course titles if we want, but for now we'll just return the courseId
        // or we can fetch courses. Let's fetch courses to make UI nicer.
        const courseIds = [...new Set(submissions.map(s => s.courseId))];
        const courses = [];
        
        for (let i = 0; i < courseIds.length; i += 30) {
            const batchIds = courseIds.slice(i, i + 30);
            const coursesSnapshot = await db.collection('courses')
                .where(admin.firestore.FieldPath.documentId(), 'in', batchIds)
                .get();
            coursesSnapshot.docs.forEach(doc => {
                courses.push({ id: doc.id, ...doc.data() });
            });
        }

        const enrichedSubmissions = submissions.map(sub => {
            const user = users.find(u => u.id === sub.userId);
            const course = courses.find(c => c.id === sub.courseId);
            return {
                ...sub,
                user_name: user ? (user.displayName || user.firstName || 'Anonymous') : 'Anonymous',
                user_email: user ? user.email : '',
                course_title: course ? course.title : 'Unknown Course'
            };
        });

        // Sort by submittedAt descending
        enrichedSubmissions.sort((a, b) => {
            const dateA = a.submittedAt ? a.submittedAt.toDate() : new Date(0);
            const dateB = b.submittedAt ? b.submittedAt.toDate() : new Date(0);
            return dateB - dateA;
        });

        res.status(200).json(enrichedSubmissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Grade a specific submission
exports.gradeSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { score, feedback } = req.body;
        console.log(`[Review] Grading submission ${submissionId} with score ${score}`);

        const submissionRef = db.collection('submissions').doc(submissionId);
        const doc = await submissionRef.get();
        
        if (!doc.exists) {
            console.log(`[Review] Submission NOT FOUND: ${submissionId}`);
            return res.status(404).json({ message: "Submission not found" });
        }

        const subData = doc.data();
        const { userId, courseId, chapterId } = subData;

        await submissionRef.update({
            graded: true,
            score: Number(score),
            feedback: feedback || "",
            gradedAt: admin.firestore.FieldValue.serverTimestamp(),
            gradedBy: req.user.uid
        });
        console.log(`[Review] Successfully updated submission ${submissionId}. Graded: true`);

        // Also update the Gradebook (grades collection) if it's a course assessment
        if (courseId && chapterId) {
            const assignmentId = `assessment_${courseId}_${chapterId}`;
            const gradeId = `${userId}_${assignmentId}`;
            console.log(`[Sync] Updating Gradebook for user ${userId}, assignment ${assignmentId}`);
            await db.collection('grades').doc(gradeId).set({
                assignmentId,
                userId,
                score: Number(score),
                feedback: feedback || "",
                gradedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        res.status(200).json({ message: "Submission graded successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
