import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { token, user, isAuthenticated, login, logout } = useAuthStore();
  
  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  };
};