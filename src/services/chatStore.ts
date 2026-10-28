import { create } from 'zustand';
import API from './api';
import { getMobileSocket } from './socket';

export interface ChatMessage {
  _id: string;
  taskId: string;
  senderId: {
    _id: string;
    name: string;
    avatar: string;
  };
  receiverId?: {
    _id: string;
    name: string;
    avatar: string;
  };
  content: string;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatConversation {
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  taskCategory: string;
  taskBudget?: { amount: number; currency: string };
  participant: {
    name: string;
    avatar: string;
    phone?: string;
  };
  isCustomer: boolean;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
    senderName: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface ChatState {
  messages: ChatMessage[];
  conversations: ChatConversation[];
  activeTaskId: string | null;
  isLoading: boolean;
  isLoadingConversations: boolean;
  typingUser: string | null;
  loadConversations: () => Promise<void>;
  loadMessages: (taskId: string) => Promise<void>;
  leaveRoom: (taskId: string) => void;
  sendMessage: (taskId: string, content: string, fileUri?: string) => Promise<{ success: boolean; data?: any }>;
  bindMobileChatEvents: () => void;
}

export const useMobileChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversations: [],
  activeTaskId: null,
  isLoading: false,
  isLoadingConversations: false,
  typingUser: null,

  loadConversations: async () => {
    try {
      set({ isLoadingConversations: true });
      const res = await API.get('/messages/conversations');
      set({ conversations: res.data.data || [], isLoadingConversations: false });
    } catch (err) {
      set({ isLoadingConversations: false });
    }
  },

  loadMessages: async (taskId) => {
    try {
      set({ isLoading: true, activeTaskId: taskId });
      const socket = getMobileSocket();
      if (socket) {
        socket.emit('join_task_room', taskId);
      }

      const res = await API.get(`/messages/task/${taskId}`);
      set({ messages: res.data.data || [], isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  leaveRoom: (taskId) => {
    const socket = getMobileSocket();
    if (socket && taskId) {
      socket.emit('leave_task_room', taskId);
    }
    set({ activeTaskId: null, messages: [] });
  },

  sendMessage: async (taskId, content) => {
    try {
      const res = await API.post('/messages', {
        taskId,
        content,
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
      return { success: false };
    }
  },

  bindMobileChatEvents: () => {
    const socket = getMobileSocket();
    if (!socket) return;

    socket.off('receive_message');
    socket.off('new_message');
    socket.off('typing_start');
    socket.off('typing_stop');

    socket.on('receive_message', (msg: ChatMessage) => {
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

    socket.on('new_message', (msg: ChatMessage) => {
      get().loadConversations();
    });

    socket.on('typing_start', ({ taskId, userName }: any) => {
      const { activeTaskId } = get();
      if (taskId?.toString() === activeTaskId?.toString()) {
        set({ typingUser: userName || 'Typing...' });
      }
    });

    socket.on('typing_stop', ({ taskId }: any) => {
      const { activeTaskId } = get();
      if (taskId?.toString() === activeTaskId?.toString()) {
        set({ typingUser: null });
      }
    });
  },
}));
