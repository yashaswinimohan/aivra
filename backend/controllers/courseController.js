const admin = require('firebase-admin');
const db = admin.firestore();

// Get all courses
exports.getAllCourses = async (req, res) => {
    try {
        const snapshot = await db.collection('courses').get();
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single course
exports.getCourseById = async (req, res) => {
    try {
        const doc = await db.collection('courses').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new course
exports.createCourse = async (req, res) => {
    try {
        const { title, description, duration, seats, attachments, tags, domain, startDate, level } = req.body;
        const instructorId = req.user.uid; // Get ID from authenticated user

        const newCourse = {
            title,
            description,
            instructorId,
            duration: duration || { value: 0, unit: 'weeks' },
            seats: seats ? parseInt(seats) : 0,
            startDate: startDate || null,
            attachments: attachments || [],
            tags: tags || [],
            domain: domain || 'General',
            level: level || 'Beginner',
            status: req.body.status || 'published',
            modules: req.body.modules || [], // Include modules
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection('courses').add(newCourse);
        res.status(201).json({ id: docRef.id, ...newCourse });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a course
exports.updateCourse = async (req, res) => {
    try {
        await db.collection('courses').doc(req.params.id).update(req.body);
        res.status(200).json({ message: 'Course updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
    try {
        await db.collection('courses').doc(req.params.id).delete();
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
