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

module.exports = config;
