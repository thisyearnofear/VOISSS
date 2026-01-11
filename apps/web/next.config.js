const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@voisss/shared", "@voisss/ui"],

  // Increase serverless function timeout for AI processing
  serverRuntimeConfig: {
    maxDuration: 300, // 5 minutes for AI processing
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
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
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; connect-src 'self' https://api.cdp.coinbase.com https://api.coinbase.com https://cca-lite.coinbase.com https://mainnet.base.org https://sepolia.base.org https://voisss.famile.xyz https://8453.rpc.thirdweb.com wss://www.walletlink.org https://www.walletlink.org; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://ipfs.io https://*.ipfs.dweb.link blob:; media-src 'self' blob:; frame-src 'self' https://verify.coinbase.com;",
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

  // Output configuration - disable static export for Base SDK pages
  // output: 'standalone',

  // Webpack configuration for better tree shaking
  webpack: (config, { dev, isServer }) => {
    // Exclude react-native from bundling to prevent build errors
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native': false,
    };

    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'react-native': false,
      'process': false,
      'fs': false,
      'path': false,
      'crypto': false,
    };

    // Provide process polyfill for browser
    if (!isServer) {
      const webpack = require('webpack');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env': JSON.stringify(process.env),
          'process.exit': 'undefined',
          'process.version': JSON.stringify(process.version),
          'process.platform': JSON.stringify('browser'),
        })
      );
    }

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
          base: {
            test: /[\\/]node_modules[\\/](@base-org|viem|wagmi)[\\/]/,
            name: 'base',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
