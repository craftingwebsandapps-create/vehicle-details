import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vi-backend.theamaravaticity.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
