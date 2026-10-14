import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "voisss-web",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-14",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      // Lead capture (newsletter + contact). Schema: scripts/migrations/003_leads_d1.sql
      DB: bindings.d1({
        name: "voisss-leads",
        id: "91f4fc2f-f4c9-4e4e-969f-18b2adebc5cf",
      }),
    },
  }),
});
