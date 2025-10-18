import { create } from 'zustand';
import type { AuthState, User, MemberProfile } from '@/types/auth.types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  memberProfile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  setUser: (user: User | null, memberProfile?: MemberProfile | null) =>
    set({
      user,
      memberProfile: memberProfile ?? null,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }),
  clearUser: () =>
    set({
      user: null,
      memberProfile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
}));
