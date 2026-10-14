// Um ponto de interesse da cena: área invisível que, com o mouse em cima,
// ganha contorno dourado e um rótulo.

import Phaser from "phaser";
import { COR, FONTE, css } from "./estilo";

export function clicavel(
  cena: Phaser.Scene,
  x: number,
  y: number,
  largura: number,
  altura: number,
  rotulo: string,
  aoClicar: () => void,
  { rotuloEmCima = true, visto = false } = {},
): Phaser.GameObjects.Zone {
  const contorno = cena.add
    .rectangle(x, y, largura + 12, altura + 12)
    .setStrokeStyle(3, COR.dourado, 0.9)
    .setVisible(false)
    .setDepth(50);
  const etiqueta = cena.add
    .text(x, rotuloEmCima ? y - altura / 2 - 22 : y + altura / 2 + 22, rotulo, {
      fontFamily: FONTE.corpo,
      fontSize: "18px",
      fontStyle: "600",
      color: css(COR.papel),
      backgroundColor: css(COR.tinta),
      padding: { x: 10, y: 4 },
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(51);
  const marcaDeNovo = visto
    ? undefined
    : cena.add.circle(x + largura / 2 - 4, y - altura / 2 + 4, 7, COR.dourado).setDepth(49);
  const zona = cena.add.zone(x, y, largura, altura).setInteractive({ useHandCursor: true });
  zona.on("pointerover", () => {
    contorno.setVisible(true);
    etiqueta.setVisible(true);
  });
  zona.on("pointerout", () => {
    contorno.setVisible(false);
    etiqueta.setVisible(false);
  });
  zona.on("pointerup", () => {
    contorno.setVisible(false);
    etiqueta.setVisible(false);
    marcaDeNovo?.destroy();
    aoClicar();
  });
  return zona;
}
