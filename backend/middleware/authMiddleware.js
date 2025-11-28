const admin = require('firebase-admin');
const db = admin.firestore();

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;

        // Fetch user role from Firestore
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
            req.user.role = userDoc.data().role;
        } else {
            // Default to student if profile doesn't exist yet (or handle as error)
            req.user.role = 'student';
        }

        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
};

module.exports = verifyToken;
