const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Monorepo support
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// ox package ESM fix
const oxRoot = path.resolve(workspaceRoot, "node_modules/.pnpm/ox@0.9.6_typescript@5.9.3_zod@4.1.12/node_modules/ox");

// Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// Node module paths
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Enable symlinks and package exports
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;
config.resolver.disableHierarchicalLookup = false;

// Consolidated aliases (node polyfills + custom paths)
config.resolver.alias = {
  "@": path.resolve(__dirname),
  // Node built-in polyfills
  "node:crypto": "react-native-crypto",
  "node:stream": "stream-browserify",
  "node:buffer": "buffer",
  "node:http": "stream-http",
  "node:https": "https-browserify",
  "node:url": "url",
  "node:zlib": "browserify-zlib",
  "node:vm": "vm-browserify",
  "node:util": "util",
  "node:events": "events",
  crypto: "react-native-crypto",
  stream: "stream-browserify",
  buffer: "buffer",
  http: "stream-http",
  https: "https-browserify",
  url: "url",
  zlib: "browserify-zlib",
  vm: "vm-browserify",
  // ox ESM build fix
  "ox": path.join(oxRoot, "_esm"),
};

// Resolver configuration
config.resolver.resolverMainFields = ["_esm", "module", "main"];
config.resolver.platforms = ["ios", "android", "native", "web"];
config.resolver.assetExts.push("bin");

// Block ox TypeScript source files
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  /ox\/.*\.ts$/,
  /ox\/core\/.*\.ts$/,
  /ox\/internal\/.*\.ts$/,
];

// Transformer configuration with performance optimizations
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  experimental_importSupport: false,
  unstable_transformImportMeta: true,
  // Enable minification in production
  minifierConfig: {
    compress: {
      drop_console: false,
    },
  },
};

// Enable persistent caching for faster rebuilds
config.resetCache = false;

module.exports = config;
