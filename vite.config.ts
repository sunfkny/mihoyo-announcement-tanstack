import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  ssr: {
    external: ["tesseract.js", "@tesseract.js-data/chi_sim", "image-size"],
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({ traceDeps: ["tesseract.js*", "tesseract.js-core*", "@tesseract.js-data/chi_sim*"] }),
    viteReact(),
  ],
});
