/**
 * Media API service — full admin management.
 *
 * Covers all /api/v1/media endpoints:
 *   POST   /                  upload single file (multipart: field "file")
 *   POST   /bulk              upload multiple files (multipart: field "files")
 *   GET    /                  list media (filters: type, entityType, search, year, month)
 *   GET    /folders           list date-based folders
 *   GET    /folders/:entity   list date-based folders for one entity type
 *   DELETE /folders/:entity/:year/:month   remove a date-based folder
 *   GET    /:id               get a single media record
 *   GET    /:id/usage         list entities that reference this media
 *   PATCH  /:id               update originalName / entityType / metadata
 *   GET    /:id/download      download the underlying file
 *   DELETE /:id               remove a media record (blocks if in use)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import { APP_CONFIG } from "@/constants/app";
import type {
  Media,
  MediaFolder,
  MediaListQuery,
  MediaUsageResponse,
  PaginatedData,
  UpdateMediaBody,
} from "@/types/domain";

export const mediaService = {
  /** Upload a single file (multipart, field name "file").
   *  Optional `entityType` query param controls the storage subfolder. */
  upload: (file: File, entityType?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    const url = entityType
      ? `${ENDPOINTS.media.upload}?entityType=${encodeURIComponent(entityType)}`
      : ENDPOINTS.media.upload;
    return http.upload<Media>(url, fd);
  },

  /** Upload multiple files at once (multipart, field name "files").
   *  Optional `entityType` query param controls the storage subfolder.
   *  Returns the wrapper `{ items: Media[] }` from the backend. */
  bulkUpload: (files: File[], entityType?: string) => {
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    const url = entityType
      ? `${ENDPOINTS.media.bulkUpload}?entityType=${encodeURIComponent(entityType)}`
      : ENDPOINTS.media.bulkUpload;
    return http.upload<{ items: Media[] }>(url, fd);
  },

  /** List media with optional filters. */
  list: (params?: MediaListQuery) =>
    http.get<PaginatedData<Media>>(ENDPOINTS.media.list, params),

  /** List date-based folders under the upload root.
   *  Pass `entityType` to scope to one entity type. */
  listFolders: (params?: { entityType?: string; year?: string; month?: string }) =>
    http.get<MediaFolder[]>(ENDPOINTS.media.folders, params),

  /** List date-based folders for a specific entity type (path-param variant). */
  listFoldersByEntity: (entityType: string) =>
    http.get<MediaFolder[]>(ENDPOINTS.media.foldersByEntity(entityType)),

  /** Delete a date-based folder (entityType/year/month).
   *  The backend removes DB rows whose filePath starts with the prefix and
   *  then removes the folder from disk. Fails with 409 if any file is in use. */
  removeFolder: (entityType: string, year: string, month: string) =>
    http.delete<void>(ENDPOINTS.media.folder(entityType, year, month)),

  /** Get a single media record by id. */
  byId: (id: number) => http.get<Media>(ENDPOINTS.media.byId(id)),

  /** List entities that reference this media (returns human-readable strings). */
  usage: (id: number) =>
    http.get<MediaUsageResponse>(ENDPOINTS.media.usage(id)),

  /** Update media metadata (originalName / entityType / metadata). */
  update: (id: number, body: UpdateMediaBody) =>
    http.patch<Media>(ENDPOINTS.media.update(id), body),

  /** Build the absolute URL for downloading a media file.
   *  Returns a full URL string (with auth handled by the browser via cookies). */
  downloadUrl: (id: number) =>
    `${APP_CONFIG.apiBaseUrl}${ENDPOINTS.media.download(id)}`,

  /** Delete a media record. Fails with 409 if the file is in use anywhere. */
  delete: (id: number) => http.delete<void>(ENDPOINTS.media.delete(id)),

  /** Force-delete a media record AND remove all references to it
   *  (product images, brand logos, banner images, ticket attachments, etc.).
   *  Use with caution — the backend nullifies or cascades all FK references. */
  forceDelete: (id: number) => http.delete<void>(ENDPOINTS.media.forceDelete(id)),
};
