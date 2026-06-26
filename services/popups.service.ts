/**
 * Popups API service (section 20 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Popup } from "@/types/domain";

export interface UpsertPopupBody {
  title: string;
  content: string;
  mediaId?: string | null;
  link?: string;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  showOncePerSession?: boolean;
}

export const popupsService = {
  list: () => http.get<Popup[]>(ENDPOINTS.popups.list),

  adminList: () => http.get<Popup[]>(ENDPOINTS.popups.adminList),

  create: (body: UpsertPopupBody) =>
    http.post<Popup>(ENDPOINTS.popups.root, body),

  update: (id: string, body: Partial<UpsertPopupBody>) =>
    http.put<Popup>(ENDPOINTS.popups.byId(id), body),

  delete: (id: string) => http.delete<void>(ENDPOINTS.popups.byId(id)),
};
