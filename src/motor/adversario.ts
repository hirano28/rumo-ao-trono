// O lance do adversário: análise do motor na profundidade da força dele, e o
// sorteio humano de escolhaDeLance.

import type { Chess } from "chess.js";
import { escolherLance, LINHAS_ANALISADAS, perfilDaForca, type Sorteio } from "../logica/escolhaDeLance";
import type { Motor } from "./motor";

export interface LanceUci {
  from: string;
  to: string;
  promotion?: string;
}

export async function lanceDoAdversario(
  motor: Motor,
  partida: Chess,
  forca: number,
  sorteio: Sorteio = Math.random,
): Promise<LanceUci> {
  const perfil = perfilDaForca(forca);
  const legais = partida.moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ""));
  const linhas = await motor.analisar(partida.fen(), perfil.profundidade, LINHAS_ANALISADAS);
  const uci = escolherLance(linhas, legais, perfil, sorteio);
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] };
}
