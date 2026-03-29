/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit loads metrics from node_modules/js/data/*.afm — bundling breaks __dirname (e.g. C:\ROOT\...).
  serverExternalPackages: ['pdfkit', '@google/generative-ai/server'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
