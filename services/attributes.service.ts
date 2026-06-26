/**
 * Attributes API service (section 4 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Attribute, AttributeInputType, AttributeValue } from "@/types/domain";

export interface CreateAttributeBody {
  name: string;
  slug?: string;
  inputType: AttributeInputType;
  isFilterable?: boolean;
  isVariant?: boolean;
}

export interface AddAttributeValueBody {
  value: string;
  colorHex?: string;
  order?: number;
}

export const attributesService = {
  list: () => http.get<Attribute[]>(ENDPOINTS.attributes.list),

  byId: (id: string) => http.get<Attribute>(ENDPOINTS.attributes.byId(id)),

  create: (body: CreateAttributeBody) =>
    http.post<Attribute>(ENDPOINTS.attributes.root, body),

  update: (id: string, body: Partial<CreateAttributeBody>) =>
    http.put<Attribute>(ENDPOINTS.attributes.byId(id), body),

  delete: (id: string) => http.delete<void>(ENDPOINTS.attributes.byId(id)),

  addValue: (id: string, body: AddAttributeValueBody) =>
    http.post<AttributeValue>(ENDPOINTS.attributes.addValue(id), body),

  updateValue: (valueId: string, body: Partial<AddAttributeValueBody>) =>
    http.put<AttributeValue>(ENDPOINTS.attributes.updateValue(valueId), body),

  deleteValue: (valueId: string) =>
    http.delete<void>(ENDPOINTS.attributes.deleteValue(valueId)),
};
