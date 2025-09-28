import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: [
      "node_modules/**",
      "dist/**",
      "dist-web/**",
      "dist-run/**",
      "dist-publish/**",
      "artifacts/**",
      "env/**",
      "docs/**",
      "stories/**",
    ],
    environment: "node",
    pool: "forks",
    poolOptions: {
      forks: { minForks: 1, maxForks: 1 },
    },
  },
});
