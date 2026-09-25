import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Hides the "N" dev-mode badge/indicator that floats in the corner while
  // running `next dev`. It's Next.js's own dev tools indicator, not
  // something from our code — and it already never shows up in a production
  // build (Vercel or otherwise), only during local development.
  devIndicators: false,
  images: {
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
