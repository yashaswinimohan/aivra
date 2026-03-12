const admin = require('firebase-admin');
const db = admin.firestore();

// Get milestones for a project
exports.getMilestonesByProjectId = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) {
            return res.status(400).json({ message: 'project_id is required' });
        }

        const snapshot = await db.collection(`${project_id}_milestones`).get();

        const milestones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort in memory to avoid requiring a composite index in Firestore
        milestones.sort((a, b) => {
            const timeA = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
            return timeA - timeB;
        });

        res.status(200).json(milestones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new milestone
exports.addMilestone = async (req, res) => {
    try {
        const { project_id, title, objective, startDate, date, deliverables } = req.body;
        const ownerId = req.user.uid;

        // Verify ownership
        const projectDoc = await db.collection('projects').doc(project_id).get();
        if (!projectDoc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (projectDoc.data().ownerId !== ownerId) {
            return res.status(403).json({ message: 'Unauthorized: Only the project owner can add milestones' });
        }

        // Validate dates and check for overlaps
        const sDate = startDate || date;
        const eDate = date;

        if (sDate && eDate) {
            const newStart = new Date(sDate);
            const newEnd = new Date(eDate);

            if (newStart > newEnd) {
                return res.status(400).json({ message: 'Start date cannot be after target date.' });
            }

            const existingMilestonesSnapshot = await db.collection(`${project_id}_milestones`).get();

            const existingMilestones = existingMilestonesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            for (const cm of existingMilestones) {
                const cmStartStr = cm.startDate || cm.date;
                const cmEndStr = cm.date;

                if (cmStartStr && cmEndStr) {
                    const cmStart = new Date(cmStartStr);
                    const cmEnd = new Date(cmEndStr);

                    const maxStart = newStart > cmStart ? newStart : cmStart;
                    const minEnd = newEnd < cmEnd ? newEnd : cmEnd;

                    if (maxStart <= minEnd) {
                        return res.status(400).json({ message: `Dates overlap with an existing milestone: "${cm.title}"` });
                    }
                }
            }
        }

        const newMilestone = {
            project_id,
            title,
            objective: objective || '',
            startDate: startDate || '',
            date: date || '',
            deliverables: deliverables || [],
            completed: false, // Default to not completed
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection(`${project_id}_milestones`).add(newMilestone);
        res.status(201).json({ id: docRef.id, ...newMilestone });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a milestone (e.g. mark as completed)
exports.updateMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const { project_id } = req.query;
        const updates = req.body;
        const ownerId = req.user.uid;

        if (!project_id) {
            return res.status(400).json({ message: 'project_id is required' });
        }

        const docRef = db.collection(`${project_id}_milestones`).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Milestone not found' });
        }

        const milestoneData = doc.data();

        // Verify ownership via project
        const projectDoc = await db.collection('projects').doc(milestoneData.project_id).get();
        // Allow updates if they are owner or if project no longer exists (orphaned milestone)
        if (projectDoc.exists && projectDoc.data().ownerId !== ownerId) {
            return res.status(403).json({ message: 'Unauthorized: Only the project owner can update milestones' });
        }

        // Check for overlaps if dates are being modified
        const updatedStartDate = updates.startDate !== undefined ? updates.startDate : milestoneData.startDate;
        const updatedDate = updates.date !== undefined ? updates.date : milestoneData.date;

        const sDate = updatedStartDate || updatedDate;
        const eDate = updatedDate;

        if (sDate && eDate) {
            const newStart = new Date(sDate);
            const newEnd = new Date(eDate);

            if (newStart > newEnd) {
                return res.status(400).json({ message: 'Start date cannot be after target date.' });
            }

            const existingMilestonesSnapshot = await db.collection(`${project_id}_milestones`).get();

            const existingMilestones = existingMilestonesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            for (const cm of existingMilestones) {
                if (cm.id === id) continue; // Skip self

                const cmStartStr = cm.startDate || cm.date;
                const cmEndStr = cm.date;

                if (cmStartStr && cmEndStr) {
                    const cmStart = new Date(cmStartStr);
                    const cmEnd = new Date(cmEndStr);

                    const maxStart = newStart > cmStart ? newStart : cmStart;
                    const minEnd = newEnd < cmEnd ? newEnd : cmEnd;

                    if (maxStart <= minEnd) {
                        return res.status(400).json({ message: `Dates overlap with an existing milestone: "${cm.title}"` });
                    }
                }
            }
        }

        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        // Prevent changing project_id
        delete updates.project_id;

        await docRef.update(updates);
        res.status(200).json({ id, ...updates });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a milestone
exports.deleteMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const { project_id } = req.query;
        const ownerId = req.user.uid;

        if (!project_id) {
            return res.status(400).json({ message: 'project_id is required' });
        }

        const docRef = db.collection(`${project_id}_milestones`).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Milestone not found' });
        }

        const milestoneData = doc.data();

        // Verify ownership via project
        const projectDoc = await db.collection('projects').doc(milestoneData.project_id).get();
        if (projectDoc.exists && projectDoc.data().ownerId !== ownerId) {
            return res.status(403).json({ message: 'Unauthorized: Only the project owner can delete milestones' });
        }

        await docRef.delete();
        res.status(200).json({ message: 'Milestone deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
