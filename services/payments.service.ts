/**
 * Payment gateways API service (section 12 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { PaymentGateway } from "@/types/domain";

export interface UpsertPaymentGatewayBody {
  name: string;
  slug: string;
  isActive?: boolean;
  config?: Record<string, unknown>;
}

export const paymentGatewaysService = {
  list: () => http.get<PaymentGateway[]>(ENDPOINTS.paymentGateways.list),

  create: (body: UpsertPaymentGatewayBody) =>
    http.post<PaymentGateway>(ENDPOINTS.paymentGateways.root, body),

  update: (id: string, body: Partial<UpsertPaymentGatewayBody>) =>
    http.put<PaymentGateway>(ENDPOINTS.paymentGateways.byId(id), body),

  delete: (id: string) =>
    http.delete<void>(ENDPOINTS.paymentGateways.byId(id)),
};
