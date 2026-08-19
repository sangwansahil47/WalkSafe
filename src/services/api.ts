import axios from 'axios';

let rawApiBase = (import.meta.env.VITE_API_URL || '').trim();
if (rawApiBase.endsWith('/api')) {
  rawApiBase = rawApiBase.slice(0, -4);
}
if (rawApiBase.endsWith('/')) {
  rawApiBase = rawApiBase.slice(0, -1);
}

export const api = axios.create({
  baseURL: rawApiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('safewalk_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on auth error
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('safewalk_token');
        localStorage.removeItem('safewalk_user');
      }
    }
    return Promise.reject(error);
  }
);
