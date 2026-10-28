import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create central Axios instance for SAMN mobile app
const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

API.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
