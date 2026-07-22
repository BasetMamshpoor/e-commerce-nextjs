/**
 * Attributes API service — added isDisplay field + price modifiers.
 */
import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Attribute, AttributeInputType, AttributeModifierType, AttributeValue } from "@/types/domain";

export interface CreateAttributeBody {
  name: string; slug?: string; inputType: AttributeInputType;
  isFilterable?: boolean; isVariant?: boolean; isDisplay?: boolean;
}
export interface AddAttributeValueBody {
  value: string;
  colorHex?: string;
  order?: number;
  /** How this value modifies the product price. Omit/null for no effect. */
  modifierType?: AttributeModifierType | null;
  /** Modifier amount — percentage, source-currency amount, or IRT amount. */
  modifierValue?: number | null;
}

export const attributesService = {
  list: () => http.get<Attribute[]>(ENDPOINTS.attributes.list),
  byId: (id: number) => http.get<Attribute>(ENDPOINTS.attributes.byId(id)),
  create: (body: CreateAttributeBody) => http.post<Attribute>(ENDPOINTS.attributes.create, body),
  update: (id: number, body: Partial<CreateAttributeBody>) => http.put<Attribute>(ENDPOINTS.attributes.update(id), body),
  delete: (id: number) => http.delete<void>(ENDPOINTS.attributes.delete(id)),
  addValue: (id: number, body: AddAttributeValueBody) => http.post<AttributeValue>(ENDPOINTS.attributes.addValue(id), body),
  updateValue: (valueId: number, body: Partial<AddAttributeValueBody>) => http.put<AttributeValue>(ENDPOINTS.attributes.updateValue(valueId), body),
  deleteValue: (valueId: number) => http.delete<void>(ENDPOINTS.attributes.deleteValue(valueId)),
};
