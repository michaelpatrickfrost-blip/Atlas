import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Immutable server releases always build cold; a persisted compiler cache is never reused.
  experimental: { turbopackFileSystemCacheForBuild: false, serverActions: { bodySizeLimit: "12mb" } },
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [{source:"/sales/products/:path*",destination:"/products/:path*",permanent:false},{source:"/sales/pricelists/:path*",destination:"/pricing/:path*",permanent:false},...["today", "prospect", "pipeline", "forecast", "reports", "opportunities"].map(route => ({source: `/sales/${route}/:path*`, destination: `/crm/${route}/:path*`, permanent: false}))];
  },
};

export default nextConfig;
