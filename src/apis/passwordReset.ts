import { httpClient } from './http';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export const passwordResetApi = {
  /**
   * Request password reset - sends email with reset link
   */
  forgotPassword: async (email: string): Promise<MessageResponse> => {
    return httpClient.post<ForgotPasswordRequest, MessageResponse>(
      '/api/common/auth/forgot-password',
      { email }
    );
  },

  /**
   * Reset password with token from email
   */
  resetPassword: async (token: string, newPassword: string): Promise<MessageResponse> => {
    return httpClient.post<ResetPasswordRequest, MessageResponse>(
      '/api/common/auth/reset-password',
      { token, newPassword }
    );
  },
};
