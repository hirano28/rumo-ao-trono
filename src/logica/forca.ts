// Força do jogador, categoria mostrada e força do adversário no tabuleiro
// (DESIGN.md §5). A força é escondida, em escala Elo; a tela mostra a
// categoria, porque em 1950 não existia rating.

export type Pontos = 0 | 0.5 | 1;

export interface ResultadoPartida {
  forcaAdversario: number;
  pontos: Pontos;
}

export type Modo = "carreira" | "realista";

export type Categoria =
  | "iniciante"
  | "terceira"
  | "segunda"
  | "primeira"
  | "candidato_a_mestre"
  | "mestre"
  | "grande_mestre";

export const CATEGORIAS: readonly Categoria[] = [
  "iniciante",
  "terceira",
  "segunda",
  "primeira",
  "candidato_a_mestre",
  "mestre",
  "grande_mestre",
];

/** Limite inferior de força de cada categoria (aproximação nossa, não histórica). */
const LIMITES: ReadonlyArray<[number, Categoria]> = [
  [2450, "grande_mestre"],
  [2250, "mestre"],
  [2050, "candidato_a_mestre"],
  [1800, "primeira"],
  [1500, "segunda"],
  [1150, "terceira"],
];

const DISTANCIA_MAXIMA = 400;
const QUEDA_MAXIMA = 100;

/**
 * Performance num desafio: média dos adversários + 400 × (vitórias − derrotas) / partidas,
 * presa a ±400 da média. Com força anterior, nunca cai mais de 100 abaixo dela.
 */
export function performance(resultados: readonly ResultadoPartida[], forcaAnterior?: number): number {
  if (resultados.length === 0) {
    throw new Error("Performance sem partidas");
  }
  const media = resultados.reduce((soma, r) => soma + r.forcaAdversario, 0) / resultados.length;
  const vitorias = resultados.filter((r) => r.pontos === 1).length;
  const derrotas = resultados.filter((r) => r.pontos === 0).length;
  const bruta = media + (DISTANCIA_MAXIMA * (vitorias - derrotas)) / resultados.length;
  const presa = Math.min(media + DISTANCIA_MAXIMA, Math.max(media - DISTANCIA_MAXIMA, bruta));
  const comPiso = forcaAnterior === undefined ? presa : Math.max(presa, forcaAnterior - QUEDA_MAXIMA);
  return Math.round(comPiso);
}

export function categoriaDa(forca: number): Categoria {
  for (const [limite, categoria] of LIMITES) {
    if (forca >= limite) return categoria;
  }
  return "iniciante";
}

export interface AdversarioDeForca {
  /** Força histórica estimada (é a que aparece na história). */
  forcaHistorica: number;
  /** Distância para a força do jogador no modo carreira. */
  degrau: number;
}

/**
 * Força com que o adversário joga de fato. Sem força do jogador (o primeiro
 * desafio, que calibra), vale a histórica nos dois modos.
 */
export function forcaNoTabuleiro(modo: Modo, adversario: AdversarioDeForca, forcaJogador?: number): number {
  if (modo === "realista" || forcaJogador === undefined) {
    return adversario.forcaHistorica;
  }
  return forcaJogador + adversario.degrau;
}
