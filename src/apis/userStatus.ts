import { httpClient } from './http';

export interface UserStatus {
  statusText?: string;
  statusEmoji?: string;
}

/** PATCH /api/users/me/status — requires auth token in Authorization header */
export const userStatusApi = {
  update: (payload: UserStatus): Promise<{ statusText?: string; statusEmoji?: string }> =>
    httpClient.patch<{ statusText?: string; statusEmoji?: string }>(
      '/api/users/me/status',
      payload,
      true,
    ),
};
