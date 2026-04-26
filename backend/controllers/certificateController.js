const admin = require('firebase-admin');
const db = admin.firestore();

// Get certificates for user
exports.getUserCertificates = async (req, res) => {
    try {
        const userEmail = req.query.user_email || req.user.email;
        if (!userEmail) return res.status(400).json({ message: 'User email is required' });

        const snapshot = await db.collection('certificates')
            .where('user_email', '==', userEmail)
            .get();

        const certificates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // We can sort them by issued_at on the client or here
        // Firebase timestamps need to be converted to dates
        certificates.sort((a, b) => {
            const timeA = a.issued_at ? a.issued_at.toMillis() : 0;
            const timeB = b.issued_at ? b.issued_at.toMillis() : 0;
            return timeB - timeA;
        });

        res.status(200).json(certificates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Generate an achievement (certificate / portfolio credit)
// Invoked when user completes a course or project
exports.issueCertificate = async (req, res) => {
    try {
        const { user_email, type, reference_id, title, description, skills } = req.body;
        
        if (!user_email || !type || !reference_id || !title) {
             return res.status(400).json({ message: 'Missing required fields' });
        }

        // Prevent duplicates for the same user and reference
        const existsSnapshot = await db.collection('certificates')
            .where('user_email', '==', user_email)
            .where('reference_id', '==', reference_id)
            .get();

        if (!existsSnapshot.empty) {
            return res.status(200).json({ 
                message: 'Certificate already issued', 
                id: existsSnapshot.docs[0].id, 
                ...existsSnapshot.docs[0].data() 
            });
        }

        const newCert = {
            user_email,
            userName: req.body.userName || '', // Store the name snapshot
            type, // 'course' or 'project'
            reference_id, // course_id or project_id
            title,
            description: description || '',
            skills: skills || [],
            issued_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection('certificates').add(newCert);
        res.status(201).json({ id: docRef.id, ...newCert, message: 'Certificate successfully issued' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
