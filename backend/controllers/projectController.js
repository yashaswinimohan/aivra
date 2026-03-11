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
            status: 'pending', // <--- New joining flow: Requires approval
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('projectmemberships').add(membershipData);

        // Do not add to project.team_members here anymore. 
        // We will add them when the owner accepts the membership.

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

// Update an existing project
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating ownerId or team_members directly through this endpoint
        delete updates.ownerId;
        delete updates.team_members;

        const docRef = db.collection('projects').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (doc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ message: 'Unauthorized to update this project' });
        }

        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await docRef.update(updates);

        res.status(200).json({ id, ...updates });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a project
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const docRef = db.collection('projects').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (doc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ message: 'Unauthorized to delete this project' });
        }

        // Delete the project
        await docRef.delete();

        // Delete associated memberships
        const membershipsSnapshot = await db.collection('projectmemberships').where('project_id', '==', id).get();
        const batch = db.batch();
        membershipsSnapshot.docs.forEach(memDoc => {
            batch.delete(memDoc.ref);
        });
        await batch.commit();

        res.status(200).json({ message: 'Project and associated memberships deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update membership status (Accept/Reject)
exports.updateMembershipStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        const memRef = db.collection('projectmemberships').doc(id);
        const memDoc = await memRef.get();

        if (!memDoc.exists) {
            return res.status(404).json({ message: 'Membership not found' });
        }

        const memData = memDoc.data();
        const projectRef = db.collection('projects').doc(memData.project_id);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (projectDoc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ message: 'Unauthorized to update memberships for this project' });
        }

        if (status === 'accepted') {
            await memRef.update({ status: 'accepted' });
            await projectRef.update({
                team_members: admin.firestore.FieldValue.arrayUnion({
                    id: memData.user_id,
                    name: memData.user_name,
                    role: memData.role,
                    email: memData.user_email
                })
            });
            res.status(200).json({ message: 'Membership accepted', id });
        } else if (status === 'rejected') {
            await memRef.delete();
            res.status(200).json({ message: 'Membership rejected and deleted', id });
        } else {
            res.status(400).json({ message: 'Invalid status' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Invite a user to the project by email
exports.inviteUserToProject = async (req, res) => {
    try {
        const { project_id, email, role } = req.body;

        const projectRef = db.collection('projects').doc(project_id);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (projectDoc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ message: 'Unauthorized to invite users to this project' });
        }

        // Find user by email
        const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if (userSnapshot.empty) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Check if already a member or pending
        const existingMemSnapshot = await db.collection('projectmemberships')
            .where('project_id', '==', project_id)
            .where('user_id', '==', userId)
            .get();

        if (!existingMemSnapshot.empty) {
            return res.status(400).json({ message: 'User is already a member or has a pending request' });
        }

        const membershipData = {
            project_id,
            user_id: userId,
            user_email: email,
            user_name: userData.full_name || 'User',
            role: role || 'Member',
            status: 'invited',
            invitedBy: req.user.uid,
            invitedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const memRef = await db.collection('projectmemberships').add(membershipData);

        res.status(201).json({ id: memRef.id, ...membershipData, message: 'User invited successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
