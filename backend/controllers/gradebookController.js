const admin = require('firebase-admin');
const db = admin.firestore();

// Set or update a grade
exports.upsertGrade = async (req, res) => {
    try {
        const { assignmentId, userId, score, feedback } = req.body;
        
        if (!assignmentId || !userId || score === undefined) {
             return res.status(400).json({ message: 'assignmentId, userId, and score are required' });
        }
        console.log(`[Gradebook] Grading user ${userId} for assignment ${assignmentId}`);

        const gradeId = `${userId}_${assignmentId}`;
        const gradeRef = db.collection('grades').doc(gradeId);
        
        const gradeData = {
            assignmentId,
            userId,
            score: parseFloat(score),
            feedback: feedback || '',
            gradedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await gradeRef.set(gradeData, { merge: true });

        // Sync with submissions if it's an auto-generated assessment from a chapter
        if (assignmentId.startsWith('assessment_')) {
            console.log(`[Sync] upsertGrade: detected auto-generated assignment ${assignmentId}`);
            try {
                const assignmentDoc = await db.collection('assignments').doc(assignmentId).get();
                if (assignmentDoc.exists) {
                    const { chapterId } = assignmentDoc.data();
                    if (chapterId) {
                        const submissionId = `${userId}_${chapterId}`;
                        const submissionRef = db.collection('submissions').doc(submissionId);
                        const subDoc = await submissionRef.get();
                        
                        if (subDoc.exists) {
                            console.log(`[Sync] Updating submission ${submissionId} for user ${userId}`);
                            await submissionRef.update({
                                graded: true,
                                score: parseFloat(score),
                                feedback: feedback || '',
                                gradedAt: admin.firestore.FieldValue.serverTimestamp(),
                                gradedBy: req.user?.uid || 'instructor'
                            });
                            console.log(`[Sync] Successfully updated submission ${submissionId}. Graded: true`);
                        } else {
                            console.log(`[Sync Skip] No submission doc found for ${submissionId}`);
                        }
                    } else {
                        console.log(`[Sync Skip] No chapterId in assignment ${assignmentId}`);
                    }
                } else {
                    console.log(`[Sync Skip] Assignment doc ${assignmentId} not found`);
                }
            } catch (syncError) {
                console.error("Error syncing grade to submission:", syncError);
            }
        }

        res.status(200).json({ id: gradeId, ...gradeData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get grades for a specific course (needs checking all assignments for that course)
exports.getGradesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Find all assignments for this course
        const assignmentsSnapshot = await db.collection('assignments')
            .where('courseId', '==', courseId)
            .get();
            
        if (assignmentsSnapshot.empty) {
            return res.status(200).json([]);
        }
        
        const assignmentIds = assignmentsSnapshot.docs.map(doc => doc.id);
        
        // Firestore 'in' query supports up to 30 items
        // We'll fetch grades where assignmentId is in the list
        const grades = [];
        for (let i = 0; i < assignmentIds.length; i += 30) {
            const batchIds = assignmentIds.slice(i, i + 30);
            const gradesSnapshot = await db.collection('grades')
                .where('assignmentId', 'in', batchIds)
                .get();
                
            gradesSnapshot.docs.forEach(doc => {
                grades.push({ id: doc.id, ...doc.data() });
            });
        }

        res.status(200).json(grades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
