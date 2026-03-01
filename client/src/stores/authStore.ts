import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { ApiError, api, getToken, setToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
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
      isHydrating: true,

      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        setToken(response.token);
        set({ user: { ...response.user, createdAt: new Date() } as User, isAuthenticated: true, isHydrating: false });
        return true;
      },

      register: async (email: string, password: string, name: string) => {
        const response = await api.post('/auth/register', { email, password, name });
        setToken(response.token);
        set({ user: { ...response.user, createdAt: new Date() } as User, isAuthenticated: true, isHydrating: false });
        return true;
      },

      logout: () => {
        setToken(null);
        set({ user: null, isAuthenticated: false, isHydrating: false });
      },

      updateUser: async (updates) => {
        const response = await api.put('/me', updates);
        set((state) => ({
          user: state.user ? { ...state.user, ...response } : null,
        }));
      },

      hydrate: async () => {
        set({ isHydrating: true });
        const token = getToken();
        if (!token) {
          set({ user: null, isAuthenticated: false, isHydrating: false });
          return;
        }

        try {
          const response = await api.get('/me');
          set({ user: { ...response, createdAt: new Date() } as User, isAuthenticated: true, isHydrating: false });
        } catch (error) {
          const authFailed = error instanceof ApiError && (error.status === 401 || error.status === 403);
          if (authFailed) {
            setToken(null);
            set({ user: null, isAuthenticated: false, isHydrating: false });
            return;
          }
          set({ isHydrating: false });
        }
      },
    }),
    {
      name: 'lostfound-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
