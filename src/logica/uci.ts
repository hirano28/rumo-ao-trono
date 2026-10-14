// Leitura da saída UCI do Stockfish. Fica fora do motor para ser testável.

import { centipeoes, type LinhaAnalise } from "./escolhaDeLance";

const INFO = /^info .*\bdepth (\d+) .*\bmultipv (\d+) .*\bscore (cp|mate) (-?\d+)(?: (lowerbound|upperbound))? .*\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/;

/** As linhas da última profundidade completa de cada multipv, na ordem do motor. */
export function lerAnalise(saida: readonly string[]): LinhaAnalise[] {
  const porLinha = new Map<number, { profundidade: number; linha: LinhaAnalise }>();
  for (const texto of saida) {
    const achado = INFO.exec(texto);
    if (!achado || achado[5]) continue; // placar parcial (bound) não serve
    const profundidade = Number(achado[1]);
    const multipv = Number(achado[2]);
    const anterior = porLinha.get(multipv);
    if (anterior && anterior.profundidade > profundidade) continue;
    porLinha.set(multipv, {
      profundidade,
      linha: { lance: achado[6], cp: centipeoes(achado[3] as "cp" | "mate", Number(achado[4])) },
    });
  }
  return [...porLinha.entries()].sort(([a], [b]) => a - b).map(([, v]) => v.linha);
}
