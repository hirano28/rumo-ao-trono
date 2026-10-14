// O Maia no navegador: carrega a rede do nível pedido (sob demanda, uma vez
// por nível) e devolve a probabilidade humana de cada lance legal.

import type { Chess } from "chess.js";
import * as ort from "onnxruntime-web/wasm";
import { PLANOS, codificar, politicaDosLegais } from "./codificacao";

// sem SharedArrayBuffer (itch.io, GitHub Pages): uma thread só
ort.env.wasm.numThreads = 1;

const sessoes = new Map<number, Promise<ort.InferenceSession>>();

function sessao(nivel: number): Promise<ort.InferenceSession> {
  let pronta = sessoes.get(nivel);
  if (!pronta) {
    pronta = ort.InferenceSession.create(`${import.meta.env.BASE_URL}maia/maia-${nivel}.onnx`, {
      executionProviders: ["wasm"],
    });
    // falhou, esquece: a próxima partida tenta de novo
    pronta.catch(() => sessoes.delete(nivel));
    sessoes.set(nivel, pronta);
  }
  return pronta;
}

/** Começa a baixar a rede antes de precisar dela (ao entrar na partida). */
export function prepararMaia(nivel: number): void {
  void sessao(nivel).catch(() => undefined);
}

export async function politicaDoMaia(partida: Chess, nivel: number): Promise<Map<string, number>> {
  const entrada = new ort.Tensor("float32", codificar(partida), [1, PLANOS, 8, 8]);
  const saida = await (await sessao(nivel)).run({ "/input/planes": entrada });
  return politicaDosLegais(partida, saida["/output/policy"].data as Float32Array);
}
