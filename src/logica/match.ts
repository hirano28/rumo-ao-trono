// O match (DESIGN.md §4.2.3): uma série de partidas contra um só adversário,
// como o match pelo título de mestre. Cada partida tem um id próprio,
// "adversario@numero" (o progresso guarda o resultado de cada uma), e as
// cores se alternam de partida em partida. Só as partidas decisivas são
// jogadas; as outras são simuladas pela força dos dois, como nos torneios.

import type { Pontos } from "./forca";
import { VOCE, jogoSimulado } from "./torneio";

const SEPARADOR = "@";

export interface DescricaoDeMatch {
  titulo: string;
  adversario: string;
  partidas: number;
}

export interface PartidaDoMatch {
  numero: number;
  /** Pontos do jogador. */
  pontos: Pontos;
  simulada: boolean;
}

export function idDaPartida(adversario: string, numero: number): string {
  return `${adversario}${SEPARADOR}${numero}`;
}

/** O adversário de um id de partida ("saigin@3" → "saigin"; "ozols" → "ozols"). */
export function adversarioDaPartida(id: string): string {
  const i = id.indexOf(SEPARADOR);
  return i < 0 ? id : id.slice(0, i);
}

/** O número da partida no match, ou nada fora de um match. */
export function numeroDaPartida(id: string): number | undefined {
  const i = id.indexOf(SEPARADOR);
  return i < 0 ? undefined : Number(id.slice(i + 1));
}

/** A cor do jogador: a da ficha do adversário na partida 1 (e nas ímpares); a outra nas pares. */
export function corNaPartida(id: string, corDaFicha: "brancas" | "pretas"): "brancas" | "pretas" {
  const numero = numeroDaPartida(id);
  if (numero === undefined || numero % 2 === 1) return corDaFicha;
  return corDaFicha === "brancas" ? "pretas" : "brancas";
}

/** Partidas já decididas: as anteriores à próxima partida ao vivo que falta (ou todas). */
export function partidasCompletas(match: DescricaoDeMatch, aoVivo: readonly string[], resultados: Readonly<Record<string, Pontos>>): number {
  const proxima = aoVivo.find((id) => resultados[id] === undefined);
  return proxima === undefined ? match.partidas : (numeroDaPartida(proxima) ?? 1) - 1;
}

/** As partidas do match até a `ate`: as jogadas, com o resultado; as outras, simuladas. */
export function partidasDoMatch(
  match: DescricaoDeMatch,
  aoVivo: readonly string[],
  resultados: Readonly<Record<string, Pontos>>,
  forcas: Readonly<Record<string, number>>,
  semente: string,
  ate: number,
): PartidaDoMatch[] {
  const partidas: PartidaDoMatch[] = [];
  for (let numero = 1; numero <= Math.min(ate, match.partidas); numero++) {
    const id = idDaPartida(match.adversario, numero);
    const resultado = resultados[id];
    if (resultado !== undefined) partidas.push({ numero, pontos: resultado, simulada: false });
    else if (!aoVivo.includes(id)) {
      const pontos = jogoSimulado(semente, numero, VOCE, match.adversario, forcas[VOCE], forcas[match.adversario]);
      partidas.push({ numero, pontos, simulada: true });
    }
  }
  return partidas;
}

/** "8 a 6", com meio ponto escrito em fração. */
export function placarDoMatch(partidas: readonly PartidaDoMatch[]): { voce: number; ele: number } {
  const voce = partidas.reduce((soma, p) => soma + p.pontos, 0);
  return { voce, ele: partidas.length - voce };
}
