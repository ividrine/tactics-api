import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/util/setup.ts"],
    globalSetup: "./tests/util/globalSetup.ts",
    pool: "forks",
    maxConcurrency: 1,
    fileParallelism: false,
    sequence: { concurrent: false },
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov", "cobertura", "html"],
      exclude: [
        "node_modules",
        "dist",
        "bin",
        "db",
        "tests",
        "*.config.ts",
        "src/config",
        "src/app.ts",
        "src/index.ts",
        "src/lib"
      ]
    }
  }
});
