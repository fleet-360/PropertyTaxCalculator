/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@google/generative-ai/server'],
  outputFileTracingIncludes: {
    // Ensure @sparticuz/chromium bundled assets (bin/brotli) are deployed to Vercel
    // for the PDF render route (Playwright → Chromium executablePath()).
    '/api/appeals/generate': [
      './node_modules/@sparticuz/chromium/bin/**',
      './node_modules/@sparticuz/chromium/build/**',
    ],
  },
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
