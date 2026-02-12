const admin = require('firebase-admin');
const db = admin.firestore();

// Get enrollment (or create if not exists)
exports.getEnrollment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.uid;

        const enrollmentId = `${userId}_${courseId}`;
        const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
        const doc = await enrollmentRef.get();

        if (!doc.exists) {
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
