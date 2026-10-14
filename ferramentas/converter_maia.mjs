// Converte os pesos oficiais do Maia (lc0, .pb.gz, de github.com/CSSLab/maia-chess)
// para ONNX, que o navegador roda com o onnxruntime-web. Precisa do lc0 com o
// modo leela2onnx. Uso: node ferramentas/converter_maia.mjs [pasta-do-lc0]
// Os .onnx gerados ficam em public/maia/ e entram no git (são o asset do jogo).
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";

const pasta = process.argv[2] ?? "C:/edson/ferramentas/lc0";
export const NIVEIS = [1100, 1300, 1500, 1700, 1900];

mkdirSync("public/maia", { recursive: true });
for (const nivel of NIVEIS) {
  const saida = `public/maia/maia-${nivel}.onnx`;
  execFileSync(`${pasta}/lc0.exe`, ["leela2onnx", `--input=${pasta}/maia-${nivel}.pb.gz`, `--output=${saida}`, "--onnx-opset=17"], {
    stdio: "inherit",
  });
  console.log(saida, statSync(saida).size, "bytes");
}
