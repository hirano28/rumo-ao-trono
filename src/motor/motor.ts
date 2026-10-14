// O Stockfish num Web Worker (build "lite single-threaded": não precisa de
// SharedArrayBuffer, então roda no itch.io sem cabeçalho especial). Uma
// análise por vez: os pedidos entram numa fila. Se o worker falhar (arquivo
// que não carrega, falta de memória) ou não responder no prazo, o motor se
// dá por quebrado: a análise é rejeitada e o próximo pedido cria outro motor.

import { lerAnalise } from "../logica/uci";
import type { LinhaAnalise } from "../logica/escolhaDeLance";

/** Primeira carga: ~7 MB de WASM, numa conexão lenta. */
const PRAZO_DA_CARGA_MS = 60_000;
const PRAZO_DA_ANALISE_MS = 20_000;

export class Motor {
  private readonly worker: Worker;
  private ouvinte?: (linha: string) => void;
  private falhar?: (erro: Error) => void;
  private fila: Promise<unknown>;
  quebrado = false;

  constructor(url = `${import.meta.env.BASE_URL}motor/stockfish-18-lite-single.js`) {
    this.worker = new Worker(url);
    this.worker.onmessage = (evento: MessageEvent) => this.ouvinte?.(String(evento.data));
    this.worker.onerror = (evento: ErrorEvent) => {
      evento.preventDefault();
      this.quebrar(new Error(`Falha no motor: ${evento.message}`));
    };
    this.fila = this.enviar("uci", (l) => l === "uciok", PRAZO_DA_CARGA_MS).then(() =>
      this.enviar("isready", (l) => l === "readyok", PRAZO_DA_CARGA_MS),
    );
  }

  analisar(fen: string, profundidade: number, multipv: number): Promise<LinhaAnalise[]> {
    const tarefa = this.fila.then(async () => {
      this.worker.postMessage(`setoption name MultiPV value ${multipv}`);
      this.worker.postMessage(`position fen ${fen}`);
      const saida = await this.enviar(`go depth ${profundidade}`, (l) => l.startsWith("bestmove"), PRAZO_DA_ANALISE_MS);
      return lerAnalise(saida);
    });
    this.fila = tarefa.catch(() => undefined);
    return tarefa;
  }

  novaPartida(): void {
    if (!this.quebrado) this.worker.postMessage("ucinewgame");
  }

  private quebrar(erro: Error): void {
    if (this.quebrado) return;
    this.quebrado = true;
    this.ouvinte = undefined;
    this.worker.terminate();
    this.falhar?.(erro);
    this.falhar = undefined;
  }

  private enviar(comando: string, fim: (linha: string) => boolean, prazo: number): Promise<string[]> {
    return new Promise((resolver, rejeitar) => {
      if (this.quebrado) {
        rejeitar(new Error("Motor quebrado"));
        return;
      }
      const linhas: string[] = [];
      const relogio = setTimeout(() => this.quebrar(new Error(`Motor sem resposta a "${comando}"`)), prazo);
      this.falhar = (erro) => {
        clearTimeout(relogio);
        rejeitar(erro);
      };
      this.ouvinte = (linha) => {
        linhas.push(linha);
        if (fim(linha)) {
          clearTimeout(relogio);
          this.ouvinte = undefined;
          this.falhar = undefined;
          resolver(linhas);
        }
      };
      this.worker.postMessage(comando);
    });
  }
}

let unico: Motor | undefined;

/** O motor é um só para o jogo inteiro (carregar o WASM custa ~7 MB); quebrado, nasce outro. */
export function motor(): Motor {
  if (!unico || unico.quebrado) unico = new Motor();
  return unico;
}
