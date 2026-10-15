// O torneio em turno único (DESIGN.md §4.1): o jogador enfrenta os
// adversários na ordem das rodadas; os jogos entre os outros participantes
// são simulados pela força de cada um, com resultado fixo para cada jogo
// salvo (a mesma semente dá sempre o mesmo resultado), e a tabela vai se
// preenchendo rodada a rodada.

import type { Pontos } from "./forca";
import { calendarioCircular } from "./calendario";

export const VOCE = "voce";

/** Os jogos entre os outros, rodada a rodada (pares de ids). */
export type Rodadas = ReadonlyArray<ReadonlyArray<readonly [string, string]>>;

export interface Jogo {
  rodada: number;
  brancas: string;
  pretas: string;
  /** Pontos das brancas. */
  pontos: Pontos;
  /** Jogo do próprio jogador, simulado (torneio grande, fora das rodadas jogadas). */
  simulado?: boolean;
}

/** A descrição do torneio no conteúdo (ver Desafio.torneio). */
export interface DescricaoDeTorneio {
  rodadas?: Rodadas;
  /** Torneio grande: os rivais do jogador na ordem das rodadas; o calendário sai daqui. */
  ordem?: string[];
}

/** O calendário (dado no conteúdo ou gerado pela ordem) e a ordem dos rivais do jogador. */
export function calendarioDo(torneio: DescricaoDeTorneio, adversarios: readonly string[]): { rodadas: Rodadas; ordem: readonly string[] } {
  if (torneio.ordem) return { rodadas: calendarioCircular(torneio.ordem), ordem: torneio.ordem };
  return { rodadas: torneio.rodadas ?? [], ordem: adversarios };
}

/**
 * Quantas rodadas já estão completas: as anteriores à do próximo rival ao vivo
 * ainda não enfrentado (as simuladas no meio já contam), ou todas.
 */
export function rodadasCompletas(ordem: readonly string[], totalDeRodadas: number, aoVivo: readonly string[], resultados: Readonly<Record<string, Pontos>>): number {
  const proximo = aoVivo.find((id) => resultados[id] === undefined);
  return proximo === undefined ? totalDeRodadas : ordem.indexOf(proximo);
}

export interface Linha {
  id: string;
  pontos: number;
  jogos: number;
}

/** Número entre 0 e 1 a partir de um texto (hash FNV-1a + mistura), estável entre navegadores. */
export function sorteioFixo(chave: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 2 ** 32;
}

/** Expectativa de pontos de A contra B pela fórmula do Elo. */
export function expectativa(forcaA: number, forcaB: number): number {
  return 1 / (1 + 10 ** ((forcaB - forcaA) / 400));
}

/**
 * Resultado de um jogo simulado. A chance de empate cai quando a diferença
 * de força cresce; o resto se divide para manter a expectativa do Elo.
 */
export function jogoSimulado(semente: string, rodada: number, a: string, b: string, forcaA: number, forcaB: number): Pontos {
  const esperado = expectativa(forcaA, forcaB);
  const empate = Math.max(0.05, 0.3 - Math.abs(forcaA - forcaB) / 1000);
  const vitoria = Math.max(0, esperado - empate / 2);
  const sorteio = sorteioFixo(`${semente}|${rodada}|${a}|${b}`);
  if (sorteio < vitoria) return 1;
  if (sorteio < vitoria + empate) return 0.5;
  return 0;
}

/**
 * Todos os jogos já decididos até a rodada `ate` (inclusive), com o jogador e os simulados.
 * `ordem` é a sequência dos rivais do jogador, rodada a rodada. No torneio grande, os rivais
 * fora de `aoVivo` também são simulados, com a força do jogador (`forcas[VOCE]`).
 */
export function jogosAte(
  ate: number,
  rodadas: Rodadas,
  ordem: readonly string[],
  resultadosDoJogador: Readonly<Record<string, Pontos>>,
  forcas: Readonly<Record<string, number>>,
  semente: string,
  aoVivo: readonly string[] = ordem,
): Jogo[] {
  const jogos: Jogo[] = [];
  for (let r = 0; r < Math.min(ate, rodadas.length); r++) {
    const rival = ordem[r];
    if (rival !== undefined && resultadosDoJogador[rival] !== undefined) {
      jogos.push({ rodada: r + 1, brancas: VOCE, pretas: rival, pontos: resultadosDoJogador[rival] });
    } else if (rival !== undefined && !aoVivo.includes(rival)) {
      jogos.push({ rodada: r + 1, brancas: VOCE, pretas: rival, pontos: jogoSimulado(semente, r + 1, VOCE, rival, forcas[VOCE], forcas[rival]), simulado: true });
    }
    for (const [a, b] of rodadas[r]) {
      jogos.push({ rodada: r + 1, brancas: a, pretas: b, pontos: jogoSimulado(semente, r + 1, a, b, forcas[a], forcas[b]) });
    }
  }
  return jogos;
}

/** Classificação: mais pontos primeiro; empate em pontos, quem jogou menos fica acima; depois o id. */
export function classificacao(participantes: readonly string[], jogos: readonly Jogo[]): Linha[] {
  const linhas = new Map(participantes.map((id) => [id, { id, pontos: 0, jogos: 0 }]));
  for (const jogo of jogos) {
    const brancas = linhas.get(jogo.brancas)!;
    const pretas = linhas.get(jogo.pretas)!;
    brancas.pontos += jogo.pontos;
    pretas.pontos += 1 - jogo.pontos;
    brancas.jogos++;
    pretas.jogos++;
  }
  return [...linhas.values()].sort((a, b) => b.pontos - a.pontos || a.jogos - b.jogos || a.id.localeCompare(b.id));
}

/**
 * Problemas no calendário: cada par de outros participantes se enfrenta
 * exatamente uma vez, ninguém joga duas vezes na mesma rodada, e o rival do
 * jogador na rodada não joga outro jogo nela.
 */
export function conferirRodadas(rodadas: Rodadas, adversarios: readonly string[]): string[] {
  const problemas: string[] = [];
  const pares = new Set<string>();
  rodadas.forEach((jogos, r) => {
    const naRodada = new Set<string>(adversarios[r] ? [adversarios[r]] : []);
    for (const [a, b] of jogos) {
      for (const id of [a, b]) {
        if (!adversarios.includes(id)) problemas.push(`rodada ${r + 1}: ${id} não está no torneio`);
        if (naRodada.has(id)) problemas.push(`rodada ${r + 1}: ${id} joga duas vezes`);
        naRodada.add(id);
      }
      const par = [a, b].sort().join("×");
      if (pares.has(par)) problemas.push(`${par} se enfrentam duas vezes`);
      pares.add(par);
    }
  });
  for (let i = 0; i < adversarios.length; i++) {
    for (let j = i + 1; j < adversarios.length; j++) {
      const par = [adversarios[i], adversarios[j]].sort().join("×");
      if (!pares.has(par)) problemas.push(`${par} não se enfrentam`);
    }
  }
  if (rodadas.length < adversarios.length) problemas.push("há menos rodadas do que adversários do jogador");
  return problemas;
}
