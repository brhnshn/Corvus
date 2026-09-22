export interface Service {
  id: string;
  source: 'docker' | 'manual';
  containerId?: string;
  name: string;
  description?: string;
  url?: string;
  icon?: string;
  category?: string;
  healthCheckUrl?: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  createdAt: string;
  updatedAt: string;
}

export interface DockerContainer {
  Id: string;
  Names?: string[];
  Image: string;
  State: string;
  Status: string;
  Created: number;
  Ports?: { IP?: string; PrivatePort: number; PublicPort?: number; Type?: string }[];
  Labels?: Record<string, string>;
}

export interface SystemMetric {
  id: number;
  recordedAt: string;
  cpuPercent: number;
  ramUsedMb: number;
  ramTotalMb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  networkRxBytes: number;
  networkTxBytes: number;
}

export interface BackupEvent {
  id: number;
  token: string;
  receivedAt: string;
  status: 'success' | 'failure';
  sizeBytes?: number;
  message?: string;
}

export interface DashboardSummary {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  totalContainers: number;
  runningContainers: number;
  lastBackup?: BackupEvent;
  latestMetrics?: SystemMetric;
}

export interface AuthStatus {
  authEnabled: boolean;
  isAuthenticated: boolean;
  username?: string | null;
  hasUsers: boolean;
  registrationEnabled: boolean;
}

const API_BASE = '/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody?.message) {
        errMsg = errBody.message;
      }
    } catch {
      // fallback to status text
    }
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  getAuthStatus: () => fetchJson<AuthStatus>('/auth/status'),
  login: (data: { username: string; password: string }) => fetchJson<{ success: boolean; message?: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  register: (data: { username: string; password: string }) => fetchJson<{ success: boolean; message?: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  toggleRegistration: (enabled: boolean) => fetchJson<{ success: boolean; message?: string }>('/auth/toggle-registration', {
    method: 'POST',
    body: JSON.stringify({ enabled })
  }),
  logout: () => fetchJson<{ success: boolean; message?: string }>('/auth/logout', {
    method: 'POST'
  }),

  // Dashboard & Services
  getDashboardSummary: () => fetchJson<DashboardSummary>('/dashboard/summary'),
  getServices: () => fetchJson<Service[]>('/services'),
  getService: (id: string) => fetchJson<Service>(`/services/${id}`),
  createService: (data: Partial<Service>) => fetchJson<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateService: (id: string, data: Partial<Service>) => fetchJson<Service>(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteService: (id: string) => fetchJson<{ success: boolean; message?: string }>(`/services/${id}`, {
    method: 'DELETE'
  }),
  getContainers: () => fetchJson<DockerContainer[]>('/containers'),
  restartContainer: (id: string) => fetchJson<{ success: boolean }>(`/containers/${id}/restart`, {
    method: 'POST'
  }),
  getSystemMetrics: (range = '24h') => fetchJson<SystemMetric[]>(`/metrics/system?range=${range}`),
  getLatestMetrics: () => fetchJson<SystemMetric>('/metrics/latest'),
  getBackupEvents: (limit = 10) => fetchJson<BackupEvent[]>(`/backup-events?limit=${limit}`),
  getSettings: () => fetchJson<Record<string, string>>('/settings'),
  updateSettings: (settings: Record<string, string>) => fetchJson<{ success: boolean }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  })
};
