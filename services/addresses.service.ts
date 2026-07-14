/**
 * Addresses API service (section 10 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Address } from "@/types/domain";

export interface UpsertAddressBody {
  title: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  postalCode: string;
  fullAddress: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
}

export const addressesService = {
  list: () => http.get<Address[]>(ENDPOINTS.addresses.list),

  byId: (id: string) => http.get<Address>(ENDPOINTS.addresses.byId(id)),

  create: (body: UpsertAddressBody) =>
    http.post<Address>(ENDPOINTS.addresses.root, body),

  update: (id: string, body: Partial<UpsertAddressBody>) =>
    http.put<Address>(ENDPOINTS.addresses.byId(id), body),

  delete: (id: string) => http.delete<void>(ENDPOINTS.addresses.byId(id)),
};
