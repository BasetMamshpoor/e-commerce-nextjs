/**
 * Auth API service
 * Mirrors section 1 of api.md.
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type {
  AuthSession,
  OtpChannel,
  OtpRequestResult,
  User,
} from "@/types/domain";

export interface RegisterBody {
  fullName: string;
  identifier: string;
  password: string;
}

export interface VerifyOtpBody {
  identifier: string;
  code: string;
  deviceName?: string;
}

export interface LoginBody {
  identifier: string;
  password: string;
  deviceName?: string;
}

export interface RefreshBody {
  refreshToken: string;
}

export interface ResetPasswordBody {
  identifier: string;
  code: string;
  newPassword: string;
}

export const authService = {
  register: (body: RegisterBody) =>
    http.post<OtpRequestResult>(ENDPOINTS.auth.register, body),

  registerVerifyOtp: (body: VerifyOtpBody) =>
    http.post<AuthSession>(ENDPOINTS.auth.registerVerifyOtp, body),

  login: (body: LoginBody) =>
    http.post<AuthSession>(ENDPOINTS.auth.login, body),

  loginOtpRequest: (body: { identifier: string }) =>
    http.post<OtpRequestResult>(ENDPOINTS.auth.loginOtpRequest, body),

  loginOtpVerify: (body: VerifyOtpBody) =>
    http.post<AuthSession>(ENDPOINTS.auth.loginOtpVerify, body),

  refreshToken: (body: RefreshBody) =>
    http.post<{ accessToken: string; refreshToken: string; sessionId: string }>(
      ENDPOINTS.auth.refreshToken,
      body,
    ),

  logout: () => http.post<void>(ENDPOINTS.auth.logout),

  logoutAll: () => http.post<void>(ENDPOINTS.auth.logoutAll),

  forgotPassword: (body: { identifier: string }) =>
    http.post<{ identifier: string; channel: OtpChannel; expiresAt: string }>(
      ENDPOINTS.auth.forgotPassword,
      body,
    ),

  resetPassword: (body: ResetPasswordBody) =>
    http.post<{ message: string }>(ENDPOINTS.auth.resetPassword, body),
};
