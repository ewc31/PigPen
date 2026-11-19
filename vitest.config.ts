import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@pigpen\/core\/node$/, replacement: src("./packages/core/src/node/index.ts") },
      { find: /^@pigpen\/core$/, replacement: src("./packages/core/src/index.ts") },
    ],
  },
  test: {
    include: ["packages/*/test/**/*.test.ts", "apps/*/test/**/*.test.ts"],
    environment: "node",
  },
});
