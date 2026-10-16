import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  ssr: {
    // Tesseract.js 通过运行时路径加载 worker、WASM 和模型，保留外部依赖。
    external: ["tesseract.js", "@tesseract.js-data/chi_sim", "image-size"],
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    // 将 OCR 运行时动态加载的依赖纳入部署产物。
    nitro({ traceDeps: ["tesseract.js*", "tesseract.js-core*", "@tesseract.js-data/chi_sim*"] }),
    viteReact(),
  ],
});
