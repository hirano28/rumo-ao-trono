// O quarto: janela para os telhados de Riga, a escrivaninha com a luminária,
// e os objetos que trazem a época (jornal, revista, livro, tabuleiro).

import Phaser from "phaser";
import { CONTEUDO, capituloAtual, guardar, progresso, vistoChave } from "../estado";
import { dataPorExtenso, t } from "../i18n/textos";
import type { ObjetoDoQuarto } from "../logica/conteudo";
import { chaveDaArte } from "../ui/arte";
import { clicavel } from "../ui/clicavel";
import { folhaDePapel, type Secao } from "../ui/componentes";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";
import { trocarDeCena } from "../ui/transicao";

/** Onde cada objeto está na pintura do quarto (public/arte/pintado/quarto.jpg). */
const LUGAR: Record<string, { x: number; y: number; l: number; a: number }> = {
  jornal: { x: 760, y: 456, l: 130, a: 30 },
  revista: { x: 960, y: 456, l: 150, a: 30 },
  livro: { x: 1012, y: 245, l: 250, a: 70 },
  tabuleiro: { x: 625, y: 452, l: 100, a: 34 },
};
const PORTA = { x: 105, y: 405, l: 150, a: 280 };

export class Quarto extends Phaser.Scene {
  private aberto = false;

  constructor() {
    super("Quarto");
  }


  create(): void {
    this.aberto = false;
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.desenharQuarto();

    const capitulo = capituloAtual();
    const quarto = capitulo.quarto!;
    for (const objeto of quarto.objetos) {
      const lugar = LUGAR[objeto.id];
      if (!lugar) continue;
      clicavel(this, lugar.x, lugar.y, lugar.l, lugar.a, t(objeto.rotulo), () => this.abrir(objeto), {
        visto: progresso().vistos.includes(vistoChave(objeto.id)),
      });
    }
    clicavel(this, PORTA.x, PORTA.y, PORTA.l, PORTA.a, t(quarto.saida), () => this.sair(), { rotuloEmCima: true, visto: true });

    this.add
      .text(LARGURA / 2, 30, t("quarto.dica"), {
        fontFamily: FONTE.corpo,
        fontSize: "17px",
        fontStyle: "italic",
        color: css(COR.papelSombra),
        backgroundColor: "rgba(20,17,13,0.6)",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5);
  }

  private abrir(objeto: ObjetoDoQuarto): void {
    if (this.aberto) return;
    this.aberto = true;
    const vistos = progresso().vistos;
    if (!vistos.includes(vistoChave(objeto.id))) {
      vistos.push(vistoChave(objeto.id));
      guardar();
    }
    const secoes: Secao[] =
      objeto.tipo === "noticias"
        ? (objeto.noticias ?? []).map((id) => {
            const noticia = CONTEUDO.noticias.find((n) => n.id === id)!;
            return { data: dataPorExtenso(noticia.data), titulo: t(noticia.titulo), texto: t(noticia.texto) };
          })
        : [{ texto: t(objeto.texto!) }];
    folhaDePapel(this, t(objeto.cabecalho), secoes, t("comum.fechar"), () => {
      this.aberto = false;
    });
  }

  private sair(): void {
    if (this.aberto) return;
    trocarDeCena(this, "Local", undefined, 600);
  }

  /** A ilustração do quarto (public/arte/quarto.svg) e a poeira no cone de luz da luminária. */
  private desenharQuarto(): void {
    this.add.image(LARGURA / 2, ALTURA / 2, chaveDaArte("quarto"));
    // poeira: pontinhos que sobem e descem devagar dentro da luz
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(860, 1160);
      const y = Phaser.Math.Between(390, 470);
      const grao = this.add.circle(x, y, Phaser.Math.FloatBetween(0.8, 1.8), 0xffe8b0, Phaser.Math.FloatBetween(0.25, 0.6));
      this.tweens.add({
        targets: grao,
        x: x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(-24, 10),
        alpha: { from: grao.alpha, to: 0.08 },
        duration: Phaser.Math.Between(3500, 7000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: Phaser.Math.Between(0, 2500),
      });
    }
  }
}
