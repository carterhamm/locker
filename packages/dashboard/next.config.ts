import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API proxy to avoid CORS in development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/:path*",
      },
    ];
  },
};

export default nextConfig;
