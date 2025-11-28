const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin Initialization
try {
  const serviceAccount = require('../project-aivra-firebase-adminsdk-fbsvc-3844a0ef19.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin Initialized');
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error);
}

// Routes
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Aivra Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
