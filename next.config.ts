/** @type {import('next').NextConfig} */
const nextConfig = {
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