/**
 * Wallet API service (section 13 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { WalletData } from "@/types/domain";

export const walletService = {
  get: (params?: { page?: number; limit?: number }) =>
    http.get<WalletData>(ENDPOINTS.wallet.get, params),

  chargeInitiate: (body: { amount: number; gatewaySlug: string }) =>
    http.post<{ transactionId: string; redirectUrl: string }>(
      ENDPOINTS.wallet.chargeInitiate,
      body,
    ),

  chargeVerify: (
    transactionId: string,
    body: { providerParams: Record<string, string> },
  ) =>
    http.post<{ alreadyProcessed: boolean; balance: number }>(
      ENDPOINTS.wallet.chargeVerify(transactionId),
      body,
    ),
};
