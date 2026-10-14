// O lance do adversário. Até a força 2000, o Maia (rede treinada em partidas
// humanas) sorteia um lance humano; acima, o Stockfish analisa na
// profundidade da força e o sorteio de escolhaDeLance decide. Se o Maia
// falhar, cai no Stockfish; se o Stockfish falhar, quem chama sorteia um
// lance legal.

import type { Chess } from "chess.js";
import { escolherLance, LINHAS_ANALISADAS, perfilDaForca, type Sorteio } from "../logica/escolhaDeLance";
import { FORCA_MAXIMA_DO_MAIA, escolherLanceHumano, perfilHumano } from "../logica/escolhaHumana";
import { politicaDoMaia, prepararMaia } from "../maia/maia";
import type { Motor } from "./motor";

export interface LanceUci {
  from: string;
  to: string;
  promotion?: string;
}

function paraLance(uci: string): LanceUci {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] };
}

/** Chamar ao abrir a partida: baixa a rede certa enquanto o jogador pensa. */
export function prepararAdversario(forca: number): void {
  if (forca <= FORCA_MAXIMA_DO_MAIA) prepararMaia(perfilHumano(forca).nivel);
}

export async function lanceDoAdversario(
  motor: () => Motor,
  partida: Chess,
  forca: number,
  sorteio: Sorteio = Math.random,
): Promise<LanceUci> {
  if (forca <= FORCA_MAXIMA_DO_MAIA) {
    try {
      const { nivel, temperatura } = perfilHumano(forca);
      return paraLance(escolherLanceHumano(await politicaDoMaia(partida, nivel), temperatura, sorteio));
    } catch (erro) {
      console.error("Maia indisponível; o Stockfish assume", erro);
    }
  }
  const perfil = perfilDaForca(forca);
  const legais = partida.moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ""));
  const linhas = await motor().analisar(partida.fen(), perfil.profundidade, LINHAS_ANALISADAS);
  return paraLance(escolherLance(linhas, legais, perfil, sorteio));
}
