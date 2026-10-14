// O quarto: janela para os telhados de Riga, a escrivaninha com a luminária,
// e os objetos que trazem a época (jornal, revista, livro, tabuleiro).

import Phaser from "phaser";
import { CONTEUDO, capituloAtual, guardar, progresso } from "../estado";
import { dataPorExtenso, t } from "../i18n/textos";
import type { ObjetoDoQuarto } from "../logica/conteudo";
import { clicavel } from "../ui/clicavel";
import { folhaDePapel, type Secao } from "../ui/componentes";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";
import { trocarDeCena } from "../ui/transicao";

/** Onde cada objeto fica desenhado no quarto. */
const LUGAR: Record<string, { x: number; y: number; l: number; a: number }> = {
  jornal: { x: 760, y: 448, l: 150, a: 34 },
  revista: { x: 930, y: 446, l: 120, a: 30 },
  livro: { x: 1010, y: 238, l: 200, a: 74 },
  tabuleiro: { x: 640, y: 432, l: 120, a: 56 },
};

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
    for (const objeto of capitulo.quarto.objetos) {
      const lugar = LUGAR[objeto.id];
      if (!lugar) continue;
      clicavel(this, lugar.x, lugar.y, lugar.l, lugar.a, t(objeto.rotulo), () => this.abrir(objeto), {
        visto: progresso().vistos.includes(objeto.id),
      });
    }
    clicavel(this, 110, 430, 150, 300, t(capitulo.quarto.saida), () => this.sair(), { rotuloEmCima: true, visto: true });

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
    if (!vistos.includes(objeto.id)) {
      vistos.push(objeto.id);
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
    trocarDeCena(this, "Praca", undefined, 600);
  }

  private desenharQuarto(): void {
    const g = this.add.graphics();
    // parede com papel listrado
    g.fillStyle(COR.parede).fillRect(0, 0, LARGURA, ALTURA);
    g.fillStyle(0x433829);
    for (let x = 0; x < LARGURA; x += 48) g.fillRect(x, 0, 18, 540);
    // rodapé e assoalho
    g.fillStyle(COR.madeiraEscura).fillRect(0, 540, LARGURA, 180);
    g.fillStyle(0x3d2918);
    for (let y = 560; y < ALTURA; y += 34) g.fillRect(0, y, LARGURA, 2);
    g.fillStyle(0x2a1d12).fillRect(0, 530, LARGURA, 14);

    // janela: céu de outono à noite e os telhados da cidade velha
    g.fillStyle(0x1c2433).fillRect(330, 70, 300, 290);
    g.fillStyle(0xf3ead2).fillCircle(570, 120, 20);
    g.fillStyle(0x1c2433).fillCircle(578, 114, 18);
    g.fillStyle(0x0f141c);
    g.fillRect(330, 290, 300, 70);
    g.fillTriangle(350, 290, 390, 240, 430, 290);
    g.fillRect(455, 200, 26, 90);
    g.fillTriangle(450, 200, 468, 110, 486, 200); // torre de igreja
    g.fillTriangle(500, 290, 545, 250, 590, 290);
    g.fillStyle(0xffd27a, 0.8);
    g.fillRect(368, 300, 8, 10).fillRect(520, 300, 8, 10).fillRect(560, 318, 8, 10);
    g.lineStyle(10, COR.madeira).strokeRect(330, 70, 300, 290);
    g.lineStyle(6, COR.madeira).lineBetween(480, 70, 480, 360).lineBetween(330, 215, 630, 215);
    g.fillStyle(COR.madeira).fillRect(316, 360, 328, 14);

    // porta
    g.fillStyle(0x50382a).fillRect(35, 280, 150, 260);
    g.lineStyle(4, 0x3a281c).strokeRect(50, 300, 120, 100).strokeRect(50, 420, 120, 100);
    g.fillStyle(COR.dourado).fillCircle(165, 420, 7);

    // estante com livros
    g.fillStyle(COR.madeiraEscura).fillRect(880, 276, 260, 12);
    const lombadas = [0x6b2f25, 0x2f4a3a, 0x7d6a3e, 0x3b3f5c, 0x5b3a2a, 0x6f5d3a, 0x2c3a30, 0x7a3d2c];
    let x = 900;
    lombadas.forEach((cor, i) => {
      const l = 18 + (i % 3) * 6;
      const a = 58 + (i % 4) * 6;
      g.fillStyle(cor).fillRect(x, 276 - a, l, a);
      g.fillStyle(COR.dourado, 0.6).fillRect(x + 3, 276 - a + 10, l - 6, 3);
      x += l + 3;
    });

    // escrivaninha
    g.fillStyle(COR.madeira).fillRect(540, 465, 620, 22);
    g.fillStyle(COR.madeiraEscura).fillRect(560, 487, 24, 120).fillRect(1116, 487, 24, 120).fillRect(560, 487, 580, 40);

    // luz da luminária: um cone em camadas
    for (let i = 0; i < 6; i++) {
      g.fillStyle(COR.luz, 0.05);
      g.fillTriangle(1090, 360, 700 - i * 22, 466, 1150 + i * 4, 466);
    }
    // luminária
    g.fillStyle(0x2d3a2a).fillRect(1070, 450, 60, 14);
    g.lineStyle(6, 0x2d3a2a).lineBetween(1100, 450, 1080, 380);
    g.fillStyle(0x3f5a3a).fillTriangle(1040, 380, 1120, 380, 1080, 340);
    g.fillStyle(COR.luz).fillEllipse(1080, 382, 70, 8);

    // jornal dobrado
    g.fillStyle(COR.papel).fillRect(686, 434, 148, 30);
    g.fillStyle(COR.tinta, 0.7).fillRect(694, 440, 70, 4).fillRect(694, 449, 130, 2).fillRect(694, 455, 110, 2);
    // revista
    g.fillStyle(0xe7dcc0).fillRect(872, 434, 116, 28);
    g.fillStyle(COR.vermelho).fillRect(872, 434, 116, 9);
    // tabuleiro com algumas peças
    for (let l = 0; l < 2; l++) {
      for (let c = 0; c < 8; c++) {
        g.fillStyle((l + c) % 2 === 0 ? COR.casaClara : COR.casaEscura).fillRect(582 + c * 14, 444 + l * 10, 14, 10);
      }
    }
    for (const [peca, px] of [["wk", 600], ["bq", 640], ["wn", 672]] as const) {
      this.add.image(px, 430, peca).setDisplaySize(30, 30);
    }

    // vinheta
    const v = this.add.graphics();
    for (let i = 0; i < 10; i++) {
      v.lineStyle(40, 0x000000, 0.05).strokeRect(-20 + i * 4, -20 + i * 4, LARGURA + 40 - i * 8, ALTURA + 40 - i * 8);
    }
  }
}
