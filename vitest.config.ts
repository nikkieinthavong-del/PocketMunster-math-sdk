import { defineConfig } from 'vitest/config';export default defineConfig({  test: {    environment: 'node',    coverage: {      provider: 'v8',      reporter: ['text', 'lcov'],      reportsDirectory: 'coverage',
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 40,
        statements: 60,
      },
    },
  },
});