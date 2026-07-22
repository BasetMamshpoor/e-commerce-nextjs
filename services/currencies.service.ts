/**
 * Currencies API service — public + admin.
 *
 * Public:
 *   GET /currencies                list active currencies (for storefront display)
 *
 * Admin:
 *   GET    /admin/currencies       list all currencies
 *   POST   /admin/currencies       create a new currency
 *   PATCH  /admin/currencies/:id   update currency or override rate manually
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type {
  Currency,
  PublicCurrency,
  CreateCurrencyBody,
  UpdateCurrencyBody,
} from "@/types/domain";

export const currenciesService = {
  /** Public: list active currencies (for storefront display). */
  publicList: () => http.get<PublicCurrency[]>(ENDPOINTS.currencies.public),

  /** Admin: list all currencies (including inactive). */
  adminList: () => http.get<Currency[]>(ENDPOINTS.currencies.adminList),

  /** Admin: create a new currency. */
  create: (body: CreateCurrencyBody) =>
    http.post<Currency>(ENDPOINTS.currencies.create, body),

  /** Admin: update a currency's name/isActive, or override its rate manually.
   *  When `manualRate` is provided, a new ExchangeRateHistory entry with
   *  source="manual" is created and immediately applied to all products
   *  using this currency. */
  update: (id: number, body: UpdateCurrencyBody) =>
    http.patch<Currency>(ENDPOINTS.currencies.update(id), body),

  /** Admin: delete is not exposed by the backend — currencies can only be
   *  deactivated via PATCH { isActive: false }. */
};
