import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },              // seed/demo images
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" }, // admin uploads
    ],
  },
};

export default nextConfig;
