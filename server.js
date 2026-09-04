const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const projetRoutes = require('./src/routes/projet');
const timeEntryRoutes = require('./src/routes/timeEntry');
const dashboardRoutes = require('./src/routes/dashboard');
const tacheRoutes = require('./src/routes/tache');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projets', projetRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/taches', tacheRoutes);
app.get('/', (req, res) => {
  res.json({ message: '✅ PapaTime API running' });
});

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});