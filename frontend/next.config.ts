import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.43.108", "192.168.193.80"]
};

export default nextConfig;
