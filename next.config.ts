import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  async redirects() {
    return [{source:"/sales/products/:path*",destination:"/products/:path*",permanent:false},{source:"/sales/pricelists/:path*",destination:"/pricing/:path*",permanent:false},...["today", "prospect", "pipeline", "forecast", "reports", "opportunities"].map(route => ({source: `/sales/${route}/:path*`, destination: `/crm/${route}/:path*`, permanent: false}))];
  },
};

export default nextConfig;
