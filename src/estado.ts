// O que as cenas compartilham: o conteúdo da época e o progresso do jogador.

import epoca from "../conteudo/epocas/riga-1950/epoca.json";
import adversarios from "../conteudo/epocas/riga-1950/adversarios.json";
import dialogos from "../conteudo/epocas/riga-1950/dialogos.json";
import noticias from "../conteudo/epocas/riga-1950/noticias.json";
import type { Capitulo, ConteudoDaEpoca } from "./logica/conteudo";
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

export function capituloAtual(): Capitulo {
  const id = progresso().capitulo;
  const capitulo = CONTEUDO.epoca.capitulos.find((c) => c.id === id);
  if (!capitulo) throw new Error(`Capítulo inexistente: ${id}`);
  return capitulo;
}
