// Minimal declaration for the `cloudflare:workers` specifier resolved by
// workerd / @cloudflare/vite-plugin at runtime. Deliberately NOT the
// generated `.cloudflare/types/index.d.ts` — that file inlines all of
// workerd's ambient runtime types and overrides DOM globals project-wide
// (e.g. Response.json() -> Promise<unknown>), breaking `next build`
// typechecking.
declare module "cloudflare:workers" {
  export const env: Record<string, unknown> | undefined;
}
