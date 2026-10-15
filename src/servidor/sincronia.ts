// A conta do jogador e o histórico no servidor. Nada aqui trava o jogo: o
// progresso continua salvo no navegador, e o servidor recebe uma cópia
// (o progresso, alguns segundos depois de mudar) e o histórico (cada partida
// e cada desafio). Sem conexão, partidas e desafios esperam numa fila.

import { enfileirar, gravarFila, lerFila, type Pendente, type TabelaDoHistorico } from "../logica/fila";
import type { Progresso } from "../logica/progresso";
import { servidor } from "./cliente";

const ESPERA_DO_PROGRESSO_MS = 2000;

function armazenamento(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export interface Conta {
  id: string;
  apelido: string;
}

let conta: Conta | undefined;

export function contaConectada(): Conta | undefined {
  return conta;
}

/** A conta desta sessão, se já existe (o jogador já escolheu o apelido neste navegador). */
export async function recuperarConta(): Promise<Conta | undefined> {
  try {
    const { data } = await servidor().auth.getSession();
    const id = data.session?.user.id;
    if (!id) return undefined;
    const { data: jogador, error } = await servidor().from("jogadores").select("id, apelido").eq("id", id).maybeSingle();
    if (error || !jogador) return undefined;
    conta = jogador as Conta;
    void esvaziarFila();
    return conta;
  } catch {
    return undefined;
  }
}

/** Cria a conta anônima com o apelido. Devolve a mensagem de erro, se falhar. */
export async function criarConta(apelido: string): Promise<Conta | string> {
  try {
    const { data: sessao } = await servidor().auth.getSession();
    let id = sessao.session?.user.id;
    if (!id) {
      const { data, error } = await servidor().auth.signInAnonymously();
      if (error || !data.user) return error?.message ?? "sem usuário";
      id = data.user.id;
    }
    const { error } = await servidor().from("jogadores").upsert({ id, apelido });
    if (error) return error.message;
    conta = { id, apelido };
    void esvaziarFila();
    return conta;
  } catch (erro) {
    return String(erro);
  }
}

let relogioDoProgresso: ReturnType<typeof setTimeout> | undefined;

/** Manda uma cópia do progresso, juntando as mudanças de alguns segundos numa gravação só. */
export function agendarProgresso(progresso: Progresso): void {
  if (!conta) return;
  clearTimeout(relogioDoProgresso);
  const copia = structuredClone(progresso);
  relogioDoProgresso = setTimeout(() => {
    if (!conta) return;
    void servidor()
      .from("progressos")
      .upsert({ jogador_id: conta.id, dados: copia })
      .then(({ error }) => error && console.warn("Progresso não chegou ao servidor:", error.message));
  }, ESPERA_DO_PROGRESSO_MS);
}

async function inserir(pendente: Pendente): Promise<boolean> {
  if (!conta) return false;
  const { error } = await servidor()
    .from(pendente.tabela)
    .insert({ ...pendente.linha, jogador_id: conta.id });
  if (error) console.warn(`Registro em ${pendente.tabela} não chegou ao servidor:`, error.message);
  return !error;
}

/** Registra no histórico; sem conta ou sem conexão, guarda para mandar depois. */
export function registrar(tabela: TabelaDoHistorico, linha: Record<string, unknown>): void {
  const pendente = { tabela, linha };
  void inserir(pendente)
    .then((foi) => {
      if (!foi) enfileirar(pendente, armazenamento());
    })
    .catch(() => enfileirar(pendente, armazenamento()));
}

let esvaziando = false;

async function esvaziarFila(): Promise<void> {
  if (esvaziando || !conta) return;
  esvaziando = true;
  try {
    const fila = lerFila(armazenamento());
    const sobra: Pendente[] = [];
    for (const pendente of fila) {
      if (!(await inserir(pendente).catch(() => false))) sobra.push(pendente);
    }
    // o que entrou na fila enquanto ela era enviada fica para a próxima vez
    const chegaram = lerFila(armazenamento()).slice(fila.length);
    gravarFila([...sobra, ...chegaram], armazenamento());
  } finally {
    esvaziando = false;
  }
}
