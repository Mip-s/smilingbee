import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds the React site into /live at the repo root so the Worker serves it as /live/.
// base "./" keeps asset paths relative, so the build works under that subfolder.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "../live", emptyOutDir: true },
});
