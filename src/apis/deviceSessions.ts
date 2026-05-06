import { httpClient } from './http';

export interface DeviceSession {
  id: string;
  username?: string;
  source?: string;
  userAgent?: string;
  ipAddress?: string;
  revoked?: boolean;
  lastSeenAt?: string;
  revokedAt?: string;
  createdAt?: string;
}

export const deviceSessionsApi = {
  getMySessions: async (): Promise<DeviceSession[]> => {
    return httpClient.get<DeviceSession[]>('/api/users/me/sessions', true, true);
  },

  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    return httpClient.delete<{ message: string }>(`/api/users/me/sessions/${encodeURIComponent(sessionId)}`, true, true);
  },

  revokeAll: async (): Promise<{ message: string; revoked?: number }> => {
    return httpClient.post<{ message: string; revoked?: number }>('/api/users/me/sessions/revoke-all', {}, true, true);
  },
};
