// frontend/src/api.js
import axios from 'axios';

const BASE_URL = 'https://unianalytics-api.onrender.com/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('uni_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  register: async (userData) => {
    try {
      const nameParts = userData.name.trim().split(/\s+/);
      const formattedData = {
        first_name: nameParts[0] || 'User',
        last_name: nameParts.slice(1).join(' ') || 'Teacher',
        email: userData.email,
        password: userData.password,
        dob: userData.dob,
        gender: "Not Specified"
      };
      
      const response = await apiClient.post('/register', formattedData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  login: async (email, password) => {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await apiClient.post('/login', formData);
      localStorage.setItem('uni_token', response.data.access_token);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Invalid credentials');
    }
  },

  // --- NEW: CLOUD DATABASE METHODS ---
  
  // Pulls the massive JSON from Neon when the user logs in
  getCloudMasterData: async () => {
    try {
      const response = await apiClient.get('/get-master-data');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch cloud data:", error);
      return []; // Return empty array on fail so app doesn't crash
    }
  },

  // Pushes the massive JSON to Neon when the user uploads Excel or edits a grade
  syncCloudMasterData: async (data) => {
    try {
      const response = await apiClient.post('/sync-master-data', data);
      return response.data;
    } catch (error) {
      console.error("Failed to sync data to cloud:", error);
      throw error;
    }
  }
};

export default apiClient;