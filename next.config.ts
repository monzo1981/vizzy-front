import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone mode معطل مؤقتاً بسبب مشاكل مع Next.js 15 على Azure
  // output: 'standalone',
  
  images: {
    unoptimized: true,
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // ضمان نسخ جميع static assets
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;