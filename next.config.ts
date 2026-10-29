import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  // Pin the project root so a stray package-lock.json in a parent folder
  // (e.g. C:\Users\<name>) is not picked up as the workspace root.
  turbopack: {
    root: __dirname,
  },
  // The Gazette pages moved into the Journal.
  async redirects() {
    return [
      { source: "/gazette", destination: "/journal/sovereign-freelancer", permanent: true },
      { source: "/gazette/:slug", destination: "/journal/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
