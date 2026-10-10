/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "https://ai-brand-factory-production.up.railway.app/uploads/:path*",
      },
      {
        source: "/ws/:path*",
        destination: "https://ai-brand-factory-production.up.railway.app/ws/:path*",
      },
    ];
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
