// Os cenários desenhados à mão (arte provisória) e os personagens. Cada
// lugar da história escolhe o cenário pelo nome, no conteúdo.

import Phaser from "phaser";
import type { Cenario, Personagem } from "../logica/conteudo";
import { ALTURA, COR, LARGURA } from "./estilo";

export function desenharCenario(cena: Phaser.Scene, cenario: Cenario): void {
  if (cenario === "parque") desenharParque(cena);
  else desenharPalacio(cena);
}

/** Desenha o personagem e devolve a altura do corpo (para a área de clique). */
export function desenharPersonagem(cena: Phaser.Scene, personagem: Personagem): number {
  const { x, y, altura, chapeu } = personagem;
  const roupa = Number.parseInt(personagem.roupa.slice(1), 16);
  const g = cena.add.graphics();
  const h = 150 * altura;
  g.fillStyle(0x000000, 0.25).fillEllipse(x, y + h / 2 + 6, 90 * altura, 16);
  g.fillStyle(roupa).fillRoundedRect(x - 34 * altura, y - h / 2 + 34, 68 * altura, h - 34, 16);
  const cabeca = y - h / 2 + 16;
  const raio = 22 * Math.max(0.85, altura);
  g.fillStyle(0xd9b48f).fillCircle(x, cabeca, raio);
  if (chapeu) {
    // copa e aba por cima da cabeça, sem cobrir o rosto
    g.fillStyle(0x2b2118).fillRoundedRect(x - 17, cabeca - raio - 16, 34, 20, 7);
    g.fillEllipse(x, cabeca - raio + 4, 58, 10);
  } else {
    // cabelo
    g.fillStyle(0x3b2a1c).fillEllipse(x, cabeca - raio * 0.55, raio * 2.05, raio * 1.1);
  }
  return h;
}

function desenharParque(cena: Phaser.Scene): void {
  const g = cena.add.graphics();
  // céu de fim de tarde de outono
  const faixas = [0x8a9bb0, 0x9fa9b3, 0xb6b2a6, 0xc9b593];
  faixas.forEach((cor, i) => g.fillStyle(cor).fillRect(0, i * 70, LARGURA, 70));
  // prédios ao fundo
  g.fillStyle(0x6d6a66);
  [[0, 150, 180], [170, 120, 140], [300, 170, 120], [800, 130, 200], [1000, 160, 150], [1140, 110, 140]].forEach(([x, y, l]) =>
    g.fillRect(x, y, l, 280 - y),
  );
  g.fillStyle(0x5d5a57).fillRect(560, 60, 40, 220).fillTriangle(555, 60, 580, -20, 605, 60);
  // gramado e caminho
  g.fillStyle(0x58663f).fillRect(0, 280, LARGURA, ALTURA - 280);
  g.fillStyle(0xb9a27c).fillRect(0, 560, LARGURA, 90);
  g.fillStyle(0xa58f6b);
  for (let x = 0; x < LARGURA; x += 70) g.fillRect(x, 600, 34, 4);
  // árvores com folhas de outono
  [[90, 250], [470, 230], [790, 250], [1210, 240]].forEach(([x, y]) => {
    g.fillStyle(0x3a2a1a).fillRect(x - 10, y, 20, 150);
    [0xa4652a, 0xb87d35, 0x8f5a2a].forEach((cor, i) => g.fillStyle(cor).fillCircle(x + (i - 1) * 38, y - 10 - (i % 2) * 30, 62));
  });
  // mesas de pedra com tabuleiro
  [[480, 520], [800, 520]].forEach(([x, y]) => {
    g.fillStyle(0x8b8680).fillRect(x - 60, y - 14, 120, 18).fillRect(x - 12, y + 4, 24, 60);
    for (let c = 0; c < 8; c++) {
      g.fillStyle(c % 2 === 0 ? COR.casaClara : COR.casaEscura).fillRect(x - 40 + c * 10, y - 22, 10, 8);
    }
  });
  // banca de jornal
  g.fillStyle(0x4d5a3a).fillRect(1080, 300, 150, 120);
  g.fillStyle(0x6f7d55).fillTriangle(1070, 300, 1155, 260, 1240, 300);
  g.fillStyle(COR.papel).fillRect(1095, 320, 40, 50).fillRect(1145, 320, 40, 50);
}

/** O salão de xadrez: janelas altas em arco, assoalho de tacos, mesas longas, lustre. */
function desenharPalacio(cena: Phaser.Scene): void {
  const g = cena.add.graphics();
  // paredes claras e lambri escuro
  g.fillStyle(0xd8ccb0).fillRect(0, 0, LARGURA, 470);
  g.fillStyle(0x6b4a2f).fillRect(0, 380, LARGURA, 90);
  g.fillStyle(0x4a321f).fillRect(0, 376, LARGURA, 6);
  // janelas altas em arco, com luz de tarde
  for (const x of [120, 400, 880, 1160]) {
    g.fillStyle(0x9fb3c4).fillRect(x - 60, 90, 120, 230).fillEllipse(x, 90, 120, 110);
    g.fillStyle(0xc9d6df, 0.5).fillRect(x - 60, 90, 60, 230);
    g.lineStyle(6, 0xf2ead8).strokeRect(x - 60, 90, 120, 230);
    g.lineStyle(4, 0xf2ead8).lineBetween(x, 40, x, 320).lineBetween(x - 60, 200, x + 60, 200);
    g.fillStyle(0xffffff, 0.06).fillTriangle(x - 60, 320, x + 60, 320, x + 140, 640);
  }
  // quadro da tabela do torneio, entre as janelas
  g.fillStyle(0x3d2b1c).fillRect(560, 110, 160, 190);
  g.fillStyle(COR.papel).fillRect(572, 122, 136, 166);
  g.fillStyle(COR.tinta, 0.55);
  for (let i = 0; i < 7; i++) g.fillRect(582, 140 + i * 20, 116, 2);
  g.fillStyle(COR.vermelho).fillRect(572, 122, 136, 12);
  // lustre
  g.lineStyle(3, 0x8a6a43).lineBetween(640, 0, 640, 40);
  g.fillStyle(0xc9a35a).fillEllipse(640, 48, 120, 18);
  for (const dx of [-50, -25, 0, 25, 50]) g.fillStyle(COR.luz).fillCircle(640 + dx, 40, 6);
  // assoalho de tacos
  g.fillStyle(0x8a5d36).fillRect(0, 470, LARGURA, ALTURA - 470);
  g.fillStyle(0x7a5130);
  for (let y = 480; y < ALTURA; y += 30) {
    for (let x = (y / 30) % 2 === 0 ? 0 : 40; x < LARGURA; x += 80) g.fillRect(x, y, 40, 14);
  }
  // mesas longas com tabuleiros e relógios
  for (const y of [615, 695]) {
    g.fillStyle(0x5a3b22).fillRect(140, y - 18, 1000, 26);
    g.fillStyle(0x3d2716).fillRect(160, y + 8, 18, 50).fillRect(1102, y + 8, 18, 50);
    for (let x = 220; x < 1100; x += 220) {
      for (let c = 0; c < 8; c++) g.fillStyle(c % 2 === 0 ? COR.casaClara : COR.casaEscura).fillRect(x + c * 9, y - 26, 9, 8);
      g.fillStyle(0x2b2118).fillRect(x + 82, y - 34, 26, 16);
      g.fillStyle(COR.papel).fillCircle(x + 89, y - 26, 5).fillCircle(x + 101, y - 26, 5);
    }
  }
  // vitrine de troféus à direita
  g.fillStyle(0x4a321f).fillRect(1010, 250, 170, 130);
  g.fillStyle(0xa9c0c9, 0.35).fillRect(1020, 260, 150, 110);
  for (const [x, h] of [[1045, 40], [1085, 55], [1130, 35]]) {
    g.fillStyle(COR.dourado).fillRect(x - 6, 360 - h, 12, h).fillEllipse(x, 360 - h, 34, 16);
  }
}
