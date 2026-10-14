import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

export default defineConfig({
  resolve: {
    // Workspace libs (@voisss/ui, @voisss/shared) resolve react from their
    // own node_modules context — dedupe forces a single copy in the bundle.
    dedupe: ["react", "react-dom"],
    alias: [
      // webpack resolve.alias `react-native: false` equivalent — shared UI
      // components import RN but are never rendered on web. Deep imports
      // (react-native/Libraries/* via react-native-svg etc.) must hit the
      // shim too, and the regex rule has to run before the bare specifier.
      {
        find: /^react-native\/.*/,
        replacement: fileURLToPath(
          new URL("./shims/react-native.ts", import.meta.url)
        ),
      },
      {
        find: "react-native",
        replacement: fileURLToPath(
          new URL("./shims/react-native.ts", import.meta.url)
        ),
      },
      // @voisss/ui has no `exports` map and its package.json carries a
      // "react-native" field → dist/index.native.js. Web builds must pin the
      // web entry exactly; `find` regex is anchored so @voisss/ui/* subpaths
      // (tsconfig → src/) are untouched.
      {
        find: /^@voisss\/ui$/,
        replacement: fileURLToPath(
          new URL("../../packages/ui/dist/index.mjs", import.meta.url)
        ),
      },
    ],
  },
  environments: {
    rsc: {
      resolve: {
        // @cloudflare/vite-plugin sets workerd/worker/module/browser but not
        // "import" — exports maps then fall through to "default" (CJS), which
        // crashes the dev module runner (__cjs_module_runner_transform).
        conditions: ["import"],
      },
    },
    ssr: {
      resolve: {
        conditions: ["import"],
      },
      optimizeDeps: {
        // CJS-only deps from the wallet stack crash the workerd dev module
        // runner (__cjs_module_runner_transform) — pre-bundle them to ESM.
        // cloudflare/vinext#1219 / #666
        include: [
          "wagmi",
          "@wagmi/core",
          "viem",
          "abitype",
          "@base-org/account",
          "@tanstack/react-query",
          "@coinbase/cdp-sdk",
        ],
      },
    },
  },
  plugins: [
    vinext({
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
