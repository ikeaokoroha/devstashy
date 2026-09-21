import { defineConfig } from "vitest/config";

// Unit tests cover server actions and utilities only, not components, so they
// run in Node with no DOM or React plugin. Test files sit next to the code
// they test as *.test.ts; .tsx tests are deliberately not picked up.
export default defineConfig({
  resolve: {
    // Resolves the "@/*" alias from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Each test starts with empty mock call history, and vi.spyOn spies (e.g.
    // on console) are put back afterwards.
    clearMocks: true,
    restoreMocks: true,
  },
});
