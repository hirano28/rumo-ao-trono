// O texto de abertura do capítulo, página por página, como máquina de escrever.

import Phaser from "phaser";
import { capituloAtual } from "../estado";
import { t } from "../i18n/textos";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";
import { trocarDeCena } from "../ui/transicao";

const MS_POR_LETRA = 28;

export class Abertura extends Phaser.Scene {
  private pagina = 0;
  private texto!: Phaser.GameObjects.Text;
  private escrevendo?: Phaser.Time.TimerEvent;
  private completo = "";

  constructor() {
    super("Abertura");
  }

  create(): void {
    this.pagina = 0;
    this.cameras.main.setBackgroundColor(COR.noite);
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.texto = this.add
      .text(LARGURA / 2, ALTURA / 2, "", {
        fontFamily: FONTE.maquina,
        fontSize: "28px",
        color: css(COR.papel),
        align: "center",
        lineSpacing: 12,
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5);
    this.add
      .text(LARGURA / 2, ALTURA - 50, t("abertura.continuar"), {
        fontFamily: FONTE.corpo,
        fontSize: "16px",
        fontStyle: "italic",
        color: css(COR.sepia),
      })
      .setOrigin(0.5);
    const pular = this.add
      .text(LARGURA - 40, 36, t("abertura.pular"), { fontFamily: FONTE.corpo, fontSize: "17px", color: css(COR.sepia) })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    pular.on("pointerup", (_p: Phaser.Input.Pointer, _x: number, _y: number, evento: Phaser.Types.Input.EventData) => {
      evento.stopPropagation();
      this.terminar();
    });

    this.input.on("pointerup", () => this.avancar());
    this.input.keyboard?.on("keydown-SPACE", () => this.avancar());
    this.input.keyboard?.on("keydown-ENTER", () => this.avancar());
    this.escrever();
  }

  private escrever(): void {
    const paginas = capituloAtual().abertura;
    this.completo = t(paginas[this.pagina]);
    let letras = 0;
    this.texto.setText("");
    this.escrevendo = this.time.addEvent({
      delay: MS_POR_LETRA,
      repeat: this.completo.length - 1,
      callback: () => {
        letras++;
        this.texto.setText(this.completo.slice(0, letras));
      },
    });
  }

  private avancar(): void {
    if (this.pagina >= capituloAtual().abertura.length) return;
    if (this.escrevendo && this.escrevendo.getOverallProgress() < 1) {
      this.escrevendo.remove();
      this.escrevendo = undefined;
      this.texto.setText(this.completo);
      return;
    }
    this.pagina++;
    if (this.pagina >= capituloAtual().abertura.length) {
      this.terminar();
    } else {
      this.escrever();
    }
  }

  private terminar(): void {
    trocarDeCena(this, "Quarto", undefined, 600);
  }
}
