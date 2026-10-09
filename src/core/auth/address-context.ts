import { ADMIN_LOGIN_PATH, ADMIN_RECOVERY_PATH } from "./admin-address";

/** Bind public credentials to the server-observed route, never a hidden tenant field. */
export function signInAddress(path: string, submitted: { portal: string; companySlug: string }) {
  path = path.replace(/\/$/, "");
  const business = /^\/business\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(?:login|reset-password)\/?$/.exec(path);
  const portal = path === ADMIN_LOGIN_PATH || path === ADMIN_RECOVERY_PATH ? "atlas" : "";
  if (!business && !portal && path !== "/login" && path !== "/reset-password" && path !== "/api/desktop/action") {
    throw new Error("Use the sign-in address provided for your account.");
  }
  const companySlug = business?.[1] ?? "";
  if (submitted.companySlug !== companySlug || submitted.portal !== portal) {
    throw new Error("Use the sign-in address provided for your account.");
  }
  return { portal, companySlug };
}
