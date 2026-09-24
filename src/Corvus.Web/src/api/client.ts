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
  checkType?: 'http' | 'tcp';
  port?: number;
  sslExpiryDays?: number;
  sslIssuer?: string;
  isPublic?: boolean;
  displayOrder?: number;
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

export interface ContainerStats {
  containerId: string;
  cpuPercent: number;
  memoryUsageBytes: number;
  memoryLimitBytes: number;
  memoryPercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
}

export interface PushMonitor {
  id: string;
  token: string;
  name: string;
  expectedIntervalMinutes: number;
  gracePeriodMinutes: number;
  lastSeenAt?: string;
  status: 'healthy' | 'down' | 'unknown';
  createdAt: string;
}

export interface PublicService {
  id: string;
  name: string;
  description?: string;
  url?: string;
  icon?: string;
  category?: string;
  status: string;
  sslExpiryDays?: number;
  uptimePercentage: number;
  recentChecks: { id: number; status: string; responseTimeMs?: number; checkedAt: string }[];
}

export interface PublicStatusPage {
  systemStatus: 'all_operational' | 'some_degraded' | 'major_outage';
  services: PublicService[];
  generatedAt: string;
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
  reorderServices: (serviceIds: string[]) => fetchJson<{ success: boolean; message?: string }>('/services/reorder', {
    method: 'PUT',
    body: JSON.stringify({ serviceIds })
  }),

  // Public Status Page
  getPublicStatusPage: () => fetchJson<PublicStatusPage>('/status-page'),

  // Containers
  getContainers: () => fetchJson<DockerContainer[]>('/containers'),
  getContainerStats: (id: string) => fetchJson<ContainerStats>(`/containers/${id}/stats`),
  restartContainer: (id: string) => fetchJson<{ success: boolean }>(`/containers/${id}/restart`, {
    method: 'POST'
  }),
  startContainer: (id: string) => fetchJson<{ success: boolean }>(`/containers/${id}/start`, {
    method: 'POST'
  }),
  stopContainer: (id: string) => fetchJson<{ success: boolean }>(`/containers/${id}/stop`, {
    method: 'POST'
  }),
  pauseContainer: (id: string) => fetchJson<{ success: boolean }>(`/containers/${id}/pause`, {
    method: 'POST'
  }),
  unpauseContainer: (id: string) => fetchJson<{ success: boolean }>(`/containers/${id}/unpause`, {
    method: 'POST'
  }),
  getContainerLogs: (id: string, tail = 100) => fetchJson<{ containerId: string; lines: string[] }>(`/containers/${id}/logs?tail=${tail}`),

  // Dead Man's Snitch (Push Monitors)
  getPushMonitors: () => fetchJson<PushMonitor[]>('/push-monitors'),
  createPushMonitor: (data: { name: string; token?: string; expectedIntervalMinutes: number; gracePeriodMinutes: number }) => 
    fetchJson<PushMonitor>('/push-monitors', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePushMonitor: (id: string, data: { name: string; expectedIntervalMinutes: number; gracePeriodMinutes: number }) => 
    fetchJson<PushMonitor>(`/push-monitors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deletePushMonitor: (id: string) => fetchJson<{ success: boolean }>(`/push-monitors/${id}`, {
    method: 'DELETE'
  }),

  // Notifications
  testNotification: (data: { channel: string; webhookUrl?: string; botToken?: string; chatId?: string }) => 
    fetchJson<{ success: boolean; message: string }>('/notifications/test', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Metrics & System
  getSystemMetrics: (range = '24h') => fetchJson<SystemMetric[]>(`/metrics/system?range=${range}`),
  getLatestMetrics: () => fetchJson<SystemMetric>('/metrics/latest'),
  getBackupEvents: (limit = 10) => fetchJson<BackupEvent[]>(`/backup-events?limit=${limit}`),
  getSettings: () => fetchJson<Record<string, string>>('/settings'),
  updateSettings: (settings: Record<string, string>) => fetchJson<{ success: boolean }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  })
};
