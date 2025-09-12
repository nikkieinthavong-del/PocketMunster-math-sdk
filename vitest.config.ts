import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,              // enable global test/expect/describe
    environment: 'node',
    include: ['tests/**/*.test.ts']
  },
});