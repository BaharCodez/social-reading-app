import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phones/other devices on the LAN to load dev resources (HMR, chunks).
  allowedDevOrigins: ["10.6.60.173"],
  // Expose a short build id so we can confirm a device loaded the latest deploy.
  env: {
    NEXT_PUBLIC_BUILD: (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7),
  },
};

export default nextConfig;
