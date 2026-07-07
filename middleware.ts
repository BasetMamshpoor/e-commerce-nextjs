export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/verify-otp",
    "/checkout",
  ],
};
