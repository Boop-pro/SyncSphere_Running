import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Crucial for HTTP-only session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach session token as fallback for cookie-restricted environments
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('syncsphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-Session-Token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration or network failures cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If a request fails with 401 Unauthorized and not already on auth pages, let caller handle or redirect
    if (error.response && error.response.status === 401) {
      const publicPaths = ['/login', '/register', '/reset-password'];
      if (!publicPaths.includes(window.location.pathname)) {
        // Broadcast custom event or handle session expiry
        console.warn('Session expired or unauthorized request.');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
