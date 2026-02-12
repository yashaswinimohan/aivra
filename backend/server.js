const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });
console.log(`Loaded environment variables from ${envFile}`);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin Initialization
// Firebase Admin Initialization
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    })
  });
  console.log('Firebase Admin Initialized');
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error);
}

// Routes
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');

app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/enrollments', enrollmentRoutes);

app.get('/', (req, res) => {
  res.send('Aivra Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
