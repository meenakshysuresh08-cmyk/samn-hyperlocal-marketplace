import { create } from 'zustand';
import API from '../services/api';
import { initializeSocket, disconnectSocket } from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('samn_token') || null,
  isAuthenticated: !!localStorage.getItem('samn_token'),
  isLoading: false,
  error: null,
  userLocation: {
    coordinates: [77.5946, 12.9716], // [lng, lat]
    address: 'Bengaluru, Karnataka',
  },

  // Initialize auth session
  initAuth: async () => {
    const token = localStorage.getItem('samn_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await API.get('/auth/me');
      const user = res.data.data;
      
      set({ user, isAuthenticated: true, isLoading: false });
      initializeSocket(token);

      // Try fetching current browser geolocation and resolving real standard address
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const coords = [pos.coords.longitude, pos.coords.latitude];
            let standardAddress = user.location?.address && user.location.address !== 'Current Browser Location'
              ? user.location.address
              : 'Bengaluru, Karnataka';

            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=16&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData?.address) {
                  const addr = geoData.address;
                  const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village;
                  const city = addr.city || addr.town || addr.state_district || addr.state;
                  if (locality && city) {
                    standardAddress = `${locality}, ${city}`;
                  } else if (geoData.display_name) {
                    standardAddress = geoData.display_name.split(',').slice(0, 3).join(',').trim();
                  }
                }
              }
            } catch (e) {
              // Fallback to user standard address
            }

            set({
              userLocation: {
                coordinates: coords,
                address: standardAddress,
              },
            });
            // Update backend user location
            API.put('/users/location', { coordinates: coords, address: standardAddress }).catch(() => {});
          },
          (err) => console.warn('Geolocation permission not granted:', err.message)
        );
      }
    } catch (err) {
      console.warn('Auth token invalid, clearing session');
      localStorage.removeItem('samn_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Register
  register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      const res = await API.post('/auth/register', userData);
      const { user, token } = res.data.data;

      localStorage.setItem('samn_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      initializeSocket(token);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  // Login
  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const res = await API.post('/auth/login', credentials);
      const { user, token } = res.data.data;

      localStorage.setItem('samn_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      initializeSocket(token);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  // Switch role (Customer <-> Helper)
  switchRole: async (newRole) => {
    try {
      set({ isLoading: true });
      const res = await API.post('/auth/switch-role', { role: newRole });
      const updatedUser = res.data.data;
      set({ user: updatedUser, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: 'Failed to switch role' };
    }
  },

  // Update profile
  updateProfile: async (formData) => {
    try {
      set({ isLoading: true });
      const res = await API.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ user: res.data.data, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: err.response?.data?.message || 'Failed to update profile' };
    }
  },

  // Update location directly
  setLocation: (coordinates, address) => {
    set({
      userLocation: { coordinates, address },
    });
    API.put('/users/location', { coordinates, address }).catch(() => {});
  },

  // Refresh and get live GPS coordinates from device
  fetchBrowserLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = [pos.coords.longitude, pos.coords.latitude];
          let standardAddress = 'Current Location';
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=16&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData?.address) {
                const addr = geoData.address;
                const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village;
                const city = addr.city || addr.town || addr.state_district || addr.state;
                if (locality && city) {
                  standardAddress = `${locality}, ${city}`;
                } else if (geoData.display_name) {
                  standardAddress = geoData.display_name.split(',').slice(0, 3).join(',').trim();
                }
              }
            }
          } catch (e) {}

          set({
            userLocation: {
              coordinates: coords,
              address: standardAddress,
            },
          });
          API.put('/users/location', { coordinates: coords, address: standardAddress }).catch(() => {});
          resolve({ coordinates: coords, address: standardAddress });
        },
        (err) => {
          console.warn('Geolocation failed:', err.message);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },

  // Geocode and set manual location from address string
  setManualLocation: async (addressOrQuery) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressOrQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const item = results[0];
          const coords = [parseFloat(item.lon), parseFloat(item.lat)];
          const cleanAddr = item.display_name.split(',').slice(0, 3).join(',').trim();
          set({
            userLocation: {
              coordinates: coords,
              address: cleanAddr,
            },
          });
          API.put('/users/location', { coordinates: coords, address: cleanAddr }).catch(() => {});
          return { success: true, coordinates: coords, address: cleanAddr };
        }
      }
      return { success: false, message: 'Location not found' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('samn_token');
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },
}));
