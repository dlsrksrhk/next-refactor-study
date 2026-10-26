import type { NextConfig } from "next";

const config: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // 브라우저의 /api 요청을 독립 백엔드로 전달합니다.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://127.0.0.1:4000"}/api/:path*`,
      },
    ];
  },
};

export default config;
