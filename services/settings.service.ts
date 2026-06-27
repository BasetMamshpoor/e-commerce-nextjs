/**
 * Site settings API service (section 25 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Setting, SettingsMap } from "@/types/domain";

export const settingsService = {
  /** Public settings (parsed values, not raw). */
  public: () => http.get<SettingsMap>(ENDPOINTS.settings.public),

  /** Admin: raw settings list for editing. */
  adminList: () => http.get<Setting[]>(ENDPOINTS.settings.admin),

  /** Admin: upsert one setting. */
  upsert: (key: string, body: { value: string; type?: Setting["type"] }) =>
    http.put<Setting>(ENDPOINTS.settings.byKey(key), body),

  /** Admin: delete one setting. */
  delete: (key: string) => http.delete<void>(ENDPOINTS.settings.byKey(key)),
};
