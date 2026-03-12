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
        await db.collection('projects').doc(docRef.id).collection('members').add({
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

// Get project memberships
exports.getProjectMemberships = async (req, res) => {
    try {
        const email = req.query.user_email;
        const project_id = req.query.project_id;
        let query;

        if (project_id) {
            query = db.collection('projects').doc(project_id).collection('members');
            if (email) query = query.where('user_email', '==', email);
        } else if (email) {
            query = db.collectionGroup('members').where('user_email', '==', email);
        } else {
            return res.status(400).json({ message: 'Must provide user_email or project_id' });
        }

        const snapshot = await query.get();
        const memberships = [];
        const userCache = {};

        for (const doc of snapshot.docs) {
            const memData = doc.data();
            let userName = 'User';
            if (memData.user_id) {
                if (!userCache[memData.user_id]) {
                    const userDoc = await db.collection('users').doc(memData.user_id).get();
                    if (userDoc.exists) {
                        const data = userDoc.data();
                        userCache[memData.user_id] = data.full_name || data.displayName || data.firstName || memData.user_email || 'User';
                    } else {
                        userCache[memData.user_id] = memData.user_email || 'User';
                    }
                }
                userName = userCache[memData.user_id];
            }
            memberships.push({ id: doc.id, ...memData, user_name: userName });
        }
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

        const membershipData = {
            project_id,
            user_id,
            user_email,
            role: role || 'Member',
            status: 'pending', // <--- New joining flow: Requires approval
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('projects').doc(project_id).collection('members').add(membershipData);

        // Get basic name from token to immediately return to frontend
        let userName = req.user.name || req.user.displayName || 'User';
        res.status(201).json({ id: docRef.id, ...membershipData, user_name: userName });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Leave or remove project member
exports.leaveOrRemoveProjectMember = async (req, res) => {
    try {
        const { projectId, id } = req.params; // membership ID

        const memRef = db.collection('projects').doc(projectId).collection('members').doc(id);
        const memDoc = await memRef.get();
        if (!memDoc.exists) {
            return res.status(404).json({ message: 'Membership not found' });
        }
        const memData = memDoc.data();

        await memRef.delete();

        const projectRef = db.collection('projects').doc(projectId);
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
        const membershipsSnapshot = await db.collection('projects').doc(id).collection('members').get();
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
        const { projectId, id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        const memRef = db.collection('projects').doc(projectId).collection('members').doc(id);
        const memDoc = await memRef.get();

        if (!memDoc.exists) {
            return res.status(404).json({ message: 'Membership not found' });
        }

        const memData = memDoc.data();
        const projectRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (projectDoc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ message: 'Unauthorized to update memberships for this project' });
        }

        if (status === 'accepted') {
            await memRef.update({ status: 'accepted' });
            
            let userName = memData.user_name; // Fallback for legacy docs
            if (!userName && memData.user_id) {
                 const userDoc = await db.collection('users').doc(memData.user_id).get();
                 if (userDoc.exists) {
                     const data = userDoc.data();
                     userName = data.full_name || data.displayName || data.firstName || memData.user_email || 'User';
                 } else {
                     userName = memData.user_email || 'User';
                 }
            }

            await projectRef.update({
                team_members: admin.firestore.FieldValue.arrayUnion({
                    id: memData.user_id,
                    name: userName,
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
        const existingMemSnapshot = await db.collection('projects').doc(project_id).collection('members')
            .where('user_id', '==', userId)
            .get();

        if (!existingMemSnapshot.empty) {
            return res.status(400).json({ message: 'User is already a member or has a pending request' });
        }

        const membershipData = {
            project_id,
            user_id: userId,
            user_email: email,
            role: role || 'Member',
            status: 'invited',
            invitedBy: req.user.uid,
            invitedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const memRef = await db.collection('projects').doc(project_id).collection('members').add(membershipData);

        res.status(201).json({ id: memRef.id, ...membershipData, message: 'User invited successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
