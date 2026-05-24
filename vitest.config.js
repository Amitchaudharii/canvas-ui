import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Use the tests directory for test files
    include: ['tests/unit/**/*.test.js'],

    // Setup files — canvas/rAF polyfills for Node environment
    setupFiles: ['tests/setup/vitest.setup.js'],

    // Environment
    environment: 'node',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/topology/**/*.js',
        'src/hooks/**/*.js',
      ],
      exclude: [
        'node_modules',
        'tests',
        '.next',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
    },

    // Reasonable timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter
    reporters: ['verbose'],
  },
});
