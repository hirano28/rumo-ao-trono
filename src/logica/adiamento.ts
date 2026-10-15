// A partida adiada (DESIGN.md §6): nos torneios de adultos, a sessão acabava
// depois do controle de tempo, quem tinha a vez escrevia o lance num papel,
// o "lance secreto", e o árbitro o guardava num envelope lacrado. Em casa,
// cada um analisava a posição; na retomada, o árbitro abria o envelope, fazia
// o lance no tabuleiro, e cada um ganhava mais tempo no relógio.

import { Chess } from "chess.js";
import type { Lado } from "./relogio";

/** A regra do desafio: depois do lance `noLance` das pretas, a sessão acaba. */
export interface RegraDeAdiamento {
  noLance: number;
  /** Tempo da história que cada um ganha na retomada (ex.: 60 = mais uma hora). */
  minutosDaHistoria: number;
}

/** A partida guardada no envelope, até a retomada. */
export interface PartidaAdiada {
  capitulo: string;
  adversario: string;
  /** Os lances até o adiamento, sem o lance secreto. */
  lances: string[];
  /** O lance secreto, em SAN. */
  selado: string;
  /** Quem escreveu o lance secreto (sempre quem tinha a vez). */
  quemSelou: Lado;
  /** Milissegundos reais que restavam a cada um quando a sessão acabou. */
  restanteMs: Record<Lado, number>;
}

/**
 * Hora de adiar: as pretas acabaram de fazer o lance `noLance`, a vez é das
 * brancas e a partida não acabou. Uma partida já retomada não se adia de novo.
 */
export function horaDeAdiar(partida: Chess, regra: RegraDeAdiamento | undefined, jaRetomada: boolean): boolean {
  if (!regra || jaRetomada || partida.isGameOver()) return false;
  return partida.turn() === "w" && partida.moveNumber() === regra.noLance + 1;
}

/** A posição no tabuleiro do clube na hora de abrir o envelope (antes do lance secreto). */
export function posicaoDaAdiada(adiada: PartidaAdiada): Chess {
  const partida = new Chess();
  for (const lance of adiada.lances) partida.move(lance);
  return partida;
}

/**
 * A posição que o jogador pode analisar em casa: quem selou sabe o próprio
 * lance, então analisa depois dele; quem não selou, só a posição de antes.
 */
export function posicaoParaAnalisar(adiada: PartidaAdiada, ladoDoJogador: Lado): Chess {
  const partida = posicaoDaAdiada(adiada);
  if (adiada.quemSelou === ladoDoJogador) partida.move(adiada.selado);
  return partida;
}

/** "41.Nf3" ou "40...Kg7": o lance com o número, como no papel do envelope. */
export function rotuloDoLance(numero: number, lado: Lado, san: string): string {
  return `${numero}.${lado === "b" ? ".." : ""}${san}`;
}

/** Envelope guardado no progresso, conferido: lances e lance secreto legais, tempos válidos. */
export function normalizarAdiada(dado: unknown): PartidaAdiada | undefined {
  if (!dado || typeof dado !== "object") return undefined;
  const d = dado as Record<string, unknown>;
  const tempos = d.restanteMs as Record<string, unknown> | undefined;
  const tempoValido = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
  if (
    typeof d.capitulo !== "string" ||
    typeof d.adversario !== "string" ||
    !Array.isArray(d.lances) ||
    !d.lances.every((l) => typeof l === "string") ||
    typeof d.selado !== "string" ||
    (d.quemSelou !== "w" && d.quemSelou !== "b") ||
    !tempos ||
    !tempoValido(tempos.w) ||
    !tempoValido(tempos.b)
  ) {
    return undefined;
  }
  const adiada: PartidaAdiada = {
    capitulo: d.capitulo,
    adversario: d.adversario,
    lances: d.lances as string[],
    selado: d.selado,
    quemSelou: d.quemSelou,
    restanteMs: { w: tempos.w, b: tempos.b },
  };
  try {
    const partida = posicaoDaAdiada(adiada);
    if (partida.turn() !== adiada.quemSelou) return undefined;
    partida.move(adiada.selado);
  } catch {
    return undefined;
  }
  return adiada;
}
