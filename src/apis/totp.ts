import { httpClient } from './http';

export const totpApi = {
  setup: () =>
    httpClient.post('/api/users/me/totp/setup', {}, true) as Promise<{
      secret: string;
      qrCodeDataUrl: string;
    }>,

  verify: (code: string) =>
    httpClient.post('/api/users/me/totp/verify', { code }, true) as Promise<{ totpEnabled: boolean }>,

  disable: (code: string) =>
    httpClient.delete('/api/users/me/totp', true, true, { code }) as Promise<{ totpEnabled: boolean }>,

  status: () =>
    httpClient.get('/api/users/me/totp/status', true) as Promise<{ totpEnabled: boolean }>,
};
