import axios from 'axios';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true,
});
  
const TOKEN_KEY = 'auth_token';
  
export const tokenService = {
    getToken: () => localStorage.getItem(TOKEN_KEY),
    setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    removeToken: () => localStorage.removeItem(TOKEN_KEY),
    isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

// Update the api interceptor to use tokenService
api.interceptors.request.use((config) => {
  const token = tokenService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Modify the interceptors to hide sensitive data
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add unauthorized response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Only log non-sensitive information
    if (!response.config.url?.includes('/auth/')) {
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;