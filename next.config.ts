import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16.3 no longer emits `.next/next-server.js.nft.json` in standalone
  // mode, but Vercel's post-build step still reads it — ENOENT on deploy.
  // Vercel does its own packaging, so standalone output is only needed for
  // self-hosted deployments. See vercel/next.js#96646.
  output: process.env.VERCEL ? undefined : "standalone",
  compress: true,
  poweredByHeader: false,
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["@tabler/icons-react", "recharts"],
  },
};

export default nextConfig;
