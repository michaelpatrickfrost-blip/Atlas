/** Bind public credentials to the server-observed route, never a hidden tenant field. */
export function signInAddress(path: string, submitted: { portal: string; companySlug: string }) {
  const business = /^\/business\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(?:login|reset-password)\/?$/.exec(path);
  const portal = /^\/atlas\/(?:login|reset-password)\/?$/.test(path) ? "atlas" : "";
  const companySlug = business?.[1] ?? "";
  if (submitted.companySlug !== companySlug || submitted.portal !== portal) {
    throw new Error("Use the sign-in address provided for your account.");
  }
  return { portal, companySlug };
}
