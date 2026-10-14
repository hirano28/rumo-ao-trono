// O relógio mecânico na mesa: caixa de madeira, dois mostradores com
// ponteiros (a bandeira cai às 6:00), o botão de cima afundado do lado de
// quem acabou de jogar, e o tempo por extenso embaixo para quem não lê
// ponteiro.

import Phaser from "phaser";
import { ponteiros, tempoPorExtenso } from "../logica/relogio";
import { COR, FONTE, css } from "./estilo";

const RAIO = 44;

export class RelogioDeXadrez {
  private readonly ponteirosGraficos: Phaser.GameObjects.Graphics;
  private readonly botoes: Phaser.GameObjects.Graphics;
  private readonly tempos: [Phaser.GameObjects.Text, Phaser.GameObjects.Text];
  private readonly centros: [number, number];

  constructor(
    cena: Phaser.Scene,
    x: number,
    private readonly y: number,
    rotulos: [string, string],
  ) {
    const g = cena.add.graphics();
    g.fillStyle(0x000000, 0.3).fillRoundedRect(x - 128, y - 56, 264, 122, 10);
    g.fillStyle(COR.madeira).fillRoundedRect(x - 132, y - 62, 264, 122, 10);
    g.fillStyle(COR.madeiraEscura).fillRoundedRect(x - 132, y + 40, 264, 20, { tl: 0, tr: 0, bl: 10, br: 10 });
    this.centros = [x - 62, x + 62];
    for (const cx of this.centros) {
      g.fillStyle(0xf4ecd8).fillCircle(cx, y, RAIO);
      g.lineStyle(3, COR.madeiraEscura).strokeCircle(cx, y, RAIO);
      for (let h = 0; h < 12; h++) {
        const a = (h / 12) * Math.PI * 2;
        const dentro = h % 3 === 0 ? RAIO - 9 : RAIO - 5;
        g.lineStyle(h % 3 === 0 ? 2.5 : 1.2, COR.tinta).lineBetween(
          cx + Math.sin(a) * dentro,
          y - Math.cos(a) * dentro,
          cx + Math.sin(a) * (RAIO - 2),
          y - Math.cos(a) * (RAIO - 2),
        );
      }
      // a bandeirinha vermelha perto do 12
      g.fillStyle(COR.vermelho).fillTriangle(cx + 4, y - RAIO + 6, cx + 14, y - RAIO + 10, cx + 4, y - RAIO + 14);
    }
    this.botoes = cena.add.graphics();
    this.ponteirosGraficos = cena.add.graphics();
    const estiloRotulo = { fontFamily: FONTE.corpo, fontSize: "15px", fontStyle: "600", color: css(COR.tinta), align: "center" };
    const estiloTempo = { fontFamily: FONTE.maquina, fontSize: "16px", color: css(COR.tinta) };
    rotulos.forEach((rotulo, i) => cena.add.text(this.centros[i], y + 74, rotulo, estiloRotulo).setOrigin(0.5));
    this.tempos = [
      cena.add.text(this.centros[0], y + 96, "", estiloTempo).setOrigin(0.5),
      cena.add.text(this.centros[1], y + 96, "", estiloTempo).setOrigin(0.5),
    ];
  }

  /** Minutos da história de cada mostrador e qual dos dois está andando. */
  atualizar(minutos: [number, number], andando: 0 | 1 | undefined): void {
    const g = this.ponteirosGraficos.clear();
    minutos.forEach((m, i) => {
      const cx = this.centros[i];
      const { horas, minutos: mins } = ponteiros(m);
      const ponteiro = (graus: number, comprimento: number, espessura: number) => {
        const a = (graus * Math.PI) / 180;
        g.lineStyle(espessura, COR.tinta).lineBetween(cx, this.y, cx + Math.sin(a) * comprimento, this.y - Math.cos(a) * comprimento);
      };
      ponteiro(horas, RAIO * 0.5, 4);
      ponteiro(mins, RAIO * 0.8, 2.5);
      g.fillStyle(COR.tinta).fillCircle(cx, this.y, 3.5);
      this.tempos[i].setText(tempoPorExtenso(m)).setColor(css(m < 10 ? COR.vermelho : COR.tinta));
    });
    // o botão do lado parado fica afundado (quem jogou apertou o seu)
    const b = this.botoes.clear();
    this.centros.forEach((cx, i) => {
      const afundado = andando !== undefined && andando !== i;
      b.fillStyle(0x2b2118).fillRoundedRect(cx - 14, this.y - 62 - (afundado ? 4 : 12), 28, afundado ? 6 : 14, 3);
    });
  }
}
