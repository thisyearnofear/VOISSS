const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@voisss/shared", "@voisss/ui"],
  
  // Enable ESM externals for jose and other ESM packages
  experimental: {
    esmExternals: 'loose',
    optimizePackageImports: ['lucide-react'],
  },

  // Increase serverless function timeout for AI processing
  serverRuntimeConfig: {
    maxDuration: 300, // 5 minutes for AI processing
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
            value: "default-src 'self'; connect-src 'self' https://api.cdp.coinbase.com https://api.coinbase.com https://cca-lite.coinbase.com https://chain-proxy.wallet.coinbase.com https://mainnet.base.org https://sepolia.base.org https://voisss.famile.xyz https://8453.rpc.thirdweb.com wss://www.walletlink.org https://www.walletlink.org wss://api.elevenlabs.io; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com blob: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://ipfs.io https://*.ipfs.dweb.link blob:; media-src 'self' blob: https://storage.googleapis.com https://api.us.elevenlabs.io; frame-src 'self' https://verify.coinbase.com;",
          },
        ],
      },
    ];
  },

  // Redirect configuration — relaunch consolidation: one funnel
  // (discover → generate → sell → build), everything else 308s to its
  // nearest live neighbor. Killed pages live in git history.
  async redirects() {
    return [
      { source: '/app', destination: '/', permanent: true },

      // Buyer funnel — specific /demo paths before the wildcard
      { source: '/demo/jev', destination: '/marketplace', permanent: true },
      { source: '/demo/jev-compare', destination: '/benchmarks', permanent: true },
      { source: '/demo/ows-agent', destination: '/developers', permanent: true },
      { source: '/demo', destination: '/generate', permanent: true },
      { source: '/demo/:path*', destination: '/generate', permanent: true },

      // Contributor funnel
      { source: '/studio', destination: '/sell', permanent: true },
      { source: '/import', destination: '/sell/import', permanent: true },
      { source: '/marketplace/dashboard', destination: '/sell/dashboard', permanent: true },

      // Developer funnel
      { source: '/for-agents', destination: '/developers', permanent: true },
      { source: '/acp-dashboard', destination: '/developers', permanent: true },
      { source: '/agents', destination: '/developers', permanent: true },

      // Retired surfaces → nearest live neighbor
      { source: '/missions', destination: '/sell', permanent: true },
      { source: '/achievements', destination: '/', permanent: true },
      { source: '/leaderboard', destination: '/', permanent: true },
      { source: '/submissions', destination: '/', permanent: true },
      { source: '/arkiv', destination: '/', permanent: true },
      { source: '/hackathon', destination: '/', permanent: true },
      { source: '/features', destination: '/', permanent: true },
      { source: '/platform', destination: '/', permanent: true },
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
      'pg': false,
      'pg-native': false,
      'dns': false,
      'net': false,
      'tls': false,
    };

    // Dynamic Node-EVM SDK is server-only (native addon, not edge) and is
    // optional — builds without it must still succeed. The service does a
    // dynamic import("@dynamic-labs-wallet/node-evm") with a catch() and
    // falls back to a viem EOA. Tell webpack not to eagerly bundle it for
    // either client or server, or the server trace will fail when the
    // package is absent.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@dynamic-labs-wallet/node-evm': false,
      '@dynamic-labs-wallet/core': false,
    };
    // Next.js tries to trace server externals — keep Dynamic out of the
    // trace so a missing package doesn't break `next build`.
    config.externals = config.externals ?? [];
    if (Array.isArray(config.externals)) {
      // webpack externals array — push a function that externalizes Dynamic
      config.externals.push(({ request }, callback) => {
        if (request && request.startsWith('@dynamic-labs-wallet/')) {
          return callback(null, `commonjs ${request}`);
        }
        return callback();
      });
    }

    // Provide process polyfill for browser - only expose NEXT_PUBLIC_* variables
    if (!isServer) {
      const webpack = require('webpack');
      // Explicitly whitelist only NEXT_PUBLIC_* env vars to avoid leaking secrets
      const publicEnv = {};
      for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith('NEXT_PUBLIC_')) {
          publicEnv[key] = value ?? '';
        }
      }
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env': JSON.stringify(publicEnv),
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
