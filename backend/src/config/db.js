const mongoose = require('mongoose');

let isConnecting = false;
let reconnectTimer = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;

  isConnecting = true;
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samn', {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    scheduleReconnect();
  } finally {
    isConnecting = false;
  }
};

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (mongoose.connection.readyState !== 1) {
      console.log('[MongoDB] Retrying database connection...');
      connectDB();
    }
  }, 4000);
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Warning] Lost connection to database. Auto-reconnecting...');
  scheduleReconnect();
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB Error]:', err.message);
  scheduleReconnect();
});

module.exports = connectDB;
