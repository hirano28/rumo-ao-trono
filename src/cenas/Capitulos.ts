// A tela de capítulos: o capítulo seguinte a um vencido fica liberado, os
// concluídos podem ser jogados de novo, e os futuros ficam trancados até o
// anterior ser vencido.

import Phaser from "phaser";
import { CONTEUDO, definirProgresso } from "../estado";
import { idiomaAtual, t } from "../i18n/textos";
import type { Modo } from "../logica/forca";
import { capitulosLiberados, carregar, comecarCapitulo } from "../logica/progresso";
import { botao } from "../ui/componentes";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";
import { trocarDeCena } from "../ui/transicao";

export class Capitulos extends Phaser.Scene {
  private modo: Modo = "carreira";

  constructor() {
    super("Capitulos");
  }

  init(dados: { modo?: Modo }): void {
    this.modo = dados.modo ?? "carreira";
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COR.noite);
    const salvo = carregar();
    this.add
      .text(LARGURA / 2, 70, t("capitulos.titulo"), { fontFamily: FONTE.titulo, fontSize: "52px", fontStyle: "800", color: css(COR.papel) })
      .setOrigin(0.5);

    const liberados = capitulosLiberados(
      CONTEUDO.epoca.capitulos.map((c) => c.id),
      salvo,
    );
    CONTEUDO.epoca.capitulos.forEach((capitulo, i) => {
      const y = 190 + i * 140;
      const concluido = salvo?.concluidos.includes(capitulo.id) ?? false;
      const emAndamento = !concluido && salvo?.capitulo === capitulo.id;
      const trancado = !liberados.has(capitulo.id);
      this.add
        .rectangle(LARGURA / 2, y, 920, 116, trancado ? COR.parede : COR.papel, 0.96)
        .setStrokeStyle(2, concluido ? COR.dourado : COR.sepia);
      this.add.text(LARGURA / 2 - 430, y - 36, t(capitulo.titulo), {
        fontFamily: FONTE.titulo,
        fontSize: "26px",
        fontStyle: "600",
        color: css(trancado ? COR.papelSombra : COR.tinta),
        wordWrap: { width: 600 },
      });
      const estado = trancado
        ? "capitulos.trancado"
        : concluido
          ? "capitulos.concluido"
          : emAndamento
            ? "capitulos.em_andamento"
            : "capitulos.nao_jogado";
      this.add.text(LARGURA / 2 - 430, y + 16, `${concluido ? "✓ " : ""}${t(estado)}`, {
        fontFamily: FONTE.maquina,
        fontSize: "17px",
        color: css(trancado ? COR.papel : concluido ? COR.oliva : COR.sepia),
      });
      if (trancado) return;
      const rotulo = concluido ? "capitulos.jogar_de_novo" : emAndamento ? "capitulos.continuar" : "capitulos.jogar";
      botao(
        this,
        LARGURA / 2 + 330,
        y,
        t(rotulo),
        () => {
          if (emAndamento && salvo) {
            definirProgresso({ ...salvo, idioma: idiomaAtual() });
            trocarDeCena(this, "Local");
            return;
          }
          if (!capitulosLiberados(CONTEUDO.epoca.capitulos.map((c) => c.id), carregar()).has(capitulo.id)) return;
          definirProgresso(comecarCapitulo(salvo, capitulo.id, idiomaAtual(), salvo?.modo ?? this.modo));
          trocarDeCena(this, "Abertura", undefined, 700);
        },
        { largura: 200, altura: 50, tamanho: 18, claro: !concluido && !emAndamento },
      );
    });

    this.add
      .text(LARGURA / 2, ALTURA - 110, t("capitulos.aviso"), {
        fontFamily: FONTE.corpo,
        fontSize: "16px",
        fontStyle: "italic",
        color: css(COR.papelSombra),
        align: "center",
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5);
    botao(this, 130, ALTURA - 50, t("capitulos.voltar"), () => this.scene.start("Titulo"), { largura: 180, altura: 44, tamanho: 17, claro: true });
  }
}
