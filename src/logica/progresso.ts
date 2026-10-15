// O progresso do jogador e o salvamento no navegador. O armazenamento pode
// faltar (aba anônima, bloqueio): o jogo continua, só não lembra.

import type { Modo, Pontos } from "./forca";
import { IDIOMAS, type Idioma } from "../i18n/textos";
import { normalizarAdiada, type PartidaAdiada } from "./adiamento";

export interface Progresso {
  versao: 1;
  idioma: Idioma;
  modo: Modo;
  capitulo: string;
  /** Força calculada ao fim do último desafio; ausente antes do primeiro. */
  forca?: number;
  /** Pontos de cada partida do desafio em curso, por adversário. */
  resultados: Record<string, Pontos>;
  /** Força com que cada adversário do desafio em curso jogou de fato. */
  forcas: Record<string, number>;
  /** Capítulos cujo desafio já foi vencido. */
  concluidos: string[];
  /** Objetos e conversas já vistos, como "capitulo:id". */
  vistos: string[];
  /** Fixa os resultados simulados do torneio deste jogo. */
  semente: string;
  /** A partida adiada do desafio em curso, com o lance secreto, até a retomada. */
  adiada?: PartidaAdiada;
}

const CHAVE = "rumo-ao-trono:progresso";

export function novoProgresso(idioma: Idioma, modo: Modo, capitulo: string): Progresso {
  return { versao: 1, idioma, modo, capitulo, resultados: {}, forcas: {}, concluidos: [], vistos: [], semente: novaSemente() };
}

/**
 * Começa (ou recomeça) um capítulo, escolhido na tela de capítulos: zera as
 * partidas dele (e a adiada) e o tira dos concluídos (para o resultado ser recalculado
 * no fim), mas mantém o resto da carreira: força, outros capítulos, vistos.
 */
export function comecarCapitulo(salvo: Progresso | undefined, capitulo: string, idioma: Idioma, modo: Modo): Progresso {
  const base: Progresso = { ...(salvo ?? novoProgresso(idioma, modo, capitulo)) };
  delete base.adiada; // o envelope era do desafio anterior
  return {
    ...base,
    idioma,
    modo,
    capitulo,
    resultados: {},
    forcas: {},
    semente: novaSemente(),
    concluidos: base.concluidos.filter((c) => c !== capitulo),
  };
}

/**
 * Os capítulos que o jogador pode abrir: o primeiro, os já concluídos, o que
 * está em andamento e o seguinte a um concluído. Capítulo futuro fica
 * trancado até o anterior ser vencido.
 */
export function capitulosLiberados(ordem: readonly string[], salvo?: Progresso): Set<string> {
  const liberados = new Set<string>(ordem.slice(0, 1));
  if (!salvo) return liberados;
  liberados.add(salvo.capitulo);
  ordem.forEach((id, i) => {
    if (salvo.concluidos.includes(id)) {
      liberados.add(id);
      if (ordem[i + 1]) liberados.add(ordem[i + 1]);
    }
  });
  return liberados;
}

export function novaSemente(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface Armazenamento {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
}

function armazenamentoPadrao(): Armazenamento | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function carregar(armazenamento = armazenamentoPadrao()): Progresso | undefined {
  try {
    const bruto = armazenamento?.getItem(CHAVE);
    if (!bruto) return undefined;
    return normalizar(JSON.parse(bruto));
  } catch {
    return undefined;
  }
}

const PONTOS_VALIDOS: readonly unknown[] = [0, 0.5, 1];

function textos(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [];
}

function registro<T>(valor: unknown, aceita: (v: unknown) => v is T): Record<string, T> {
  const saida: Record<string, T> = {};
  if (valor && typeof valor === "object" && !Array.isArray(valor)) {
    for (const [chave, v] of Object.entries(valor)) if (aceita(v)) saida[chave] = v;
  }
  return saida;
}

/**
 * Progresso salvo, de qualquer versão antiga ou estragado, vira um progresso
 * válido: o que não tiver o tipo certo cai no valor de um jogo novo.
 * Sem versão 1 ou sem capítulo, não há o que aproveitar.
 */
export function normalizar(dado: unknown): Progresso | undefined {
  if (!dado || typeof dado !== "object") return undefined;
  const d = dado as Record<string, unknown>;
  if (d.versao !== 1 || typeof d.capitulo !== "string") return undefined;
  const idioma = IDIOMAS.includes(d.idioma as Idioma) ? (d.idioma as Idioma) : "pt-BR";
  const modo: Modo = d.modo === "realista" ? "realista" : "carreira";
  const progresso = novoProgresso(idioma, modo, d.capitulo);
  if (typeof d.forca === "number" && Number.isFinite(d.forca)) progresso.forca = d.forca;
  progresso.resultados = registro(d.resultados, (v): v is Pontos => PONTOS_VALIDOS.includes(v));
  progresso.forcas = registro(d.forcas, (v): v is number => typeof v === "number" && Number.isFinite(v));
  progresso.concluidos = textos(d.concluidos);
  // antes dos capítulos, os vistos não tinham prefixo: eram todos do capítulo 1
  progresso.vistos = textos(d.vistos).map((v) => (v.includes(":") ? v : `cap1:${v}`));
  if (typeof d.semente === "string" && d.semente) progresso.semente = d.semente;
  const adiada = normalizarAdiada(d.adiada);
  // envelope de outro capítulo, ou de partida que já tem resultado, não vale mais
  if (adiada && adiada.capitulo === progresso.capitulo && progresso.resultados[adiada.adversario] === undefined) {
    progresso.adiada = adiada;
  }
  return progresso;
}

export function salvar(progresso: Progresso, armazenamento = armazenamentoPadrao()): void {
  try {
    armazenamento?.setItem(CHAVE, JSON.stringify(progresso));
  } catch {
    // sem armazenamento: o jogo segue sem lembrar
  }
}
