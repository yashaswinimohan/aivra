const admin = require('firebase-admin');
const db = admin.firestore();

exports.getAssignmentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const snapshot = await db.collection('assignments')
            .where('courseId', '==', courseId)
            .get();

        const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort by dueDate
        assignments.sort((a, b) => {
            const timeA = a.dueDate ? a.dueDate.toMillis() : 0;
            const timeB = b.dueDate ? b.dueDate.toMillis() : 0;
            return timeA - timeB;
        });

        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAssignment = async (req, res) => {
    try {
        const { courseId, title, description, pointsPossible, dueDate } = req.body;
        
        if (!courseId || !title) {
            return res.status(400).json({ message: 'courseId and title are required' });
        }

        const newAssignment = {
            courseId,
            title,
            description: description || '',
            pointsPossible: pointsPossible ? parseInt(pointsPossible) : 100,
            dueDate: dueDate ? admin.firestore.Timestamp.fromDate(new Date(dueDate)) : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('assignments').add(newAssignment);
        res.status(201).json({ id: docRef.id, ...newAssignment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        await db.collection('assignments').doc(req.params.id).delete();
        // Would also need to delete associated grades realistically
        res.status(200).json({ message: 'Assignment deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
