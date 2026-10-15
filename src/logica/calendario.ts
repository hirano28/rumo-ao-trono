// O calendário de um torneio grande em turno único (DESIGN.md §4.2.1): com
// vinte jogadores ninguém escreve 190 jogos à mão. O método do círculo
// (as tabelas de Berger) gera as rodadas; a ordem em que o jogador enfrenta
// os outros é a dada pelo conteúdo, e o resto se arranja em volta dela.

import type { Rodadas } from "./torneio";

/**
 * As rodadas dos jogos entre os outros, para um jogador que enfrenta
 * `ordem[0]` na rodada 1, `ordem[1]` na rodada 2, e assim por diante.
 * Com número ímpar de participantes (contando o jogador), cada rodada tem
 * uma folga, que cai para quem enfrentaria o jogador na rodada a mais.
 */
export function calendarioCircular(ordem: readonly string[]): Rodadas {
  // número par de lugares: o jogador fixo no centro e os outros girando em volta
  const FOLGA = "\u0000folga";
  const outros = ordem.length % 2 === 1 ? [...ordem] : [...ordem, FOLGA];
  const n = outros.length + 1;
  // girando para a direita, o rival do centro é outros[0], depois outros[n-2], outros[n-3]…:
  // a roda começa arrumada para que a sequência seja a da `ordem`
  const roda = [outros[0], ...outros.slice(1).reverse()];
  const rodadas: Array<Array<readonly [string, string]>> = [];
  for (let r = 0; r < n - 1; r++) {
    const jogos: Array<readonly [string, string]> = [];
    for (let i = 1; i < n / 2; i++) {
      const a = roda[i];
      const b = roda[n - 1 - i];
      if (a === FOLGA || b === FOLGA) continue;
      // alterna as cores de rodada em rodada
      jogos.push((r + i) % 2 === 0 ? [a, b] : [b, a]);
    }
    rodadas.push(jogos);
    roda.unshift(roda.pop()!);
  }
  return rodadas;
}
