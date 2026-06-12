/**
 * Vitest config for apps/web.
 *
 * - node environment: the route handlers we test are Next.js App Router
 *   route.ts files that export GET/POST functions. They run in node.
 * - jsdom is intentionally NOT used; route-handler tests don't need DOM.
 * - The `@/` alias mirrors tsconfig.json.
 * - The `@voisss/shared` alias lets tests import the shared barrel without
 *   going through the workspace symlink (vitest's resolver is stricter
 *   than Next's).
 */
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/app/api/**/*.test.ts',
      'test/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/app/api/**/route.ts',
        'src/lib/**/*.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/*.test.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@voisss/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@voisss/shared/server': resolve(__dirname, '../../packages/shared/src/index.server.ts'),
    },
  },
});
