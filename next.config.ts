import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  // KYC photos/PDFs are sent through a server action (default limit 1 MB).
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Pin the project root so a stray package-lock.json in a parent folder
  // (e.g. C:\Users\<name>) is not picked up as the workspace root.
  turbopack: {
    root: __dirname,
  },
  // The Gazette pages moved into the Journal.
  async redirects() {
    return [
      // Stays are request-only for now (price on WhatsApp): the old stay page goes to the request form.
      { source: "/stay", destination: "/book?stay=1#stay", permanent: false },
      { source: "/gazette", destination: "/journal/sovereign-freelancer", permanent: true },
      { source: "/gazette/:slug", destination: "/journal/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
