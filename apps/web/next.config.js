const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@voisss/shared", "@voisss/ui"],
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@starknet-react/core'],
  },
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enable compression
  compress: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Webpack configuration for better tree shaking
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          starknet: {
            test: /[\\/]node_modules[\\/](@starknet-react|starknet|starknetkit)[\\/]/,
            name: 'starknet',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
