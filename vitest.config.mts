import { defineConfig } from "vitest/config";

// Tests run the real Convex functions in memory with convex-test: no deployment is touched.
export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["tests/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
