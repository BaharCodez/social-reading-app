import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phones/other devices on the LAN to load dev resources (HMR, chunks).
  allowedDevOrigins: ["10.6.60.173"],
};

export default nextConfig;
