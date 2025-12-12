const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add path aliases for Metro bundler
config.resolver.alias = {
  "@": path.resolve(__dirname),
};

// Enable symlinks for monorepo support
config.resolver.unstable_enableSymlinks = true;

// Ensure we're resolving modules correctly
config.resolver.platforms = ["ios", "android", "native", "web"];

// Add monorepo support
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

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
};

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
