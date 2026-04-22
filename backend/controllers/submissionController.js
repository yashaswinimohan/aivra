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
        const doc = await db.collection('submissions').doc(submissionId).get();

        if (!doc.exists) {
            return res.status(200).json(null); // No submission yet
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
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
