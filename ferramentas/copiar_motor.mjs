// Copia o Stockfish (build "lite single-threaded", ~7 MB, sem SharedArrayBuffer)
// de node_modules para public/motor, onde o Web Worker o carrega.
import { copyFileSync, mkdirSync } from "node:fs";

const origem = "node_modules/stockfish";
const destino = "public/motor";
mkdirSync(destino, { recursive: true });
for (const arquivo of ["stockfish-18-lite-single.js", "stockfish-18-lite-single.wasm"]) {
  copyFileSync(`${origem}/bin/${arquivo}`, `${destino}/${arquivo}`);
}
copyFileSync(`${origem}/Copying.txt`, `${destino}/COPYING-stockfish.txt`);
