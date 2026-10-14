// A rede do Maia convertida para ONNX, rodando com o onnxruntime-web, tem de
// dar a mesma probabilidade que o lc0 oficial a cada lance legal, em
// posições que exercitam tudo da codificação: pretas (espelho), roque,
// histórico longo, repetição, promoções e a contagem dos 50 lances.
// Referência: testes/referencia_maia.json (ferramentas/referencia_maia.mjs).
import { readFileSync } from "node:fs";
import { Chess } from "chess.js";
import * as ort from "onnxruntime-web";
import { describe, expect, it } from "vitest";
import referencia from "./referencia_maia.json";
import { PLANOS, TAMANHO_DA_POLITICA, VOCABULARIO, codificar, politicaDosLegais } from "../src/maia/codificacao";

ort.env.wasm.numThreads = 1;

const sessoes = new Map<number, Promise<ort.InferenceSession>>();
function sessao(nivel: number): Promise<ort.InferenceSession> {
  if (!sessoes.has(nivel)) {
    sessoes.set(nivel, ort.InferenceSession.create(readFileSync(`public/maia/maia-${nivel}.onnx`)));
  }
  return sessoes.get(nivel)!;
}

describe("vocabulário do Maia", () => {
  it("tem os 1858 lances, sem repetição", () => {
    expect(VOCABULARIO).toHaveLength(TAMANHO_DA_POLITICA);
    expect(new Set(VOCABULARIO).size).toBe(TAMANHO_DA_POLITICA);
  });
});

describe("Maia no onnxruntime-web contra o lc0", () => {
  it.each(referencia.map((r) => [`${r.nivel} · ${r.nome}`, r] as const))("%s", async (_nome, caso) => {
    const partida = caso.fen ? new Chess(caso.fen) : new Chess();
    for (const lance of caso.lances) partida.move({ from: lance.slice(0, 2), to: lance.slice(2, 4), promotion: lance[4] });
    const entrada = new ort.Tensor("float32", codificar(partida), [1, PLANOS, 8, 8]);
    const saida = await (await sessao(caso.nivel)).run({ "/input/planes": entrada });
    const politica = politicaDosLegais(partida, saida["/output/policy"].data as Float32Array);

    // o lc0 escreve o roque como o rei "capturando" a torre (e1h1); o chess.js, e1g1
    const rei = partida.turn() === "w" ? "e1" : "e8";
    const esperado = Object.fromEntries(
      Object.entries(caso.politica as unknown as Record<string, number>).map(([lance, p]) => {
        const roque = lance.startsWith(rei) && partida.get(rei as "e1")?.type === "k" && /^[ah]/.test(lance.slice(2));
        return [roque ? `${rei}${lance[2] === "h" ? "g" : "c"}${lance[3]}` : lance, p];
      }),
    );
    expect([...politica.keys()].sort()).toEqual(Object.keys(esperado).sort());
    for (const [lance, probabilidade] of politica) {
      expect(probabilidade, lance).toBeCloseTo(esperado[lance], 2);
    }
  });
});
