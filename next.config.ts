import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{source:"/sales/products/:path*",destination:"/products/:path*",permanent:false},{source:"/sales/pricelists/:path*",destination:"/pricing/:path*",permanent:false},...["today", "prospect", "pipeline", "forecast", "reports", "opportunities"].map(route => ({source: `/sales/${route}/:path*`, destination: `/crm/${route}/:path*`, permanent: false}))];
  },
};

export default nextConfig;
