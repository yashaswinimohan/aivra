const admin = require('firebase-admin');
const db = admin.firestore();

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.uid; // From auth middleware
        const doc = await db.collection('users').doc(userId).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createUserProfile = async (req, res) => {
    try {
        const { uid, email, firstName, lastName } = req.body;

        // Check if user already exists
        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();

        if (doc.exists) {
            return res.status(200).json({ message: 'User already exists', ...doc.data() });
        }

        // Create new user with default 'student' role
        const newUser = {
            email,
            firstName: firstName || '',
            lastName: lastName || '',
            displayName: `${firstName || ''} ${lastName || ''}`.trim(),
            role: 'student',
            isOnboardingComplete: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await userRef.set(newUser);
        res.status(201).json({ message: 'User profile created', ...newUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.promoteToProfessor = async (req, res) => {
    try {
        const userId = req.user.uid;
        const userRef = db.collection('users').doc(userId);

        await userRef.set({ role: 'professor' }, { merge: true });

        res.status(200).json({ message: 'User promoted to professor' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.promoteToAdmin = async (req, res) => {
    try {
        const userId = req.user.uid;
        const userRef = db.collection('users').doc(userId);

        await userRef.set({ role: 'admin' }, { merge: true });

        res.status(200).json({ message: 'User promoted to admin' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create or update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { displayName, role, bio } = req.body;

        const userData = {
            email: req.user.email,
            displayName,
            role: role || 'student', // Default role
            bio,
            isOnboardingComplete: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(userId).set(userData, { merge: true });
        res.status(200).json({ message: 'User profile updated', ...userData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
