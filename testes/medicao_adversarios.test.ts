// Medição, não teste: só roda com MEDIR=1 (é lenta). Joga partidas entre
// adversários de forças diferentes usando o Maia como no jogo e imprime as
// aberturas mais comuns e algumas partidas inteiras, para conferir a olho se
// eles jogam como gente. Uso: MEDIR=1 npx vitest run testes/medicao_adversarios
import { readFileSync } from "node:fs";
import { Chess } from "chess.js";
import * as ort from "onnxruntime-web";
import { describe, it } from "vitest";
import { PLANOS, codificar, politicaDosLegais } from "../src/maia/codificacao";
import { escolherLanceHumano, perfilHumano } from "../src/logica/escolhaHumana";

ort.env.wasm.numThreads = 1;
const sessoes = new Map<number, Promise<ort.InferenceSession>>();
const sessao = (nivel: number) => {
  if (!sessoes.has(nivel)) sessoes.set(nivel, ort.InferenceSession.create(readFileSync(`public/maia/maia-${nivel}.onnx`)));
  return sessoes.get(nivel)!;
};

async function lance(partida: Chess, forca: number): Promise<string> {
  const { nivel, temperatura } = perfilHumano(forca);
  const saida = await (await sessao(nivel)).run({ "/input/planes": new ort.Tensor("float32", codificar(partida), [1, PLANOS, 8, 8]) });
  return escolherLanceHumano(politicaDosLegais(partida, saida["/output/policy"].data as Float32Array), temperatura);
}

async function jogar(brancas: number, pretas: number, limite = 160): Promise<Chess> {
  const partida = new Chess();
  while (!partida.isGameOver() && partida.history().length < limite) {
    const uci = await lance(partida, partida.turn() === "w" ? brancas : pretas);
    partida.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  }
  return partida;
}

describe.skipIf(!process.env.MEDIR)("medição dos adversários (Maia)", () => {
  it("aberturas de 40 partidas do parque", { timeout: 600_000 }, async () => {
    const aberturas = new Map<string, number>();
    for (let i = 0; i < 40; i++) {
      const p = new Chess();
      for (let j = 0; j < 6; j++) {
        const uci = await lance(p, j % 2 === 0 ? 800 : 1050);
        p.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      }
      const chave = p.history().join(" ");
      aberturas.set(chave, (aberturas.get(chave) ?? 0) + 1);
    }
    console.log([...aberturas].sort((a, b) => b[1] - a[1]).map(([a, n]) => `${n}× ${a}`).join("\n"));
  });

  it.each([
    [800, 900],
    [900, 1050],
    [1300, 1500],
  ])("partida inteira: %i (brancas) × %i (pretas)", { timeout: 600_000 }, async (b, p) => {
    const partida = await jogar(b, p);
    const fim = partida.isCheckmate() ? "mate" : partida.isDraw() ? "empate" : "limite";
    console.log(`\n${b} × ${p} (${fim}):\n${partida.pgn({ maxWidth: 100 }).split("\n").filter((l) => !l.startsWith("[")).join(" ")}`);
  });
});
