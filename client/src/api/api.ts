import axios from 'axios';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const api = axios.create({
    // Remove /api from baseURL since it's handled by the proxy
    baseURL: "",
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
    // Only log non-sensitive information
    console.log('Request:', {
      url: config.url,
      method: config.method,
      // Remove data logging for auth endpoints
      ...(!(config.url?.includes('/auth/')) && { data: config.data }),
    });
    return config;
  },
  (error) => {
    console.error('Request failed');
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
      console.log('Response received');
    }
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      message: 'Request failed'
    });
    return Promise.reject(error);
  }
);

export default api;