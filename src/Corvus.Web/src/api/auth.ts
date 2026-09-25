import { fetchJson, invalidateCache } from './http';
import type { AuthStatus } from '../types';

export const authApi = {
  getAuthStatus: () => fetchJson<AuthStatus>('/auth/status'),

  login: async (data: { username: string; password: string }) => {
    const res = await fetchJson<{ success: boolean; message?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    invalidateCache();
    return res;
  },

  register: async (data: { username: string; password: string }) => {
    const res = await fetchJson<{ success: boolean; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    invalidateCache();
    return res;
  },

  toggleRegistration: (enabled: boolean) => 
    fetchJson<{ success: boolean; message?: string }>('/auth/toggle-registration', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    }),

  logout: async () => {
    const res = await fetchJson<{ success: boolean; message?: string }>('/auth/logout', {
      method: 'POST'
    });
    invalidateCache();
    return res;
  }
};
