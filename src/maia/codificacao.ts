// A codificação de entrada e o mapa de saída da rede do Maia (formato
// "clássico" do lc0), para rodar o .onnx no navegador. Conferida lance a lance
// contra o próprio lc0 em testes/maia.test.ts (referência gerada por
// ferramentas/referencia_maia.mjs).
//
// Entrada: 112 planos de 8×8. Oito posições (a atual e as sete anteriores),
// 13 planos cada (6 tipos de peça de quem joga, 6 do adversário, 1 de
// repetição), sempre do ponto de vista de quem joga agora: com as pretas,
// o tabuleiro é espelhado (fileira 1 ↔ 8). Antes do começo da partida, os
// planos ficam zerados. Depois: 104–107 roques (grande e pequeno, nosso e
// deles), 108 = pretas jogam, 109 = contagem dos 50 lances, 110 = zeros,
// 111 = uns.
//
// Saída: 1858 valores, um por lance no vocabulário do lc0 — 1792 lances de
// dama ou cavalo por casa de origem, mais 66 promoções a dama, torre e bispo.
// A promoção a cavalo é o lance sem sufixo; o roque é o rei "capturando" a
// própria torre (e1h1, e1a1).

import type { Chess } from "chess.js";

export const PLANOS = 112;
export const TAMANHO_DA_POLITICA = 1858;

const PECAS = "pnbrqk";
const COLUNAS = "abcdefgh";

function nomeDaCasa(indice: number): string {
  return `${COLUNAS[indice % 8]}${Math.floor(indice / 8) + 1}`;
}

function vocabulario(): string[] {
  const lances: string[] = [];
  const direcoes = [
    [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];
  const cavalo = [
    [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
  ];
  for (let origem = 0; origem < 64; origem++) {
    const coluna = origem % 8;
    const fileira = Math.floor(origem / 8);
    const destinos: number[] = [];
    for (const [dc, df] of direcoes) {
      for (let passo = 1; passo < 8; passo++) {
        const c = coluna + dc * passo;
        const f = fileira + df * passo;
        if (c < 0 || c > 7 || f < 0 || f > 7) break;
        destinos.push(f * 8 + c);
      }
    }
    for (const [dc, df] of cavalo) {
      const c = coluna + dc;
      const f = fileira + df;
      if (c >= 0 && c <= 7 && f >= 0 && f <= 7) destinos.push(f * 8 + c);
    }
    destinos.sort((a, b) => a - b);
    for (const destino of destinos) lances.push(nomeDaCasa(origem) + nomeDaCasa(destino));
  }
  for (let coluna = 0; coluna < 8; coluna++) {
    for (const dc of [-1, 0, 1]) {
      const destino = coluna + dc;
      if (destino < 0 || destino > 7) continue;
      for (const peca of "qrb") lances.push(`${COLUNAS[coluna]}7${COLUNAS[destino]}8${peca}`);
    }
  }
  return lances;
}

export const VOCABULARIO = vocabulario();
const INDICE = new Map(VOCABULARIO.map((lance, i) => [lance, i]));

const ROQUE: Record<string, string> = { e1g1: "e1h1", e1c1: "e1a1" };

/**
 * Índice na política de um lance em UCI (ex.: "e7e5", "a2a1n"), do ponto de
 * vista de quem joga. Com as pretas, espelha as fileiras antes de procurar.
 */
export function indiceDoLance(uci: string, vez: "w" | "b", ehRoque: boolean): number {
  const espelhar = (casa: string) => (vez === "b" ? `${casa[0]}${9 - Number(casa[1])}` : casa);
  let lance = espelhar(uci.slice(0, 2)) + espelhar(uci.slice(2, 4));
  if (ehRoque) lance = ROQUE[lance] ?? lance;
  const promocao = uci[4];
  if (promocao && promocao !== "n") lance += promocao;
  const indice = INDICE.get(lance);
  if (indice === undefined) throw new Error(`Lance fora do vocabulário do Maia: ${uci}`);
  return indice;
}

/** Peças de um FEN: [coluna 0–7, fileira 0–7, cor, tipo]. */
function pecasDoFen(fen: string): Array<[number, number, "w" | "b", string]> {
  const pecas: Array<[number, number, "w" | "b", string]> = [];
  fen
    .split(" ")[0]
    .split("/")
    .forEach((linha, i) => {
      const fileira = 7 - i;
      let coluna = 0;
      for (const simbolo of linha) {
        if (/\d/.test(simbolo)) {
          coluna += Number(simbolo);
        } else {
          const cor = simbolo === simbolo.toUpperCase() ? "w" : "b";
          pecas.push([coluna, fileira, cor, simbolo.toLowerCase()]);
          coluna++;
        }
      }
    });
  return pecas;
}

/** A posição sem os contadores: o que conta para a repetição. */
function chaveDeRepeticao(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

export function codificar(partida: Chess): Float32Array {
  const planos = new Float32Array(PLANOS * 64);
  const vez = partida.turn();
  const historico = partida.history({ verbose: true });
  // todas as posições da partida, da mais antiga à atual
  const posicoes = [...historico.map((lance) => lance.before), partida.fen()];
  const chaves = posicoes.map(chaveDeRepeticao);

  for (let i = 0; i < 8; i++) {
    const indice = posicoes.length - 1 - i;
    if (indice < 0) break;
    const base = i * 13;
    for (const [coluna, fileira, cor, tipo] of pecasDoFen(posicoes[indice])) {
      const plano = base + (cor === vez ? 0 : 6) + PECAS.indexOf(tipo);
      const f = vez === "w" ? fileira : 7 - fileira;
      planos[plano * 64 + f * 8 + coluna] = 1;
    }
    if (chaves.slice(0, indice).includes(chaves[indice])) planos.fill(1, (base + 12) * 64, (base + 13) * 64);
  }

  const [, , roques, , meioLances] = partida.fen().split(" ");
  const nosso = vez === "w" ? ["Q", "K"] : ["q", "k"];
  const deles = vez === "w" ? ["q", "k"] : ["Q", "K"];
  [...nosso, ...deles].forEach((letra, i) => {
    if (roques.includes(letra)) planos.fill(1, (104 + i) * 64, (105 + i) * 64);
  });
  if (vez === "b") planos.fill(1, 108 * 64, 109 * 64);
  planos.fill(Number(meioLances), 109 * 64, 110 * 64);
  planos.fill(1, 111 * 64, 112 * 64);
  return planos;
}

/**
 * Probabilidade de cada lance legal (em UCI), a partir dos 1858 valores crus
 * da rede: softmax só entre os legais.
 */
export function politicaDosLegais(partida: Chess, saida: ArrayLike<number>): Map<string, number> {
  const vez = partida.turn();
  const legais = partida.moves({ verbose: true }).map((m) => ({
    uci: m.from + m.to + (m.promotion ?? ""),
    valor: saida[indiceDoLance(m.from + m.to + (m.promotion ?? ""), vez, m.isKingsideCastle() || m.isQueensideCastle())],
  }));
  const maior = Math.max(...legais.map((l) => l.valor));
  const pesos = legais.map((l) => Math.exp(l.valor - maior));
  const total = pesos.reduce((a, b) => a + b, 0);
  return new Map(legais.map((l, i) => [l.uci, pesos[i] / total]));
}
