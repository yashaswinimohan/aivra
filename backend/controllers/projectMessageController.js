const admin = require('firebase-admin');
const db = admin.firestore();

// Get messages for a project
exports.getMessagesByProjectId = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) {
            return res.status(400).json({ message: 'project_id is required' });
        }

        const snapshot = await db.collection(`${project_id}_messages`)
            .orderBy('created_date', 'desc')
            .get();

        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new message
exports.addMessage = async (req, res) => {
    try {
        const { project_id, sender_name, sender_email, content } = req.body;

        if (!project_id || !content) {
            return res.status(400).json({ message: 'project_id and content are required' });
        }

        const newMessage = {
            project_id,
            sender_name: sender_name || 'Unknown',
            sender_email: sender_email || '',
            content,
            created_date: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection(`${project_id}_messages`).add(newMessage);
        
        // Return with current date so frontend doesn't show null timestamp before refresh
        res.status(201).json({ id: docRef.id, ...newMessage, created_date: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
