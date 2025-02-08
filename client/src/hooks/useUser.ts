import { useMutation } from '@tanstack/react-query';
import api from '../api/api';
import { User } from '../types/user';

export const useSearchUsers = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.get<User[]>(`/api/users/search`, {
        params: { email } // Changed from search to email to match backend
      });
      return data;
    }
  });
};
