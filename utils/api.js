const axios = require('axios');
const { API_URL, SCUTTLE_API_KEY } = require('../config');

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': SCUTTLE_API_KEY,
  },
});

// Global error handling (optional)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      `API Request Failed: ${error.config?.url || 'Unknown URL'} - ${
        error.message
      }`
    );
    return Promise.reject(error);
  }
);

module.exports = axiosInstance;
