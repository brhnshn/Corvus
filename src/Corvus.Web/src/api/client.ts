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

export interface UptimeCheckItem {
  id: number;
  serviceId: string;
  checkedAt: string;
  status: string;
  responseTimeMs?: number;
  errorMessage?: string;
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
      } else if (errBody?.detail) {
        errMsg = errBody.detail;
      } else if (errBody?.title) {
        errMsg = errBody.title;
      } else if (errBody?.error) {
        errMsg = typeof errBody.error === 'string' ? errBody.error : JSON.stringify(errBody.error);
      }
    } catch {
      // fallback to status text
    }
    throw new Error(errMsg);
  }

  return res.json();
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const apiCache = new Map<string, CacheEntry<unknown>>();

export function invalidateCache(urlPattern?: string) {
  if (!urlPattern) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(urlPattern)) {
      apiCache.delete(key);
    }
  }
}

export async function fetchCachedJson<T>(url: string, options?: RequestInit, ttlMs = 30000): Promise<T> {
  if (options && options.method && options.method.toUpperCase() !== 'GET') {
    return fetchJson<T>(url, options);
  }

  const now = Date.now();
  const cached = apiCache.get(url) as CacheEntry<T> | undefined;

  if (cached && (now - cached.timestamp < cached.ttl)) {
    return cached.data;
  }

  const data = await fetchJson<T>(url, options);
  apiCache.set(url, { data, timestamp: now, ttl: ttlMs });
  return data;
}

export const api = {
  // Auth
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
  toggleRegistration: (enabled: boolean) => fetchJson<{ success: boolean; message?: string }>('/auth/toggle-registration', {
    method: 'POST',
    body: JSON.stringify({ enabled })
  }),
  logout: async () => {
    const res = await fetchJson<{ success: boolean; message?: string }>('/auth/logout', {
      method: 'POST'
    });
    invalidateCache();
    return res;
  },

  // Dashboard & Services (Cache-First)
  getDashboardSummary: () => fetchCachedJson<DashboardSummary>('/dashboard/summary', undefined, 20000),
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
  },

  // Public Status Page
  getPublicStatusPage: () => fetchJson<PublicStatusPage>('/status-page'),

  // Containers (Cache-First)
  getContainers: () => fetchCachedJson<DockerContainer[]>('/containers', undefined, 15000),
  getContainerStats: (id: string) => fetchJson<ContainerStats>(`/containers/${id}/stats`),
  restartContainer: async (id: string) => {
    const res = await fetchJson<{ success: boolean; message?: string }>(`/containers/${id}/restart`, {
      method: 'POST'
    });
    invalidateCache('/containers');
    invalidateCache('/services');
    invalidateCache('/dashboard');
    return res;
  },
  startContainer: async (id: string) => {
    const res = await fetchJson<{ success: boolean; message?: string }>(`/containers/${id}/start`, {
      method: 'POST'
    });
    invalidateCache('/containers');
    invalidateCache('/services');
    invalidateCache('/dashboard');
    return res;
  },
  stopContainer: async (id: string) => {
    const res = await fetchJson<{ success: boolean; message?: string }>(`/containers/${id}/stop`, {
      method: 'POST'
    });
    invalidateCache('/containers');
    invalidateCache('/services');
    invalidateCache('/dashboard');
    return res;
  },
  pauseContainer: async (id: string) => {
    const res = await fetchJson<{ success: boolean; message?: string }>(`/containers/${id}/pause`, {
      method: 'POST'
    });
    invalidateCache('/containers');
    invalidateCache('/services');
    invalidateCache('/dashboard');
    return res;
  },
  unpauseContainer: async (id: string) => {
    const res = await fetchJson<{ success: boolean; message?: string }>(`/containers/${id}/unpause`, {
      method: 'POST'
    });
    invalidateCache('/containers');
    invalidateCache('/services');
    invalidateCache('/dashboard');
    return res;
  },
  getContainerLogs: (id: string, tail = 100) => fetchJson<{ containerId: string; lines: string[] }>(`/containers/${id}/logs?tail=${tail}`),

  // Dead Man's Snitch (Push Monitors - Cache-First)
  getPushMonitors: () => fetchCachedJson<PushMonitor[]>('/push-monitors', undefined, 30000),
  createPushMonitor: async (data: { name: string; token?: string; expectedIntervalMinutes: number; gracePeriodMinutes: number }) => {
    const res = await fetchJson<PushMonitor>('/push-monitors', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    invalidateCache('/push-monitors');
    return res;
  },
  updatePushMonitor: async (id: string, data: { name: string; expectedIntervalMinutes: number; gracePeriodMinutes: number }) => {
    const res = await fetchJson<PushMonitor>(`/push-monitors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    invalidateCache('/push-monitors');
    return res;
  },
  deletePushMonitor: async (id: string) => {
    const res = await fetchJson<{ success: boolean }>(`/push-monitors/${id}`, {
      method: 'DELETE'
    });
    invalidateCache('/push-monitors');
    return res;
  },

  // Uptime Checks
  getUptimeChecks: (serviceId: string, range = '7d') => 
    fetchJson<UptimeCheckItem[]>(`/uptime?service_id=${serviceId}&range=${range}`),

  // Notifications
  testNotification: (data: { channel: string; webhookUrl?: string; botToken?: string; chatId?: string }) => 
    fetchJson<{ success: boolean; message: string }>('/notifications/test', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Metrics & System (Cache-First)
  getSystemMetrics: (range = '24h') => fetchCachedJson<SystemMetric[]>(`/metrics/system?range=${range}`, undefined, 30000),
  getLatestMetrics: () => fetchCachedJson<SystemMetric>('/metrics/latest', undefined, 15000),
  getBackupEvents: (limit = 10) => fetchCachedJson<BackupEvent[]>(`/backup-events?limit=${limit}`, undefined, 30000),
  // Settings & DB Management
  getSettings: () => fetchCachedJson<Record<string, string>>('/settings', undefined, 60000),
  updateSettings: async (settings: Record<string, string>) => {
    const res = await fetchJson<{ success: boolean }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    invalidateCache('/settings');
    return res;
  },
  getDbStats: () => fetchJson<{ formattedSize: string; sizeBytes: number; dbSizeBytes: number; walSizeBytes: number }>('/settings/db-stats'),
  downloadBackup: async () => {
    const res = await fetch('/api/backup/download');
    if (!res.ok) throw new Error('Yedek indirilemedi');
    return res.blob();
  },

  // Version & Updates
  getVersion: () => fetchCachedJson<VersionInfo>('/version', undefined, 300000)
};

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  isUpdateAvailable: boolean;
  releaseUrl: string;
}

