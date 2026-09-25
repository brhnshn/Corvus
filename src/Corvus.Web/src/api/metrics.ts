import { fetchCachedJson } from './http';
import type { DashboardSummary, SystemMetric, BackupEvent } from '../types';

export const metricsApi = {
  getDashboardSummary: () => fetchCachedJson<DashboardSummary>('/dashboard/summary', undefined, 20000),

  getSystemMetrics: (range = '24h') => fetchCachedJson<SystemMetric[]>(`/metrics/system?range=${range}`, undefined, 30000),

  getLatestMetrics: () => fetchCachedJson<SystemMetric>('/metrics/latest', undefined, 15000),

  getBackupEvents: (limit = 10) => fetchCachedJson<BackupEvent[]>(`/backup-events?limit=${limit}`, undefined, 30000)
};
