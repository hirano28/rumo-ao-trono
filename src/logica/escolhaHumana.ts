// Como o adversário escolhe o lance com o Maia (DESIGN.md §5.4). A rede diz
// a probabilidade de um humano daquele nível jogar cada lance; o adversário
// sorteia por ela. Assim ele abre como gente, desenvolve como gente e erra
// como gente — deixa peça pendurada, não vê o garfo —, em vez do lance
// absurdo ao acaso.
//
// Níveis da rede: 1100 a 1900 (de 200 em 200). Abaixo de 1100, a mesma rede
// de 1100 com a política "esquentada" (mais erro); acima de 2000, o Maia não
// serve e o adversário volta ao Stockfish com sorteio (escolhaDeLance.ts).
// O "núcleo" corta a cauda de lances que quase ninguém jogaria, para o erro
// ser plausível. A correspondência força → nível é hipótese a calibrar.

export const NIVEIS_DO_MAIA = [1100, 1300, 1500, 1700, 1900] as const;
export type NivelDoMaia = (typeof NIVEIS_DO_MAIA)[number];

/** Até aqui o Maia joga; acima, o Stockfish. */
export const FORCA_MAXIMA_DO_MAIA = 2000;

const NUCLEO = 0.97;

export interface PerfilHumano {
  nivel: NivelDoMaia;
  temperatura: number;
}

export function perfilHumano(forca: number): PerfilHumano {
  const nivel = NIVEIS_DO_MAIA.reduce((melhor, n) => (Math.abs(n - forca) < Math.abs(melhor - forca) ? n : melhor));
  const temperatura = forca < 1100 ? Math.min(2, 1 + (1100 - forca) / 500) : 1;
  return { nivel, temperatura };
}

export function escolherLanceHumano(
  politica: ReadonlyMap<string, number>,
  temperatura: number,
  sorteio: () => number = Math.random,
): string {
  if (politica.size === 0) throw new Error("Sem lance legal");
  const ajustados = [...politica].map(([lance, p]) => [lance, p ** (1 / temperatura)] as const);
  const total = ajustados.reduce((soma, [, p]) => soma + p, 0);
  const ordenados = ajustados.map(([lance, p]) => [lance, p / total] as const).sort((a, b) => b[1] - a[1]);

  // núcleo: os lances mais prováveis que somam 97%
  const nucleo: Array<readonly [string, number]> = [];
  let acumulado = 0;
  for (const par of ordenados) {
    nucleo.push(par);
    acumulado += par[1];
    if (acumulado >= NUCLEO) break;
  }
  let alvo = sorteio() * acumulado;
  for (const [lance, p] of nucleo) {
    alvo -= p;
    if (alvo <= 0) return lance;
  }
  return nucleo[nucleo.length - 1][0];
}
