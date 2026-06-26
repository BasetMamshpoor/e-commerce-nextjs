/**
 * Security / IP-block API service (section 22 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { BlockedIp } from "@/types/domain";

export interface BlockIpBody {
  ip: string;
  reason?: string;
  expiresAt?: string | null;
}

export const securityService = {
  listBlockedIps: () => http.get<BlockedIp[]>(ENDPOINTS.security.blockedIps),

  blockIp: (body: BlockIpBody) =>
    http.post<BlockedIp>(ENDPOINTS.security.blockedIps, body),

  unblockIp: (id: string) =>
    http.delete<void>(ENDPOINTS.security.blockedIp(id)),
};
