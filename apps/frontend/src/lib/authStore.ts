'use client';
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('pf_token');
    const raw   = localStorage.getItem('pf_user');
    if (token && raw) {
      try {
        set({ token, user: JSON.parse(raw), isAuthenticated: true });
      } catch {}
    }
  },

  setAuth: (token, user) => {
    localStorage.setItem('pf_token', token);
    localStorage.setItem('pf_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('pf_token');
    localStorage.removeItem('pf_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
