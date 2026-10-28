const { getIO } = require('../config/socket');

const emitToUser = (userId, eventName, data) => {
  try {
    const io = getIO();
    io.to(`user:${userId.toString()}`).emit(eventName, data);
  } catch (error) {
    console.warn(`[Socket Service Error] Failed to emit ${eventName} to user ${userId}:`, error.message);
  }
};

const emitToTaskRoom = (taskId, eventName, data) => {
  try {
    const io = getIO();
    io.to(`task:${taskId.toString()}`).emit(eventName, data);
  } catch (error) {
    console.warn(`[Socket Service Error] Failed to emit ${eventName} to room task:${taskId}:`, error.message);
  }
};

const broadcastToAll = (eventName, data) => {
  try {
    const io = getIO();
    io.emit(eventName, data);
  } catch (error) {
    console.warn(`[Socket Service Error] Failed to broadcast ${eventName}:`, error.message);
  }
};

module.exports = {
  emitToUser,
  emitToTaskRoom,
  broadcastToAll,
};
