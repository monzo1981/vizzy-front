import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true, // لحل مشاكل الصور في الـ development
    domains: [], // لسنا نحتاجها مع الـ img tag العادي
    formats: ['image/webp', 'image/avif'], // تحسين الصور
  },
};

export default nextConfig;
