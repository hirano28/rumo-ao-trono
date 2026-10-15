// A arte do jogo (public/arte/): cenários, mesas, título e personagens, em
// SVG. Carrega tudo uma vez, na tela de título.

import Phaser from "phaser";
import { ALTURA, LARGURA } from "./estilo";

export const CENARIOS = ["titulo", "quarto", "parque", "palacio", "mesa-parque", "mesa-palacio"] as const;

export const PERSONAGENS = ["peteris", "grisha", "ozols", "marta", "kruzkops", "tal", "valdis", "ilze", "boris", "gipslis"] as const;

/** Tamanho em que o personagem é desenhado (a cena escala pela altura da ficha). */
export const PERSONAGEM_LARGURA = 160;
export const PERSONAGEM_ALTURA = 300;

export function chaveDaArte(nome: string): string {
  return `arte-${nome}`;
}

export function chaveDoPersonagem(id: string, piscando = false): string {
  return `personagem-${id}${piscando ? "-piscando" : ""}`;
}

export function carregarArte(cena: Phaser.Scene): void {
  const base = `${import.meta.env.BASE_URL}arte/`;
  for (const nome of CENARIOS) {
    if (!cena.textures.exists(chaveDaArte(nome))) cena.load.svg(chaveDaArte(nome), `${base}${nome}.svg`, { width: LARGURA, height: ALTURA });
  }
  for (const id of PERSONAGENS) {
    for (const piscando of [false, true]) {
      const chave = chaveDoPersonagem(id, piscando);
      if (!cena.textures.exists(chave)) {
        cena.load.svg(chave, `${base}personagens/${id}${piscando ? "-piscando" : ""}.svg`, {
          width: PERSONAGEM_LARGURA,
          height: PERSONAGEM_ALTURA,
        });
      }
    }
  }
}
