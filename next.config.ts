import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["@tabler/icons-react", "recharts"],
  },
};

export default nextConfig;
