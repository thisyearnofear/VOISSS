const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Optimized monorepo support - only watch what we need
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Add workspace folders to watchFolders (keep default expo folders)
// NOTE: @voisss/shared is NOT watched to avoid CJS/ESM resolution issues in Metro
// Mobile apps import local types/utils instead
config.watchFolders = [
  ...config.watchFolders,
  path.resolve(workspaceRoot, "packages/ui"),
  // path.resolve(workspaceRoot, "packages/shared"), // DISABLED - causes module ESM issues
];

// Add workspace node_modules to resolver paths (keep default expo paths)
config.resolver.nodeModulesPaths = [
  ...config.resolver.nodeModulesPaths,
  path.resolve(workspaceRoot, "node_modules"),
];

// Exclude all packages that cause CJS/ESM issues
config.resolver.extraNodeModules = {
  '@voisss/shared': null,
  '@voisss/ui': null,
  // Exclude web3/blockchain packages that aren't compatible with React Native
  'wagmi': null,
  '@wagmi/connectors': null,
  '@wagmi/core': null,
  'viem': null,
  'ox': null,
  'porto': null,
};

// Only essential polyfills - remove duplicates and unused ones
config.resolver.alias = {
  "@": path.resolve(__dirname),
  // Only the polyfills we actually use
  crypto: "react-native-crypto",
  stream: "stream-browserify",
  buffer: "buffer",
  url: "url",
  // Stub out web-only packages to prevent bundling
  wagmi: path.resolve(__dirname, "stubs/wagmi.js"),
  "@wagmi/connectors": path.resolve(__dirname, "stubs/wagmi.js"),
  "@wagmi/core": path.resolve(__dirname, "stubs/wagmi.js"),
  ox: path.resolve(__dirname, "stubs/ox.js"),
  viem: path.resolve(__dirname, "stubs/viem.js"),
  porto: path.resolve(__dirname, "stubs/porto.js"),
};

// Use default resolver settings (remove experimental features)
// config.resolver.unstable_enableSymlinks = false;
// config.resolver.unstable_enablePackageExports = false;

// Simplified resolver configuration
// Priority: react-native > module > main (needed for @voisss/shared to use .native.js)
config.resolver.resolverMainFields = ["react-native", "module", "main"];
config.resolver.platforms = ["ios", "android", "native"];

// Add debug logging to catch problematic requires
const origOnProgressComplete = config.onProgressComplete;
config.onProgressComplete = () => {
  if (origOnProgressComplete) origOnProgressComplete();
  // Logging moved to transformer
};

// Try to catch problematic module resolutions in transformer
const origTransform = config.transformer.transform;
if (typeof origTransform === 'function') {
  config.transformer.transform = function(args) {
    const filename = args.filename || '';
    // Skip internal Metro files
    if (!filename.includes('node_modules') && !filename.includes('.expo')) {
      // Log local files being transformed
      if (filename.includes('packages/shared') || filename.includes('apps/mobile')) {
        console.log(`[TRANSFORM] ${filename}`);
      }
    }
    return origTransform(args);
  };
}

// Don't add TypeScript extensions - let Metro handle it with default config
// This prevents trying to resolve .ts files from incompatible packages

// Reduce worker count to prevent memory spikes
config.maxWorkers = 2;

// Optimized transformer - enable import.meta polyfill for Zustand compatibility
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  experimental_importSupport: false,
  unstable_transformImportMeta: true, // ENABLED to fix Zustand import.meta issue
  // Minification settings for production only
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;