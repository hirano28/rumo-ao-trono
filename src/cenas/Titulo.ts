import Phaser from "phaser";
import { CONTEUDO, definirProgresso } from "../estado";
import { IDIOMAS, definirIdioma, idiomaAtual, t, type Idioma } from "../i18n/textos";
import type { Modo } from "../logica/forca";
import { carregar, novoProgresso } from "../logica/progresso";
import { botao } from "../ui/componentes";
import { carregarPecas } from "../ui/tabuleiro";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";

export class Titulo extends Phaser.Scene {
  private modo: Modo = "carreira";

  constructor() {
    super("Titulo");
  }

  preload(): void {
    carregarPecas(this, 128);
  }

  create(): void {
    const salvo = carregar();
    if (salvo) definirIdioma(salvo.idioma);
    this.desenhar(salvo !== undefined);
  }

  private desenhar(temSalvo: boolean): void {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor(COR.noite);

    // um tabuleiro gigante, quase apagado, ao fundo
    const casa = 120;
    for (let l = 0; l < 7; l++) {
      for (let c = 0; c < 12; c++) {
        if ((l + c) % 2 === 0) this.add.rectangle(c * casa + casa / 2 - 40, l * casa + casa / 2 - 60, casa, casa, COR.parede, 0.35);
      }
    }
    this.add.rectangle(LARGURA / 2, ALTURA / 2, LARGURA, ALTURA, COR.noite, 0.55);

    this.add
      .text(LARGURA / 2, 170, t("titulo.nome"), {
        fontFamily: FONTE.titulo,
        fontSize: "84px",
        fontStyle: "800",
        color: css(COR.papel),
      })
      .setOrigin(0.5);
    this.add
      .text(LARGURA / 2, 250, t(CONTEUDO.epoca.subtitulo), {
        fontFamily: FONTE.maquina,
        fontSize: "24px",
        color: css(COR.dourado),
      })
      .setOrigin(0.5);

    let y = 360;
    if (temSalvo) {
      botao(this, LARGURA / 2, y, t("titulo.continuar"), () => this.continuar());
      y += 70;
    }
    botao(this, LARGURA / 2, y, t("titulo.novo_jogo"), () => this.novoJogo(), { claro: temSalvo });
    y += 86;

    const modos: Modo[] = ["carreira", "realista"];
    modos.forEach((modo, i) => {
      const escolhido = modo === this.modo;
      botao(
        this,
        LARGURA / 2 + (i - 0.5) * 230,
        y,
        `${escolhido ? "● " : ""}${t(`titulo.modo_${modo}`)}`,
        () => {
          this.modo = modo;
          this.desenhar(temSalvo);
        },
        { largura: 210, altura: 44, tamanho: 17, claro: !escolhido },
      );
    });
    this.add
      .text(LARGURA / 2, y + 42, t(`titulo.modo_${this.modo}_explicacao`), {
        fontFamily: FONTE.corpo,
        fontSize: "16px",
        fontStyle: "italic",
        color: css(COR.papelSombra),
        align: "center",
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5, 0);

    IDIOMAS.forEach((idioma: Idioma, i) => {
      const escolhido = idioma === idiomaAtual();
      botao(
        this,
        LARGURA - 190 + i * 110,
        ALTURA - 44,
        idioma === "pt-BR" ? "Português" : "English",
        () => {
          definirIdioma(idioma);
          this.desenhar(temSalvo);
        },
        { largura: 104, altura: 36, tamanho: 15, claro: !escolhido },
      );
    });
  }

  private novoJogo(): void {
    const primeiro = CONTEUDO.epoca.capitulos[0];
    definirProgresso(novoProgresso(idiomaAtual(), this.modo, primeiro.id));
    this.scene.start("Abertura");
  }

  private continuar(): void {
    const salvo = carregar();
    // salvo de um capítulo que não existe mais (conteúdo mudou): começa de novo
    if (!salvo || !CONTEUDO.epoca.capitulos.some((c) => c.id === salvo.capitulo)) return this.novoJogo();
    definirProgresso({ ...salvo, idioma: idiomaAtual() });
    this.scene.start(salvo.concluidos.includes(salvo.capitulo) ? "Resultado" : "Praca");
  }
}
