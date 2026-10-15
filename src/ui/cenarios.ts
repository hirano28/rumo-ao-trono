// Os lugares da história: a ilustração do cenário, a vida dele (folhas
// caindo no parque, poeira na luz do Palácio, fumaça no clube) e os
// personagens, que respiram
// e piscam.

import Phaser from "phaser";
import type { Cenario, Personagem } from "../logica/conteudo";
import { PERSONAGEM_ALTURA, chaveDaArte, chaveDoPersonagem } from "./arte";
import { ALTURA, LARGURA } from "./estilo";

/** Quanto do desenho (300 px) o personagem adulto ocupa na tela. */
const ESCALA_DO_PERSONAGEM = 0.82;

export function desenharCenario(cena: Phaser.Scene, cenario: Cenario): void {
  cena.add.image(LARGURA / 2, ALTURA / 2, chaveDaArte(cenario));
  if (cenario === "parque") folhasCaindo(cena);
  else if (cenario === "clube") fumacaNoAr(cena);
  else poeiraNaLuz(cena);
}

/**
 * Desenha o personagem com os pés em (x, y) e devolve a altura dele na tela
 * (para a área de clique e o nome embaixo).
 */
export function desenharPersonagem(cena: Phaser.Scene, personagem: Personagem): number {
  const escala = ESCALA_DO_PERSONAGEM * personagem.altura;
  const figura = cena.add.image(personagem.x, personagem.y, chaveDoPersonagem(personagem.id)).setOrigin(0.5, 1).setScale(escala);
  // respira: o corpo sobe e desce um quase nada
  cena.tweens.add({
    targets: figura,
    scaleY: escala * 1.012,
    duration: Phaser.Math.Between(1800, 2400),
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
    delay: Phaser.Math.Between(0, 1000),
  });
  // pisca: troca o desenho por um instante, de tempos em tempos
  const piscar = () => {
    if (!figura.active) return;
    figura.setTexture(chaveDoPersonagem(personagem.id, true));
    cena.time.delayedCall(140, () => figura.active && figura.setTexture(chaveDoPersonagem(personagem.id)));
    cena.time.delayedCall(Phaser.Math.Between(2500, 6000), piscar);
  };
  cena.time.delayedCall(Phaser.Math.Between(800, 4000), piscar);
  return PERSONAGEM_ALTURA * escala;
}

function folhasCaindo(cena: Phaser.Scene): void {
  const cores = [0xb8742c, 0xc98a38, 0x9c5a24, 0xd9a04a];
  for (let i = 0; i < 9; i++) {
    const folha = cena.add.ellipse(0, 0, 9, 4, cores[i % cores.length]).setDepth(40);
    const cair = () => {
      if (!folha.active) return;
      const inicioX = Phaser.Math.Between(0, LARGURA);
      folha.setPosition(inicioX, Phaser.Math.Between(-40, 260)).setAlpha(0.9).setRotation(Phaser.Math.FloatBetween(0, Math.PI));
      cena.tweens.add({
        targets: folha,
        x: inicioX + Phaser.Math.Between(-160, 160),
        y: Phaser.Math.Between(560, 700),
        rotation: folha.rotation + Phaser.Math.FloatBetween(2, 6),
        duration: Phaser.Math.Between(7000, 12000),
        ease: "Sine.easeIn",
        onComplete: () => cena.time.delayedCall(Phaser.Math.Between(0, 4000), cair),
      });
    };
    cena.time.delayedCall(i * 900, cair);
  }
}

/** Fumaça de cigarro subindo devagar sobre as mesas, sob as luminárias. */
function fumacaNoAr(cena: Phaser.Scene): void {
  for (let i = 0; i < 14; i++) {
    const fio = cena.add.circle(0, 0, Phaser.Math.Between(10, 22), 0xd8d2c4, 0).setDepth(40);
    const subir = () => {
      if (!fio.active) return;
      const x = Phaser.Math.Between(120, LARGURA - 120);
      fio.setPosition(x, Phaser.Math.Between(430, 520)).setAlpha(0).setScale(0.6);
      cena.tweens.add({
        targets: fio,
        x: x + Phaser.Math.Between(-60, 60),
        y: Phaser.Math.Between(120, 260),
        scale: Phaser.Math.FloatBetween(1.6, 2.6),
        alpha: { from: 0.12, to: 0 },
        duration: Phaser.Math.Between(9000, 15000),
        ease: "Sine.easeOut",
        onComplete: () => cena.time.delayedCall(Phaser.Math.Between(0, 3000), subir),
      });
    };
    cena.time.delayedCall(i * 700, subir);
  }
}

function poeiraNaLuz(cena: Phaser.Scene): void {
  // dentro dos raios de luz das janelas
  for (let i = 0; i < 22; i++) {
    const janela = [130, 400, 880][i % 3];
    const x = janela + Phaser.Math.Between(-40, 140);
    const y = Phaser.Math.Between(180, 600);
    const grao = cena.add.circle(x, y, Phaser.Math.FloatBetween(0.8, 1.8), 0xfff4d6, Phaser.Math.FloatBetween(0.2, 0.5));
    cena.tweens.add({
      targets: grao,
      x: x + Phaser.Math.Between(-25, 25),
      y: y + Phaser.Math.Between(-30, 20),
      alpha: { from: grao.alpha, to: 0.05 },
      duration: Phaser.Math.Between(4000, 8000),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: Phaser.Math.Between(0, 3000),
    });
  }
}
