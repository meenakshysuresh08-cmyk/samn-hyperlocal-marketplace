import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';

let socket: Socket | null = null;

export const initializeMobileSocket = (token?: string | null): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[SAMN Mobile Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (error) => {
    console.warn('[SAMN Mobile Socket Error]:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[SAMN Mobile Socket] Disconnected:', reason);
  });

  return socket;
};

export const getMobileSocket = (): Socket | null => {
  return socket;
};

export const disconnectMobileSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
