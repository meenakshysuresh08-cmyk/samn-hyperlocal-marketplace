require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const { initFallbackBroadcastJob } = require('./src/jobs/fallbackBroadcast.job');

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start background cron jobs (Fallback broadcast every 2 mins)
    initFallbackBroadcastJob();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`🚀 SAMN Backend Server running on port ${PORT}`);
      console.log(`📡 Local URL:   http://localhost:${PORT}`);
      console.log(`📡 Network URL: http://0.0.0.0:${PORT}`);
      console.log(`⚡ Socket.IO initialized on same port`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start SAMN server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
