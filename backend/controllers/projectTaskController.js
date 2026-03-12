const admin = require('firebase-admin');
const db = admin.firestore();

// Get tasks for a project
exports.getTasksByProjectId = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) {
            return res.status(400).json({ message: 'project_id is required' });
        }

        const snapshot = await db.collection(`${project_id}_tasks`).get();

        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort in memory securely
        tasks.sort((a, b) => {
            const timeA = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA; // Descending (newest first)
        });

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new task
exports.addTask = async (req, res) => {
    try {
        const { project_id, title, deadline, assignee, priority, milestone_id, status } = req.body;
        const submitterId = req.user.uid;

        if (!project_id || !title) {
            return res.status(400).json({ message: 'project_id and title are required' });
        }

        // Verify membership (anyone in project can create tasks)
        // For simplicity, we just verify the project exists in this snippet. 
        // More strict apps might check project_memberships
        const projectDoc = await db.collection('projects').doc(project_id).get();
        if (!projectDoc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const newTask = {
            project_id,
            title,
            deadline: deadline || '',
            assignee: assignee || '',
            priority: priority || 'medium', // low, medium, high
            milestone_id: milestone_id || '',
            status: status || 'todo', // todo, in_progress, done
            createdBy: submitterId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection(`${project_id}_tasks`).add(newTask);
        res.status(201).json({ id: docRef.id, ...newTask });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a task (e.g. status change, assign user)
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { project_id } = req.query;
        const updates = req.body;

        if (!project_id) {
            return res.status(400).json({ message: 'project_id is required' });
        }

        const docRef = db.collection(`${project_id}_tasks`).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }

        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        // Prevent maliciously changing the project_id reference
        delete updates.project_id;

        await docRef.update(updates);
        res.status(200).json({ id, ...updates });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { project_id } = req.query;

        if (!project_id) {
            return res.status(400).json({ message: 'project_id is required' });
        }

        const docRef = db.collection(`${project_id}_tasks`).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await docRef.delete();
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
