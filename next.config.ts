import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    output: 'export', // Enable static export for Azure Static Web Apps
    distDir: 'build', // Change output directory from .next to build
    images: {
      unoptimized: true, // Required for static export
      domains: [], // لسنا نحتاجها مع الـ img tag العادي
      formats: ['image/webp', 'image/avif'], // تحسين الصور
    },
    trailingSlash: true, // Better compatibility with static hosts
  };

  export default nextConfig;