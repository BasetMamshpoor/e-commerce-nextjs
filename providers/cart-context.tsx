"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  getGuestToken,
  setGuestToken,
  http,
} from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Cart } from "@/types/domain";

/* ──────────────────────────────────────────────────────────────────────────
   Cart context
   ────────────────────────────────────────────────────────────────────────── */

interface CartContextValue {
  itemCount: number;
  /** Sync the X-Guest-Token header for anonymous users after first cart response. */
  syncGuestToken: (token?: string) => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export const CART_QUERY_KEY = ["cart"] as const;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status, data: session } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const queryClient = useQueryClient();
  const [itemCount, setItemCount] = React.useState(0);

  // Subscribe to cart query cache to keep badge count in sync.
  React.useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === "cart") {
        const data = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
        setItemCount(data?.itemCount ?? 0);
      }
    });
    return unsub;
  }, [queryClient]);

  // After login, merge guest cart into user cart.
  //
  // Race condition this guards against: the cart badge / cart page keep
  // useCart() mounted with a 30s staleTime. If the guest cart had gone
  // stale (>30s old) right when the user logs in, React Query's own
  // background refetch for CART_QUERY_KEY can fire independently and in
  // parallel with this merge call — sending its OWN "GET /cart" with the
  // now-authenticated identity, and returning the pre-merge user cart.
  // Because that refetch runs through React Query's normal lifecycle, its
  // result silently overwrites the merged cart we just wrote if it resolves
  // after us — since setQueryData() bypasses React Query's own
  // staleness/generation tracking, TanStack has no way to know our write
  // was the more authoritative one. Cancelling any in-flight/pending cart
  // fetch right before merging closes that window.
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const guestToken = getGuestToken();
    if (!guestToken) return;
    queryClient.cancelQueries({ queryKey: CART_QUERY_KEY }).then(() =>
      http
        .post<{ cart: Cart }>(ENDPOINTS.cart.merge, { guestToken })
        .then(async (response) => {
          // Cancel again right before writing — closes the (small) gap
          // between the first cancelQueries() and the merge request
          // actually completing, during which a new background refetch
          // could have started.
          await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
          queryClient.setQueryData(CART_QUERY_KEY, response.cart);
          // Clear guest token after merge.
          setGuestToken("");
        })
        .catch(() => {
          // Don't clear the guest token — if this keeps failing, at least
          // the unmerged guest cart survives and the next page load (which
          // re-runs this effect, since isAuthenticated goes false→true
          // again as the session resolves) will retry the merge instead of
          // silently losing those items for good.
          toast.error("ادغام سبد خرید مهمان با حساب شما ناموفق بود", {
            description: "لطفاً صفحه را رفرش کنید تا دوباره تلاش شود.",
          });
        }),
    );
  }, [isAuthenticated, queryClient]);

  const syncGuestToken = React.useCallback((token?: string) => {
    if (token && !getGuestToken()) setGuestToken(token);
  }, []);

  const value = React.useMemo<CartContextValue>(
    () => ({ itemCount, syncGuestToken }),
    [itemCount, syncGuestToken],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** Helper: optimistically update cart in cache. */
export function setCartCache(
  queryClient: ReturnType<typeof useQueryClient>,
  cart: Cart,
) {
  queryClient.setQueryData(CART_QUERY_KEY, cart);
}

/** Helper: extract guest token from a CartResponse and persist if new. */
export function captureGuestTokenFromCartResponse(res: {
  cart: Cart;
  wasAdjusted?: boolean;
  guestToken?: string;
}) {
  if (res.guestToken && !getGuestToken()) setGuestToken(res.guestToken);
}
