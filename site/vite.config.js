import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds the React site into /dist at the repo root. The Worker serves that folder (see wrangler.jsonc).
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: { outDir: "../dist", emptyOutDir: true },
});
