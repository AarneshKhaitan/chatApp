import axios from 'axios';
import { LoginFormData, RegisterFormData, ResetPasswordFormData } from '../types/auth';
import { User } from '../types/user'; 
import api, { tokenService, ApiError } from './api';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
}

export interface VerifyEmailResponse {
  token: string;
  message?: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export const authApi = {
  login: async (credentials: LoginFormData): Promise<LoginResponse> => {
    try {
      const { data } = await api.post<LoginResponse>('/api/auth/login', credentials);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new ApiError(500, 'Network error - Please check your connection');
        }
        throw new ApiError(
          error.response.status,
          error.response.data?.message || 'Login failed'
        );
      }
      throw new ApiError(500, 'Authentication failed');
    }
  },

  register: async (userData: RegisterFormData): Promise<RegisterResponse> => {
    try {
      
      const response = await api.post('/api/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password
      });

      
      if (!response.data) {
        throw new ApiError(500, 'Invalid response format from server');
      }
      
      return { 
        message: response.data.message || 'Registration successful!' 
      };
    } catch (error) {
      
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new ApiError(500, 'Network error - Please check your connection');
        }
        
        // Handle specific error cases
        const errorMessage = error.response.data?.error || error.response.data?.message;
        if (errorMessage?.includes('already exists')) {
          throw new ApiError(400, 'An account with this email already exists');
        }
        
        throw new ApiError(
          error.response.status,
          errorMessage || 'Registration failed - Please check your input'
        );
      }
      throw new ApiError(500, 'Registration failed - Please try again');
    }
  },

  logout: async (): Promise<{ message: string }> => {
    try {
      const { data } = await api.post<{ message: string }>('/api/auth/logout');
      tokenService.removeToken(); // Remove token on logout
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Logout failed'
        );
      }
      throw error;
    }
  },

  verifyEmail: async (token: string): Promise<VerifyEmailResponse> => {
    try {
      const { data } = await api.get<VerifyEmailResponse>(`/api/auth/verify-email/${token}`);

      if (!data?.token) {
        throw new ApiError(500, 'Invalid response format');
      }

      return {
        token: data.token,
        message: data.message
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new ApiError(500, 'Network error - Please check your connection');
        }
        throw new ApiError(
          error.response.status,
          error.response.data?.message || 'Verification failed'
        );
      }
      throw new ApiError(500, 'Verification failed');
    }
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    try {
      const { data } = await api.post<ForgotPasswordResponse>('/api/auth/forgot-password', { email });
      return { message: data.message || 'Reset link sent to your email' };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new ApiError(500, 'Network error - Please check your connection');
        }
        throw new ApiError(
          error.response.status,
          error.response.data?.message || 'Failed to process request'
        );
      }
      throw new ApiError(500, 'An unexpected error occurred');
    }
  },

  resetPassword: async (token: string, data: ResetPasswordFormData): Promise<ResetPasswordResponse> => {
    try {
      const response = await api.post<ResetPasswordResponse>(
        `/api/auth/reset-password/${token}`,
        { password: data.password }
      );

      if (!response.data) {
        throw new ApiError(500, 'No response from server');
      }

      return {
        message: response.data.message || 'Password reset successful'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new ApiError(500, 'Network error - Please check your connection');
        }
        throw new ApiError(
          error.response.status,
          error.response.data?.message || 'Password reset failed'
        );
      }
      throw new ApiError(500, 'Failed to reset password');
    }
  },
  resendVerification: async (email: string): Promise<{ message: string }> => {  
    try {
      const { data } = await api.post<{ message: string }>('/api/auth/resend-verification', { 
        email: email 
      });
      
      if (!data?.message) {
        throw new ApiError(500, 'Invalid response from server');
      }
      
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new ApiError(500, 'Network error - Please check your connection');
        }
        throw new ApiError(
          error.response.status,
          error.response.data?.message || 'Failed to resend verification email'
        );
      }
      throw new ApiError(500, 'An unexpected error occurred');
    }
  },
};

export { ApiError };