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

// Fix for import.meta issues in web builds
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Ensure proper module resolution for workspace packages
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
