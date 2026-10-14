// O fim do desafio: a força calculada, a categoria, e o que vem depois.

import Phaser from "phaser";
import { CONTEUDO, capituloAtual, definirProgresso, progresso } from "../estado";
import { t } from "../i18n/textos";
import { pontosDoDesafio } from "../logica/conteudo";
import { categoriaDa, forcaNoTabuleiro, performance, type ResultadoPartida } from "../logica/forca";
import { botao } from "../ui/componentes";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";
import { trocarDeCena } from "../ui/transicao";
import { formatarPontos } from "./Praca";

export class Resultado extends Phaser.Scene {
  constructor() {
    super("Resultado");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COR.noite);
    this.cameras.main.fadeIn(800, 0, 0, 0);
    const atual = progresso();
    const capitulo = capituloAtual();
    const { adversarios, pontosMinimos } = capitulo.desafio;
    const pontos = pontosDoDesafio(atual.resultados, adversarios);
    const aprovado = pontos >= pontosMinimos;

    // Desafio já concluído (o jogador voltou pelo "Continuar"): mostra o que ficou.
    const jaConcluido = atual.concluidos.includes(capitulo.id);
    const partidas: ResultadoPartida[] = adversarios.map((id) => ({
      forcaAdversario: atual.forcas[id] ?? forcaNoTabuleiro(atual.modo, CONTEUDO.adversarios[id], atual.forca),
      pontos: atual.resultados[id] ?? 0,
    }));
    const forca = jaConcluido && atual.forca !== undefined ? atual.forca : performance(partidas, atual.forca);
    const categoria = categoriaDa(forca);

    this.add
      .text(LARGURA / 2, 110, t(capitulo.titulo), {
        fontFamily: FONTE.maquina,
        fontSize: "22px",
        color: css(COR.dourado),
      })
      .setOrigin(0.5);
    this.add
      .text(LARGURA / 2, 180, t("resultado.placar", { pontos: formatarPontos(pontos), total: adversarios.length }), {
        fontFamily: FONTE.titulo,
        fontSize: "52px",
        fontStyle: "800",
        color: css(COR.papel),
      })
      .setOrigin(0.5);
    this.add
      .text(LARGURA / 2, 300, t(aprovado ? capitulo.fechamento.aprovado : capitulo.fechamento.reprovado), {
        fontFamily: FONTE.corpo,
        fontSize: "21px",
        color: css(COR.papel),
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: 860 },
      })
      .setOrigin(0.5, 0);

    if (aprovado) {
      this.add
        .text(LARGURA / 2, 470, t("resultado.categoria", { categoria: t(`categoria.${categoria}`) }), {
          fontFamily: FONTE.titulo,
          fontSize: "28px",
          fontStyle: "600",
          color: css(COR.dourado),
        })
        .setOrigin(0.5);
      this.add
        .text(LARGURA / 2, 515, t("resultado.forca", { forca }), {
          fontFamily: FONTE.corpo,
          fontSize: "16px",
          fontStyle: "italic",
          color: css(COR.sepia),
        })
        .setOrigin(0.5);
      this.add
        .text(LARGURA / 2, 575, t(capitulo.fechamento.proximo), {
          fontFamily: FONTE.maquina,
          fontSize: "20px",
          color: css(COR.papelSombra),
        })
        .setOrigin(0.5);
      if (!jaConcluido) definirProgresso({ ...atual, forca, concluidos: [...atual.concluidos, capitulo.id] });
      botao(this, LARGURA / 2, ALTURA - 60, t("resultado.voltar_ao_titulo"), () => this.scene.start("Titulo"));
    } else {
      botao(this, LARGURA / 2, ALTURA - 120, t("resultado.tentar_de_novo"), () => {
        definirProgresso({ ...atual, resultados: {}, forcas: {} });
        trocarDeCena(this, "Praca");
      });
    }
  }
}
