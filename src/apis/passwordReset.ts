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

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  resetToken: string;
  message: string;
}

export const passwordResetApi = {
  /**
   * Request password reset - sends OTP to email via Brevo
   */
  forgotPassword: async (email: string): Promise<MessageResponse> => {
    return httpClient.post<MessageResponse>(
      '/api/auth/forgot-password',
      { email },
      false,
      true
    );
  },

  /**
   * Verify 6-digit OTP — returns resetToken on success
   */
  verifyOtp: async (email: string, otp: string): Promise<VerifyOtpResponse> => {
    return httpClient.post<VerifyOtpResponse>(
      '/api/auth/verify-otp',
      { email, otp },
      false,
      true
    );
  },

  /**
   * Reset password with token obtained after OTP verification
   */
  resetPassword: async (token: string, newPassword: string): Promise<MessageResponse> => {
    return httpClient.post<MessageResponse>(
      '/api/auth/reset-password',
      {
        token,
        newPassword,
      },
      false,
      true
    );
  },
};
