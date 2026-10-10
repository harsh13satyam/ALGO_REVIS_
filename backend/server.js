require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');

const { connectDB } = require('./config/db');
const { startScheduler, stopScheduler } = require('./services/scheduler');

// Route imports
const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const challengeRoutes = require('./routes/challenges');
const whatsappWebhookRoutes = require('./routes/whatsappWebhook');
const healthRoutes = require('./routes/health');

const app = express();
const server = http.createServer(app);

// CORS configuration permitting credentials from production frontend and local dev
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure database connection in both standalone and serverless environments
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/whatsapp/webhook', whatsappWebhookRoutes);
app.use('/api/health', healthRoutes);

// Root API status endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: '🚀 AlgoRevis Backend API is active and running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      auth: '/api/auth',
      problems: '/api/problems',
      challenges: '/api/challenges'
    }
  });
});

// Legacy hit check route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    dbConnected: mongoose.connection.readyState === 1
  });
});

// Set up WebSocket server (retained for future real-time collaboration)
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
  });
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to AlgoRevis WebSocket server!' }));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : (err.message || 'Server error');
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

// Initialize Database & Start Server
const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDB();

  // Start background scheduler
  startScheduler(60000);

  server.listen(PORT, () => {
    console.log(`🚀 [AlgoRevis] Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  stopScheduler();
  wss.close();
  server.close(async () => {
    console.log('HTTP server closed.');
    await mongoose.connection.close(false);
    console.log('MongoDB connection closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.app = app;
module.exports.server = server;
module.exports.startServer = startServer;
