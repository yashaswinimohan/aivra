const admin = require('firebase-admin');
const db = admin.firestore();

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const snapshot = await db.collection('projects').get();
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new project
exports.createProject = async (req, res) => {
    try {
        const { title, description, duration, roles_needed, related_course } = req.body;
        const ownerId = req.user.uid; // Get ID from authenticated user

        const newProject = {
            title,
            description,
            ownerId,
            duration: duration || 'Not specified',
            roles_needed: roles_needed || [],
            related_course: related_course || null,
            status: req.body.status || 'Open',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection('projects').add(newProject);

        // Also add the owner as a member
        await db.collection('projectmemberships').add({
            project_id: docRef.id,
            user_id: ownerId,
            user_email: req.user.email,
            role: 'Owner',
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ id: docRef.id, ...newProject });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get project memberships (mocked for now, depending on req.query)
exports.getProjectMemberships = async (req, res) => {
    try {
        const email = req.query.user_email;
        let query = db.collection('projectmemberships');
        if (email) {
            query = query.where('user_email', '==', email);
        }
        const snapshot = await query.get();
        const memberships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(memberships);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
