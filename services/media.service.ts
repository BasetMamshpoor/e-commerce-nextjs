/**
 * Media API service (section 15 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Media, PaginatedData } from "@/types/domain";

export const mediaService = {
  upload: (file: File, alt?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (alt) fd.append("alt", alt);
    return http.upload<Media>(ENDPOINTS.media.upload, fd);
  },

  bulkUpload: (files: File[]) => {
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    return http.upload<Media[]>(ENDPOINTS.media.bulkUpload, fd);
  },

  list: (params?: { page?: number; limit?: number; type?: string; uploadedById?: string }) =>
    http.get<PaginatedData<Media>>(ENDPOINTS.media.list, params),

  byId: (id: string) => http.get<Media>(ENDPOINTS.media.byId(id)),

  delete: (id: string) => http.delete<void>(ENDPOINTS.media.byId(id)),
};
