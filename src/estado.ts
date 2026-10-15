// O que as cenas compartilham: o conteúdo da época e o progresso do jogador.

import epoca from "../conteudo/epocas/riga-1950/epoca.json";
import adversarios from "../conteudo/epocas/riga-1950/adversarios.json";
import dialogos from "../conteudo/epocas/riga-1950/dialogos.json";
import noticias from "../conteudo/epocas/riga-1950/noticias.json";
import { pontosDoDesafio, type Capitulo, type ConteudoDaEpoca } from "./logica/conteudo";
import { forcaNoTabuleiro } from "./logica/forca";
import { VOCE, calendarioDo, jogosAte, rodadasCompletas, type Jogo, type Rodadas } from "./logica/torneio";
import { salvar, type Progresso } from "./logica/progresso";
import { agendarProgresso } from "./servidor/sincronia";

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
  agendarProgresso(novo);
}

export function guardar(): void {
  if (progressoAtual) {
    salvar(progressoAtual);
    agendarProgresso(progressoAtual);
  }
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
  const { desafio } = capituloAtual();
  const ids = desafio.torneio?.ordem ?? desafio.adversarios;
  const forcas: Record<string, number> = Object.fromEntries(ids.map((id) => [id, forcaDoAdversario(id)]));
  // a força do jogador nos jogos simulados dele (torneio grande): a do começo do capítulo
  forcas[VOCE] = progresso().forcas[VOCE] ?? progresso().forca ?? FORCA_SEM_CALIBRACAO;
  return forcas;
}

/** Quem nunca passou por um desafio de calibração (não acontece na carreira normal). */
const FORCA_SEM_CALIBRACAO = 1200;

/** O torneio do capítulo atual, com o calendário pronto, ou nada. */
export function torneioAtual(): { titulo: string; rodadas: Rodadas; ordem: readonly string[] } | undefined {
  const { desafio } = capituloAtual();
  if (!desafio.torneio) return undefined;
  return { titulo: desafio.torneio.titulo, ...calendarioDo(desafio.torneio, desafio.adversarios) };
}

/** Rodadas do torneio já completas (as simuladas antes da próxima partida ao vivo contam). */
export function rodadasJogadas(): number {
  const torneio = torneioAtual();
  if (!torneio) return 0;
  return rodadasCompletas(torneio.ordem, torneio.rodadas.length, capituloAtual().desafio.adversarios, progresso().resultados);
}

/** Os jogos do torneio até a rodada `ate`, com os do jogador (jogados ou simulados). */
export function jogosDoTorneio(ate = rodadasJogadas()): Jogo[] {
  const torneio = torneioAtual();
  if (!torneio) return [];
  const atual = progresso();
  return jogosAte(ate, torneio.rodadas, torneio.ordem, atual.resultados, forcasDoDesafio(), atual.semente, capituloAtual().desafio.adversarios);
}

/** Pontos do jogador no desafio; no torneio grande, contando os jogos simulados. */
export function pontosDoJogador(): number {
  const { desafio } = capituloAtual();
  if (!desafio.torneio?.ordem) return pontosDoDesafio(progresso().resultados, desafio.adversarios);
  return jogosDoTorneio().reduce((soma, j) => soma + (j.brancas === VOCE ? j.pontos : j.pretas === VOCE ? 1 - j.pontos : 0), 0);
}

/** Partidas do desafio (no torneio grande, todas as rodadas do jogador). */
export function partidasDoDesafio(): number {
  const { desafio } = capituloAtual();
  return desafio.torneio?.ordem?.length ?? desafio.adversarios.length;
}

/** A força com que o adversário joga neste capítulo (a gravada, se já jogou). */
export function forcaDoAdversario(id: string): number {
  const atual = progresso();
  const gravada = atual.forcas[id];
  if (gravada !== undefined) return gravada;
  const adversario = CONTEUDO.adversarios[id];
  return capituloAtual().desafio.calibracao ? adversario.forcaHistorica : forcaNoTabuleiro(atual.modo, adversario, atual.forca);
}

export function capituloAtual(): Capitulo {
  const id = progresso().capitulo;
  const capitulo = CONTEUDO.epoca.capitulos.find((c) => c.id === id);
  if (!capitulo) throw new Error(`Capítulo inexistente: ${id}`);
  return capitulo;
}
