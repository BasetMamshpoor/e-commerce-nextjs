/**
 * Banners API service (section 19 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Banner, BannerPosition } from "@/types/domain";

export interface UpsertBannerBody {
  title: string;
  mediaId: string;
  link?: string;
  position: BannerPosition;
  order?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export const bannersService = {
  list: (params?: { position?: BannerPosition }) =>
    http.get<Banner[]>(ENDPOINTS.banners.list, params),

  adminList: () => http.get<Banner[]>(ENDPOINTS.banners.adminList),

  create: (body: UpsertBannerBody) =>
    http.post<Banner>(ENDPOINTS.banners.root, body),

  update: (id: string, body: Partial<UpsertBannerBody>) =>
    http.put<Banner>(ENDPOINTS.banners.byId(id), body),

  delete: (id: string) => http.delete<void>(ENDPOINTS.banners.byId(id)),
};
