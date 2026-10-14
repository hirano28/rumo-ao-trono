import { defineConfig } from "vitest/config";

export default defineConfig({
  // Caminhos relativos: o jogo roda numa subpasta (itch.io) sem ajuste.
  base: "./",
  build: { target: "es2022", chunkSizeWarningLimit: 2000 },
  test: { include: ["testes/**/*.test.ts"] },
});
