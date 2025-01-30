const axios = require('axios');
const { API_URL } = require('../config');

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global error handling (optional)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`API Request Failed: ${error.config.url} - ${error.message}`);
    return Promise.reject(error);
  }
);

module.exports = axiosInstance;
