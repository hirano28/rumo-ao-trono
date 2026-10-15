// Registros que não chegaram ao servidor (sem internet, servidor fora):
// ficam guardados no navegador e são reenviados na próxima vez.

import type { Armazenamento } from "./progresso";

export type TabelaDoHistorico = "partidas" | "desafios";

export interface Pendente {
  tabela: TabelaDoHistorico;
  linha: Record<string, unknown>;
}

const CHAVE = "rumo-ao-trono:pendentes";
/** Acima disso, os mais antigos saem: a fila não pode crescer sem fim. */
export const LIMITE_DA_FILA = 200;

export function lerFila(armazenamento?: Armazenamento): Pendente[] {
  try {
    const bruto = armazenamento?.getItem(CHAVE);
    const dado = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(dado) ? dado.filter((p) => p && (p.tabela === "partidas" || p.tabela === "desafios") && typeof p.linha === "object") : [];
  } catch {
    return [];
  }
}

export function gravarFila(fila: readonly Pendente[], armazenamento?: Armazenamento): void {
  try {
    armazenamento?.setItem(CHAVE, JSON.stringify(fila.slice(-LIMITE_DA_FILA)));
  } catch {
    // sem armazenamento: o registro se perde, o jogo segue
  }
}

export function enfileirar(pendente: Pendente, armazenamento?: Armazenamento): void {
  gravarFila([...lerFila(armazenamento), pendente], armazenamento);
}

/** Apelido limpo: sem espaços nas pontas, no máximo 30 letras; vazio vira undefined. */
export function limparApelido(texto: string): string | undefined {
  const limpo = texto.replace(/\s+/g, " ").trim().slice(0, 30);
  return limpo.length > 0 ? limpo : undefined;
}
