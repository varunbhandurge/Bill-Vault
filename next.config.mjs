/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js']
  },
  images: {
    unoptimized: true
  },
  webpack: (config) => {
    // Use in-memory cache to prevent Google Drive virtual file system cache errors
    config.cache = {
      type: 'memory'
    };
    return config;
  }
};

export default nextConfig;
