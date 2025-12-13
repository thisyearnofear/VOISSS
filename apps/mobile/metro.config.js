const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add path aliases for Metro bundler
config.resolver.alias = {
  "@": path.resolve(__dirname),
};

// Enable symlinks for monorepo support
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Ensure we're resolving modules correctly
config.resolver.platforms = ["ios", "android", "native", "web"];

// Add monorepo support
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Temporary fix for ox resolution issues: Force use of _esm build for specific module
// preventing Metro from picking up .ts source files which have invalid relative .js imports.
// Path is hardcoded based on current pnpm lock state.
const oxRoot = path.resolve(workspaceRoot, "node_modules/.pnpm/ox@0.9.6_typescript@5.9.3_zod@4.1.12/node_modules/ox");


// Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Handle node built-in modules for React Native
config.resolver.extraNodeModules = {
  "node:crypto": require.resolve("react-native-crypto"),
  "node:stream": require.resolve("stream-browserify"),
  "node:buffer": require.resolve("buffer"),
  "node:http": require.resolve("stream-http"),
  "node:https": require.resolve("https-browserify"),
  "node:url": require.resolve("url"),
  "node:zlib": require.resolve("browserify-zlib"),
  "node:vm": require.resolve("vm-browserify"),
  crypto: require.resolve("react-native-crypto"),
  stream: require.resolve("stream-browserify"),
  buffer: require.resolve("buffer"),
  http: require.resolve("stream-http"),
  https: require.resolve("https-browserify"),
  url: require.resolve("url"),
  zlib: require.resolve("browserify-zlib"),
  vm: require.resolve("vm-browserify"),
};

// Add alias mapping for node built-in modules
config.resolver.alias = {
  ...config.resolver.alias,
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
  // Force ox to use _esm build
  "ox": path.join(oxRoot, "_esm"),
};

// Special resolver for ox package to force use of _esm build
config.resolver.resolverMainFields = [
  ...(config.resolver.resolverMainFields || []),
  "_esm",
  "module",
  "main",
];

// Add block list for ox TypeScript source files to prevent Metro from picking them up
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  /ox\/.*\.ts$/,
  /ox\/core\/.*\.ts$/,
  /ox\/internal\/.*\.ts$/,
];

// Add resolver asset plugin for proper asset handling
config.resolver.assetExts.push("bin");

// Fix for import.meta issues in React Native
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  experimental_importSupport: false,
  unstable_transformImportMeta: true,
};

// Ensure proper module resolution for workspace packages
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
