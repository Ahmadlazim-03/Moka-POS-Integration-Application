import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.gojekapi.com", // Domain gambar sesuai JSON kamu
      },
    ],
  },
};

export default nextConfig;
