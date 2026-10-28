import { create } from 'zustand';
import API from '../services/api';
import { getSocket } from '../services/socket';

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  activeTaskId: null,
  isTyping: false,
  typingUsers: {},
  isLoading: false,
  isLoadingConversations: false,

  // Load all user chat conversations
  loadConversations: async () => {
    try {
      set({ isLoadingConversations: true });
      const res = await API.get('/messages/conversations');
      set({ conversations: res.data.data || [], isLoadingConversations: false });
    } catch (err) {
      set({ isLoadingConversations: false });
    }
  },

  // Load chat messages for a specific task
  loadMessages: async (taskId) => {
    try {
      set({ isLoading: true, activeTaskId: taskId });
      const socket = getSocket();
      if (socket) {
        socket.emit('join_task_room', taskId);
      }

      const res = await API.get(`/messages/task/${taskId}`);
      set({ messages: res.data.data || [], isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  // Leave current task chat room
  leaveChat: (taskId) => {
    const socket = getSocket();
    if (socket && taskId) {
      socket.emit('leave_task_room', taskId);
    }
    set({ activeTaskId: null, messages: [] });
  },

  // Send message
  sendMessage: async (taskId, content, file = null) => {
    try {
      const formData = new FormData();
      formData.append('taskId', taskId);
      if (content) formData.append('content', content);
      if (file) formData.append('media', file);

      const res = await API.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newMsg = res.data.data;
      if (newMsg) {
        set((state) => {
          if (state.messages.some((m) => m._id?.toString() === newMsg._id?.toString())) {
            return state;
          }
          return { messages: [...state.messages, newMsg] };
        });
      }
      get().loadConversations();
      return { success: true, data: newMsg };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to send message',
      };
    }
  },

  // Send typing indicator
  sendTyping: (taskId, isTyping) => {
    const socket = getSocket();
    if (!socket) return;
    if (isTyping) {
      socket.emit('typing_start', { taskId });
    } else {
      socket.emit('typing_stop', { taskId });
    }
  },

  // Bind real-time socket message listeners
  bindChatEvents: () => {
    const socket = getSocket();
    if (!socket) return;

    // Clean up any previously attached listeners to prevent duplicate triggers
    socket.off('receive_message');
    socket.off('new_message');
    socket.off('typing_start');
    socket.off('typing_stop');
    socket.off('messages_read');

    socket.on('receive_message', (msg) => {
      const { activeTaskId } = get();
      if (msg.taskId?.toString() === activeTaskId?.toString()) {
        set((state) => {
          if (state.messages.some((m) => m._id?.toString() === msg._id?.toString())) {
            return state;
          }
          return { messages: [...state.messages, msg] };
        });
      }
      get().loadConversations();
    });

    socket.on('new_message', (msg) => {
      get().loadConversations();
    });

    socket.on('typing_start', ({ taskId, userName }) => {
      const { activeTaskId } = get();
      if (taskId?.toString() === activeTaskId?.toString()) {
        set((state) => ({
          typingUsers: { ...state.typingUsers, [taskId]: userName || 'Typing...' },
        }));
      }
    });

    socket.on('typing_stop', ({ taskId }) => {
      set((state) => {
        const updated = { ...state.typingUsers };
        delete updated[taskId];
        return { typingUsers: updated };
      });
    });

    socket.on('messages_read', ({ taskId }) => {
      const { activeTaskId } = get();
      if (taskId?.toString() === activeTaskId?.toString()) {
        set((state) => ({
          messages: state.messages.map((m) => ({ ...m, isRead: true })),
        }));
      }
    });
  },
}));
