import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The a11y suite drives a real browser and is run separately.
    exclude: ['tests/a11y/**', 'node_modules/**'],
    environment: 'node',
    testTimeout: 30_000,
  },
});
