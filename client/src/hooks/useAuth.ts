import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { ApiError, authApi } from '../api/authApi';
import { LoginFormData, RegisterFormData, ResetPasswordFormData } from '../types/auth';

export const useAuth = () => {
  const navigate = useNavigate();
  const { login: setAuth, logout: clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: (data) => {
      if (!data.token) {
        toast.error('Authentication failed');
        return;
      }
      setAuth(data.token);
      toast.success('Login successful!');
      navigate('/chat');
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Authentication failed';
      toast.error(message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => authApi.register(data),
    onSuccess: (data) => {
      toast.success(data.message);
      navigate('/login');
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Registration failed';
      toast.error(message);
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: (data) => {
      setAuth(data.token);
      toast.success(data.message || 'Email verified successfully!');
      navigate('/chat');
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Verification failed';
      toast.error(message);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Failed to send reset link';
      toast.error(message);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, data }: { token: string; data: ResetPasswordFormData }) =>
      authApi.resetPassword(token, data),
    onSuccess: (data) => {
      toast.success(data.message);
      navigate('/login');
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Failed to reset password';
      toast.error(message);
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Failed to resend verification';
      toast.error(message);
    },
  });

  const logout = async () => {
    try {
      await authApi.logout();
      clearAuth();
      navigate('/');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Logout failed';
      toast.error(message);
    }
  };

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    verifyEmail: verifyEmailMutation.mutate,
    forgotPassword: forgotPasswordMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    resendVerification: resendVerificationMutation.mutate,
    logout,
    isLoading: {
      login: loginMutation.isPending,
      register: registerMutation.isPending,
      verifyEmail: verifyEmailMutation.isPending,
      forgotPassword: forgotPasswordMutation.isPending,
      resetPassword: resetPasswordMutation.isPending,
      resendVerification: resendVerificationMutation.isPending,
    },
  };
};
