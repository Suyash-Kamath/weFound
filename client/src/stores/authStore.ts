import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { api, setToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        setToken(response.token);
        set({ user: { ...response.user, createdAt: new Date() } as User, isAuthenticated: true });
        return true;
      },

      register: async (email: string, password: string, name: string) => {
        const response = await api.post('/auth/register', { email, password, name });
        setToken(response.token);
        set({ user: { ...response.user, createdAt: new Date() } as User, isAuthenticated: true });
        return true;
      },

      logout: () => {
        setToken(null);
        set({ user: null, isAuthenticated: false });
      },

      updateUser: async (updates) => {
        const response = await api.put('/me', updates);
        set((state) => ({
          user: state.user ? { ...state.user, ...response } : null,
        }));
      },

      hydrate: async () => {
        try {
          const response = await api.get('/me');
          set({ user: { ...response, createdAt: new Date() } as User, isAuthenticated: true });
        } catch (error) {
          setToken(null);
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'lostfound-auth',
    }
  )
);
