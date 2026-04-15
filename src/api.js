// frontend/src/api.js
import axios from 'axios';

const BASE_URL = 'https://unianalytics-api.onrender.com/api/v1';

// 1. Create the Base Axios Instance
const apiClient = axios.create({
  baseURL: BASE_URL,
});

// 2. Automatic Security Interceptor
// This runs before EVERY request. It checks for the token and attaches it automatically,
// so you never have to manually write headers for authorized routes again.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('uni_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Structured Helper Methods
export const api = {
  // 1. Enterprise Registration
  register: async (userData) => {
    try {
      // Split the full name into first and last name for the backend
      const nameParts = userData.name.trim().split(/\s+/);
      const formattedData = {
        first_name: nameParts[0] || 'User',
        last_name: nameParts.slice(1).join(' ') || 'Teacher',
        email: userData.email,
        password: userData.password,
        dob: userData.dob,
        gender: "Not Specified" // Default to satisfy backend model if necessary
      };
      
      const response = await apiClient.post('/register', formattedData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  // 2. Login Function
  login: async (email, password) => {
    try {
      // FastAPI expects OAuth2 login data as form-data, not JSON
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

  // 3. Fetch Student Report
  getStudentReport: async () => {
    const response = await apiClient.get('/student/report-card');
    return response.data;
  },

  // 4. Fetch all students for the Roster Grid
  getStudents: async () => {
    const response = await apiClient.get('/students');
    return response.data;
  },

  // 5. Bulk Upload Students via CSV
  uploadStudentsCSV: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Axios automatically sets the correct multipart boundary headers
      const response = await apiClient.post('/teacher/students/bulk-upload', formData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to upload CSV');
    }
  },

  // 6. Export Students to CSV
  exportStudentsCSV: async () => {
    try {
      // The responseType 'blob' is required for Axios to handle raw file downloads correctly
      const response = await apiClient.get('/teacher/students/export', {
        responseType: 'blob' 
      });

      // Convert the response into a raw file (Blob)
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'UniAnalytics_Class_Roster.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up memory
    } catch (error) {
      // FIXED: 'error' variable is now utilized to satisfy ESLint
      throw new Error(error.response?.data?.detail || error.message || 'Failed to generate export');
    }
  }
};

// 4. Export the base client as default
export default apiClient;