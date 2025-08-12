import { defineConfig } from "vitest/config";

import viteconfig from "./vite.config";

export default defineConfig({
  ...viteconfig,
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
