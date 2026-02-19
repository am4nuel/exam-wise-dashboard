import axios from 'axios';

const API = axios.create({
  baseURL: 'https://examwise.up.railway.app/api',
});

// Add a request interceptor to include the token in headers
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
