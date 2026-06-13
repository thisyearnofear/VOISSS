/**
 * Vitest config for packages/shared.
 *
 * Mirrors the production tsup build's externals: zod, react, viem, wagmi,
 * pg, redis, etc. are external — we don't bundle or transform them in
 * tests either, so tests exercise the same import behaviour the build
 * does.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/services/**/*.ts', 'src/utils/**/*.ts', 'src/types.ts'],
      exclude: ['**/*.test.ts', '**/node_modules/**', '**/dist/**'],
    },
  },
});
