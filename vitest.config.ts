import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      // Measure coverage for engine sources (add more submodules as tests grow)
      include: ['src/js/engine/**/*.ts', 'src/js/engine/**/*.js'],
      exclude: [
        'tests/**',
        '**/*.d.ts',
        'dist/**',
        'dist-*/**',
        'artifacts/**',
        'coverage/**',
        'docs/**',
        'uploads/**',
        'scripts/**',
        'src/stories/**',
        'webpack.config.js',
        'vitest.config.ts',
        '**/node_modules/**',
      ],
      // Bootstrap thresholds; ratchet up as we add tests
      thresholds: {
        lines: 20,
        functions: 15,
        branches: 40,
        statements: 20,
      },
    },
  },
});
