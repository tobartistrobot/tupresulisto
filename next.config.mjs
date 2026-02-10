/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API Routes for Vercel
  // API Routes require Node.js server runtime
  images: { unoptimized: true }
};

export default nextConfig;
