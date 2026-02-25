import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decodeJwt, isJwtExpired } from '@/lib/utils';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  displayName: string | null;

  setAuth: (token: string, userId: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      email: null,
      displayName: null,

      setAuth: (token: string, userId: string) => {
        const payload = decodeJwt(token);
        set({
          token,
          userId,
          email: (payload.email as string) ?? null,
          displayName: (payload.display_name as string) ?? null,
        });
      },

      logout: () => {
        set({ token: null, userId: null, email: null, displayName: null });
      },

      isAuthenticated: () => {
        const { token } = get();
        if (!token) return false;
        return !isJwtExpired(token);
      },
    }),
    {
      name: 'acc-auth',
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        email: state.email,
        displayName: state.displayName,
      }),
    },
  ),
);
