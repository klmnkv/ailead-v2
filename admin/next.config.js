/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Proxy API requests к Express backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/:path*',
      },
    ];
  },

  // Разрешить загрузку в iframe
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://*.amocrm.ru https://*.amocrm.com",
          },
        ],
      },
    ];
  },

  // Оптимизация
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Для WebSocket
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

module.exports = nextConfig;