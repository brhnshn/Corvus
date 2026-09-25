import { fetchJson, fetchCachedJson, invalidateCache } from './http';
import type { Service } from '../types';

export const servicesApi = {
  getServices: () => fetchCachedJson<Service[]>('/services', undefined, 30000),
  
  getService: (id: string) => fetchCachedJson<Service>(`/services/${id}`, undefined, 30000),

  createService: async (data: Partial<Service>) => {
    const res = await fetchJson<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    invalidateCache('/services');
    invalidateCache('/dashboard');
    return res;
  },

  updateService: async (id: string, data: Partial<Service>) => {
    const res = await fetchJson<Service>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    invalidateCache('/services');
    invalidateCache('/dashboard');
    return res;
  },

  deleteService: async (id: string) => {
    const res = await fetchJson<{ success: boolean; message?: string }>(`/services/${id}`, {
      method: 'DELETE'
    });
    invalidateCache('/services');
    invalidateCache('/dashboard');
    return res;
  },

  reorderServices: async (serviceIds: string[]) => {
    const res = await fetchJson<{ success: boolean; message?: string }>('/services/reorder', {
      method: 'PUT',
      body: JSON.stringify({ serviceIds })
    });
    invalidateCache('/services');
    invalidateCache('/dashboard');
    return res;
  }
};
