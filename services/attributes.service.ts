/**
 * Attributes API service — added isDisplay field.
 *
 * Note: Price modifiers are NOT set on attribute values — they are set
 * per-product-variant on the junction table (see products service).
 */
import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Attribute, AttributeInputType, AttributeValue } from "@/types/domain";

export interface CreateAttributeBody {
  name: string; slug?: string; inputType: AttributeInputType;
  isFilterable?: boolean; isVariant?: boolean; isDisplay?: boolean;
  /** Category IDs this attribute applies to — omit/empty means "all categories". */
  categoryIds?: number[];
}
export interface AddAttributeValueBody {
  value: string;
  colorHex?: string;
  order?: number;
}

export const attributesService = {
  /** Pass categoryIds to get only attributes that apply to (at least one
   *  of) those categories, plus any with no category restriction. Used by
   *  product create/edit to keep the variant/display attribute pickers
   *  scoped to what's actually relevant instead of every attribute in the
   *  system. */
  list: (categoryIds?: number[]) =>
    http.get<Attribute[]>(ENDPOINTS.attributes.list, categoryIds?.length ? { categoryIds: categoryIds.join(",") } : undefined),
  byId: (id: number) => http.get<Attribute>(ENDPOINTS.attributes.byId(id)),
  create: (body: CreateAttributeBody) => http.post<Attribute>(ENDPOINTS.attributes.create, body),
  update: (id: number, body: Partial<CreateAttributeBody>) => http.put<Attribute>(ENDPOINTS.attributes.update(id), body),
  delete: (id: number) => http.delete<void>(ENDPOINTS.attributes.delete(id)),
  addValue: (id: number, body: AddAttributeValueBody) => http.post<AttributeValue>(ENDPOINTS.attributes.addValue(id), body),
  updateValue: (valueId: number, body: Partial<AddAttributeValueBody>) => http.put<AttributeValue>(ENDPOINTS.attributes.updateValue(valueId), body),
  deleteValue: (valueId: number) => http.delete<void>(ENDPOINTS.attributes.deleteValue(valueId)),
};
