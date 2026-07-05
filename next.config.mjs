/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  distDir: process.env.NEXT_DIST_DIR || ".next"
};

export default nextConfig;
