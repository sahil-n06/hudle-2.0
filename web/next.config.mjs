/** @type {import('next').NextConfig} */
const apiUrl = process.env.API_URL || 'http://localhost:4000';

const nextConfig = {
  output: 'standalone',
  // The browser talks to /api on the same origin; Next proxies to the Express API.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
