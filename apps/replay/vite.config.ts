import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site under /<repo-name>/; the Pages workflow sets this.
  base: process.env.PAGES_BASE ?? "/",
  resolve: {
    alias: { "@pigpen/core": here("../../packages/core/src/index.ts") },
  },
  server: {
    fs: { allow: [here("../..")] },
  },
});
