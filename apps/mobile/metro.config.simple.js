const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Basic monorepo support
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Basic node polyfills
config.resolver.alias = {
  "@": path.resolve(__dirname),
  crypto: "react-native-crypto",
  stream: "stream-browserify",
  buffer: "buffer",
  http: "stream-http",
  https: "https-browserify",
  url: "url",
  zlib: "browserify-zlib",
  vm: "vm-browserify",
};

// Performance optimizations
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: false,
  experimental_importSupport: false,
};

module.exports = config;