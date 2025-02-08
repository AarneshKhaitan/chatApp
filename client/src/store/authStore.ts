import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { User } from '../types/chat';
import api from '../api/api'; 
import { tokenService } from '../api/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void; 
  logout: () => void;
  setUser: (user: User | null) => void;
}

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: tokenService.getToken(),
      user: null,
      isAuthenticated: !!tokenService.getToken(),
      login: (token) => {
        const decoded = jwtDecode<JwtPayload>(token);
        console.log('Decoded token:', decoded);
        
        tokenService.setToken(token);

        api.get<User>('/api/auth/me')
          .then(response => {
            set({
              token,
              user: response.data, 
              isAuthenticated: true,
            });
          })
          .catch(console.error);
      },
      logout: () => {
        tokenService.removeToken();
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
      setUser: (user: User | null) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);