import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Playwright browser specs use the same .spec.ts suffix but run only via Playwright.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
