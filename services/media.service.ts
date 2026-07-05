/**
 * Media API service — REWRITTEN.
 * Media is now only uploaded by ADMIN/EDITOR via media manager,
 * OR inline with entity forms (products, banners, tickets, etc.) via multipart.
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Media, MediaUsage, PaginatedData } from "@/types/domain";

export const mediaService = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return http.upload<Media>(ENDPOINTS.media.upload, fd);
  },

  bulkUpload: (files: File[]) => {
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    return http.upload<Media[]>(ENDPOINTS.media.bulkUpload, fd);
  },

  list: (params?: { page?: number; limit?: number; type?: string; entityType?: string; search?: string }) =>
    http.get<PaginatedData<Media>>(ENDPOINTS.media.list, params),

  byId: (id: number) => http.get<Media>(ENDPOINTS.media.byId(id)),

  usage: (id: number) => http.get<{ usage: MediaUsage[] }>(ENDPOINTS.media.usage(id)),

  downloadUrl: (id: number) => ENDPOINTS.media.download(id),

  delete: (id: number) => http.delete<void>(ENDPOINTS.media.delete(id)),
};
