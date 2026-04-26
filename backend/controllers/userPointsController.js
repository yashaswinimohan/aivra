const admin = require('firebase-admin');
const db = admin.firestore();

// Get points for a user
exports.getUserPoints = async (req, res) => {
    try {
        const { user_email } = req.query;
        let query = db.collection('userpointss');
        
        if (user_email) {
            query = query.where('user_email', '==', user_email);
        } else if (req.user) {
            // Fallback to current authenticated user
            query = query.where('user_id', '==', req.user.uid);
        }

        const snapshot = await query.get();
        const points = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        res.status(200).json(points);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
