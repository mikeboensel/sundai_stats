import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Vercel build: don't block on ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
