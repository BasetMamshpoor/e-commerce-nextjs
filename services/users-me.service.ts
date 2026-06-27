/**
 * Users Me (profile) API service (section 24 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { User } from "@/types/domain";

export interface UpdateProfileBody {
  fullName: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export const usersMeService = {
  get: () => http.get<User>(ENDPOINTS.usersMe.get),

  update: (body: UpdateProfileBody) =>
    http.put<User>(ENDPOINTS.usersMe.update, body),

  setAvatar: (body: { mediaId: string }) =>
    http.put<User>(ENDPOINTS.usersMe.avatar, body),

  changePassword: (body: ChangePasswordBody) =>
    http.put<{ message: string }>(ENDPOINTS.usersMe.password, body),

  changeIdentifierRequest: (body: { newIdentifier: string }) =>
    http.post<{ identifier: string; channel: string; expiresAt: string }>(
      ENDPOINTS.usersMe.changeIdentifierRequest,
      body,
    ),

  changeIdentifierVerify: (body: { newIdentifier: string; code: string }) =>
    http.post<User>(ENDPOINTS.usersMe.changeIdentifierVerify, body),
};
