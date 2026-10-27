import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  // Pin the project root so a stray package-lock.json in a parent folder
  // (e.g. C:\Users\<name>) is not picked up as the workspace root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
