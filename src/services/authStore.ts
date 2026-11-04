import { create } from 'zustand';
import API, { setAuthToken } from './api';
import { initializeMobileSocket, disconnectMobileSocket } from './socket';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  activeRole: 'customer' | 'helper';
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
    address: string;
  };
  isOnline: boolean;
  isVerified: boolean;
  stats: {
    tasksPosted: number;
    tasksCompleted: number;
    totalEarned: number;
    totalSpent: number;
    avgRatingAsHelper: number;
    avgRatingAsCustomer: number;
    ratingCountHelper: number;
    ratingCountCustomer: number;
  };
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { emailOrPhone: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  register: (userData: any) => Promise<{ success: boolean; message?: string }>;
  switchRole: (newRole: 'customer' | 'helper') => Promise<{ success: boolean }>;
  updateLocation: (coords: [number, number], address?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const res = await API.post('/auth/login', credentials);
      const { user, token } = res.data.data;

      setAuthToken(token);
      initializeMobileSocket(token);

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check network connection.';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      const res = await API.post('/auth/register', userData);
      const { user, token } = res.data.data;

      setAuthToken(token);
      initializeMobileSocket(token);

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  switchRole: async (newRole) => {
    try {
      const res = await API.post('/auth/switch-role', { role: newRole });
      set({ user: res.data.data });
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },

  updateLocation: async (coords, address) => {
    try {
      const res = await API.put('/users/location', {
        coordinates: coords,
        address: address || 'Current Location',
      });
      set({ user: res.data.data });
    } catch (err) {}
  },

  refreshUser: async () => {
    try {
      const res = await API.get('/auth/me');
      if (res.data?.data) {
        set({ user: res.data.data });
      }
    } catch (err) {}
  },

  logout: () => {
    setAuthToken(null);
    disconnectMobileSocket();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },
}));
