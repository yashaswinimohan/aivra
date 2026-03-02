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
        const { title, description, duration, roles_needed, related_course, public_resources, private_resources, tags } = req.body;
        const ownerId = req.user.uid; // Get ID from authenticated user

        // Fetch user basic info to store as owner in team
        const userDoc = await db.collection('users').doc(ownerId).get();
        const ownerName = userDoc.exists ? userDoc.data().full_name : 'Project Owner';

        const newProject = {
            title,
            description,
            ownerId,
            duration: duration || 'Not specified',
            roles_needed: roles_needed || [],
            related_course: related_course || null,
            public_resources: public_resources || [],
            private_resources: private_resources || [],
            tags: tags || [],
            team_members: [{
                id: ownerId,
                name: ownerName,
                role: 'Owner',
                email: req.user.email
            }],
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

// Get single project by ID
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('projects').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = doc.data();

        // Polyfill: Ensure owner is in team_members for older projects
        if (!projectData.team_members) {
            projectData.team_members = [];
        }
        if (!projectData.team_members.some(m => m.id === projectData.ownerId)) {
            let ownerName = 'Project Owner';
            try {
                const userDoc = await db.collection('users').doc(projectData.ownerId).get();
                if (userDoc.exists && userDoc.data().full_name) {
                    ownerName = userDoc.data().full_name;
                }
            } catch (e) { }

            projectData.team_members.push({
                id: projectData.ownerId,
                name: ownerName,
                role: 'Owner',
                email: ''
            });
        }

        res.status(200).json({ id: doc.id, ...projectData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Join a project (Create membership)
exports.joinProject = async (req, res) => {
    try {
        const { project_id, role } = req.body;
        const user_id = req.user.uid;
        const user_email = req.user.email;

        // Fetch user basic info to store in membership
        const userDoc = await db.collection('users').doc(user_id).get();
        const userName = userDoc.exists ? userDoc.data().full_name : 'User';

        const membershipData = {
            project_id,
            user_id,
            user_email,
            user_name: userName,
            role: role || 'Member',
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('projectmemberships').add(membershipData);

        // Update project document to include member summary for quick access
        const projectRef = db.collection('projects').doc(project_id);
        await projectRef.update({
            team_members: admin.firestore.FieldValue.arrayUnion({
                id: user_id,
                name: userName,
                role: role || 'Member',
                email: user_email
            })
        });

        res.status(201).json({ id: docRef.id, ...membershipData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Leave or remove project member
exports.leaveOrRemoveProjectMember = async (req, res) => {
    try {
        const { id } = req.params; // membership ID

        const memDoc = await db.collection('projectmemberships').doc(id).get();
        if (!memDoc.exists) {
            return res.status(404).json({ message: 'Membership not found' });
        }
        const memData = memDoc.data();

        await db.collection('projectmemberships').doc(id).delete();

        const projectRef = db.collection('projects').doc(memData.project_id);
        const projectDoc = await projectRef.get();
        if (projectDoc.exists && projectDoc.data().team_members) {
            const updatedMembers = projectDoc.data().team_members.filter(m => m.id !== memData.user_id);
            await projectRef.update({ team_members: updatedMembers });
        }

        res.status(200).json({ message: 'Membership removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
