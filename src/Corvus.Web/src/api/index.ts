import { authApi } from './auth';
import { servicesApi } from './services';
import { containersApi } from './containers';
import { uptimeApi } from './uptime';
import { metricsApi } from './metrics';
import { settingsApi } from './settings';

export const api = {
  ...authApi,
  ...servicesApi,
  ...containersApi,
  ...uptimeApi,
  ...metricsApi,
  ...settingsApi
};

export { fetchJson, fetchCachedJson, invalidateCache } from './http';
export { authApi } from './auth';
export { servicesApi } from './services';
export { containersApi } from './containers';
export { uptimeApi } from './uptime';
export { metricsApi } from './metrics';
export { settingsApi } from './settings';
export * from '../types';
