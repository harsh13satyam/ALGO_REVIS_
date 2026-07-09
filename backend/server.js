require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth'); // ADD THIS LINE near the top
const problemRoutes = require('./routes/problems');
const { WebSocketServer } = require('ws');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/auth', authRoutes); // ADD THIS LINE
app.use('/api/problems', problemRoutes);

// Set up WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
    // Echo or broadcast logic can go here
  });

  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to WebSocket server!' }));
});

// Setup MongoDB Connection
// Note: Requires a local MongoDB instance running on default port.
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic hit check route
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
