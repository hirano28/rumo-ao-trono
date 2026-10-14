// O que as cenas compartilham: o conteúdo da época e o progresso do jogador.

import epoca from "../conteudo/epocas/riga-1950/epoca.json";
import adversarios from "../conteudo/epocas/riga-1950/adversarios.json";
import dialogos from "../conteudo/epocas/riga-1950/dialogos.json";
import noticias from "../conteudo/epocas/riga-1950/noticias.json";
import type { Capitulo, ConteudoDaEpoca } from "./logica/conteudo";
import { forcaNoTabuleiro } from "./logica/forca";
import { salvar, type Progresso } from "./logica/progresso";

export const CONTEUDO: ConteudoDaEpoca = {
  epoca,
  adversarios,
  dialogos,
  noticias,
} as ConteudoDaEpoca;

let progressoAtual: Progresso | undefined;

export function progresso(): Progresso {
  if (!progressoAtual) throw new Error("Jogo sem progresso: comece pela tela de título");
  return progressoAtual;
}

export function definirProgresso(novo: Progresso): void {
  progressoAtual = novo;
  salvar(novo);
}

export function guardar(): void {
  if (progressoAtual) salvar(progressoAtual);
}

/** Chave de "já visto" de um objeto ou personagem: o jornal do capítulo 2 é outro jornal. */
export function vistoChave(id: string): string {
  return `${progresso().capitulo}:${id}`;
}

/** O capítulo seguinte ao atual, se houver. */
export function proximoCapitulo(): Capitulo | undefined {
  const capitulos = CONTEUDO.epoca.capitulos;
  return capitulos[capitulos.findIndex((c) => c.id === progresso().capitulo) + 1];
}

/**
 * A força de cada adversário do desafio: a gravada na partida, ou a que ele
 * teria no tabuleiro. A força do jogador só muda no fim do capítulo, então as
 * duas coincidem e os jogos simulados do torneio não mudam de uma rodada
 * para outra.
 */
export function forcasDoDesafio(): Record<string, number> {
  const atual = progresso();
  return Object.fromEntries(
    capituloAtual().desafio.adversarios.map((id) => [id, atual.forcas[id] ?? forcaNoTabuleiro(atual.modo, CONTEUDO.adversarios[id], atual.forca)]),
  );
}

export function capituloAtual(): Capitulo {
  const id = progresso().capitulo;
  const capitulo = CONTEUDO.epoca.capitulos.find((c) => c.id === id);
  if (!capitulo) throw new Error(`Capítulo inexistente: ${id}`);
  return capitulo;
}
