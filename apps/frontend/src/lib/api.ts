'use client';

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pf_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('pf_token');
      localStorage.removeItem('pf_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────
export const authApi = {
  login:   (email: string, password: string) =>
    api.post('/api/auth/login',  { email, password }),
  signup:  (email: string, password: string, name: string) =>
    api.post('/api/auth/signup', { email, password, name }),
  logout:  () => api.post('/api/auth/logout'),
  refresh: () => api.post('/api/auth/refresh'),
};

// ── Users ──────────────────────────────────────────────────
export const usersApi = {
  list:          ()           => api.get('/api/users'),
  getProfile:    (id: string) => api.get(`/api/users/${id}/profile`),
  updateProfile: (id: string, data: any) => api.patch(`/api/users/${id}/profile`, data),
  updateKyc:     (id: string, data: any) => api.patch(`/api/users/${id}/kyc`, data),
};

// ── Wallets ────────────────────────────────────────────────
export const walletsApi = {
  create:       (data: any)               => api.post('/api/wallets', data),
  getByUser:    (userId: string)          => api.get(`/api/wallets/user/${userId}`),
  getById:      (id: string)              => api.get(`/api/wallets/${id}`),
  deposit:      (id: string, data: any)   => api.post(`/api/wallets/${id}/deposit`, data),
  withdraw:     (id: string, data: any)   => api.post(`/api/wallets/${id}/withdraw`, data),
  transfer:     (data: any)               => api.post('/api/wallets/transfer', data),
  getLedger:    (id: string)              => api.get(`/api/wallets/${id}/ledger`),
};

// ── Payments ───────────────────────────────────────────────
export const paymentsApi = {
  process:   (data: any)  => api.post('/api/payments/process', data),
  getStatus: (id: string) => api.get(`/api/payments/${id}/status`),
};

// ── Transaction History ────────────────────────────────────
export const historyApi = {
  getByUser:   (userId: string, page = 1, limit = 20) =>
    api.get(`/api/history/${userId}`, { params: { page, limit } }),
  getByWallet: (walletId: string, page = 1, limit = 20) =>
    api.get(`/api/history/wallet/${walletId}`, { params: { page, limit } }),
};

// ── Notifications ──────────────────────────────────────────
export const notificationsApi = {
  getByUser: (userId: string) => api.get(`/api/notifications/${userId}`),
};

// ── Fraud ──────────────────────────────────────────────────
export const fraudApi = {
  listAlerts:      (page = 1, limit = 20) =>
    api.get('/api/fraud/alerts', { params: { page, limit } }),
  getAlertsByUser: (userId: string) =>
    api.get(`/api/fraud/alerts/user/${userId}`),
  resolveAlert:    (id: string) =>
    api.patch(`/api/fraud/alerts/${id}/resolve`, {}),
};
