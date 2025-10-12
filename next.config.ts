/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Enable compression
  compress: true,

  // Optimize production builds
  swcMinify: true,

  async headers() {
    return [
      {
        // Apply to your animation page specifically
        source: '/animation',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=*, gyroscope=*, magnetometer=*, camera=*, microphone=*, geolocation=*, xr-spatial-tracking=*, gamepad=*, payment=*, usb=*',
          },
          {
            key: 'Feature-Policy',
            value: 'accelerometer *; gyroscope *; magnetometer *; camera *; microphone *; geolocation *; xr-spatial-tracking *',
          },
        ],
      },
      {
        // Apply to all pages (alternative approach)
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=*, gyroscope=*, magnetometer=*, xr-spatial-tracking=*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images aggressively
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache paintings
        source: '/paintings/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Add other Next.js config options here if you have them
  experimental: {
    // Enable if needed
  },
};

module.exports = nextConfig;