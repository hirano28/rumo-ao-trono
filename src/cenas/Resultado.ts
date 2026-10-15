// O fim do desafio: a força calculada, a categoria, a classificação final
// (no torneio) e a passagem para o próximo capítulo.

import Phaser from "phaser";
import {
  capituloAtual,
  definirProgresso,
  forcasDoDesafio,
  jogosDoTorneio,
  partidasDoDesafio,
  pontosDoJogador,
  progresso,
  proximoCapitulo,
  torneioAtual,
} from "../estado";
import { t } from "../i18n/textos";
import { categoriaDa, performance, type ResultadoPartida } from "../logica/forca";
import { novaSemente, semResumosDeRodada } from "../logica/progresso";
import { registrar } from "../servidor/sincronia";
import { VOCE, classificacao } from "../logica/torneio";
import { botao } from "../ui/componentes";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";
import { trocarDeCena } from "../ui/transicao";
import { formatarPontos, tabelaEmTexto } from "./Local";

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
    const torneio = torneioAtual();
    const pontos = pontosDoJogador();
    const aprovado = pontos >= pontosMinimos;

    // Desafio já concluído (o jogador voltou pelo "Continuar"): mostra o que ficou.
    const jaConcluido = atual.concluidos.includes(capitulo.id);
    const forcas = forcasDoDesafio();
    const partidas: ResultadoPartida[] = adversarios.map((id) => ({ forcaAdversario: forcas[id], pontos: atual.resultados[id] ?? 0 }));
    const forca = jaConcluido && atual.forca !== undefined ? atual.forca : performance(partidas, atual.forca);
    // a tabela final não pode mudar quando a força do jogador mudar: as forças do torneio ficam gravadas
    for (const [id, valor] of Object.entries(forcas)) atual.forcas[id] ??= valor;
    const categoria = categoriaDa(forca);

    // no torneio, o texto fica à esquerda e a tabela final à direita
    const centro = torneio ? 400 : LARGURA / 2;
    const larguraDoTexto = torneio ? 640 : 860;

    this.add.text(centro, 90, t(capitulo.titulo), { fontFamily: FONTE.maquina, fontSize: "22px", color: css(COR.dourado) }).setOrigin(0.5);
    this.add
      .text(centro, 150, t("resultado.placar", { pontos: formatarPontos(pontos), total: partidasDoDesafio() }), {
        fontFamily: FONTE.titulo,
        fontSize: "52px",
        fontStyle: "800",
        color: css(COR.papel),
      })
      .setOrigin(0.5);

    let y = 210;
    let campeao = false;
    if (torneio) {
      const tabela = classificacao([VOCE, ...torneio.ordem], jogosDoTorneio(torneio.rodadas.length));
      const meus = tabela.find((l) => l.id === VOCE)!.pontos;
      const posicao = tabela.filter((l) => l.pontos > meus).length + 1;
      const dividida = tabela.filter((l) => l.pontos === meus).length > 1;
      // primeiro lugar dividido não é título: em 1953, empate no topo ia para desempate
      campeao = posicao === 1 && !dividida;
      this.add
        .text(centro, y, t(dividida ? "resultado.posicao_dividida" : "resultado.posicao", { posicao, total: tabela.length }), {
          fontFamily: FONTE.corpo,
          fontSize: "22px",
          fontStyle: "italic",
          color: css(COR.papelSombra),
        })
        .setOrigin(0.5);
      y += 40;
      this.add.rectangle(1010, 330, 470, 400, COR.papel, 0.97).setStrokeStyle(2, COR.sepia);
      this.add.text(1010, 160, t(torneio.titulo), { fontFamily: FONTE.titulo, fontSize: "24px", fontStyle: "800", color: css(COR.tinta) }).setOrigin(0.5);
      const grande = tabela.length > 12;
      this.add
        .text(grande ? 790 : 800, grande ? 190 : 200, tabelaEmTexto(tabela), {
          fontFamily: FONTE.colunas,
          fontSize: grande ? "13px" : "18px",
          color: css(COR.tinta),
          lineSpacing: grande ? 2 : 10,
        })
        .setOrigin(0, 0);
    }

    const narrativa = this.add
      .text(centro, y + 20, t(fechamento(capitulo.fechamento, aprovado, campeao)), {
        fontFamily: FONTE.corpo,
        fontSize: "20px",
        color: css(COR.papel),
        align: "center",
        lineSpacing: 7,
        wordWrap: { width: larguraDoTexto },
      })
      .setOrigin(0.5, 0);
    // texto longo (torneio, coluna estreita): letra menor, para a categoria caber acima do botão
    if (narrativa.y + narrativa.height > ALTURA - 260) narrativa.setFontSize(17).setLineSpacing(4);
    y = narrativa.y + narrativa.height + 30;

    if (!aprovado) {
      botao(
        this,
        centro,
        ALTURA - 100,
        t(capitulo.fechamento.tentar ?? "resultado.tentar_de_novo"),
        () => {
          registrar("desafios", { capitulo: capitulo.id, pontos, aprovado: false, forca, categoria });
          definirProgresso({
            ...atual,
            resultados: {},
            forcas: {},
            semente: novaSemente(),
            adiada: undefined,
            vistos: semResumosDeRodada(atual.vistos, capitulo.id),
          });
          trocarDeCena(this, "Local");
        },
        { largura: 420 },
      );
      return;
    }

    this.add
      .text(centro, y, t("resultado.categoria", { categoria: t(`categoria.${categoria}`) }), {
        fontFamily: FONTE.titulo,
        fontSize: "28px",
        fontStyle: "600",
        color: css(COR.dourado),
      })
      .setOrigin(0.5);
    this.add
      .text(centro, y + 40, t("resultado.forca", { forca }), {
        fontFamily: FONTE.corpo,
        fontSize: "15px",
        fontStyle: "italic",
        color: css(COR.sepia),
        align: "center",
        wordWrap: { width: larguraDoTexto },
      })
      .setOrigin(0.5);
    if (!jaConcluido) {
      registrar("desafios", { capitulo: capitulo.id, pontos, aprovado: true, forca, categoria });
      definirProgresso({ ...atual, forca, concluidos: [...atual.concluidos, capitulo.id] });
    }

    const proximo = proximoCapitulo();
    if (proximo) {
      botao(
        this,
        centro,
        ALTURA - 70,
        t("resultado.seguir", { capitulo: t(proximo.titulo) }),
        () => {
          definirProgresso({
            ...progresso(),
            capitulo: proximo.id,
            resultados: {},
            forcas: {},
            semente: novaSemente(),
            adiada: undefined,
            vistos: semResumosDeRodada(progresso().vistos, proximo.id),
          });
          trocarDeCena(this, "Abertura", undefined, 800);
        },
        { largura: 560, tamanho: 19 },
      );
    } else {
      this.add
        .text(centro, ALTURA - 130, t(capitulo.fechamento.proximo), { fontFamily: FONTE.maquina, fontSize: "20px", color: css(COR.papelSombra) })
        .setOrigin(0.5);
      botao(this, centro, ALTURA - 60, t("resultado.voltar_ao_titulo"), () => this.scene.start("Titulo"));
    }
  }
}

/** O texto do fim: de campeão (se houver um para o capítulo), de aprovado ou de reprovado. */
function fechamento(textos: { aprovado: string; reprovado: string; campeao?: string }, aprovado: boolean, campeao: boolean): string {
  if (!aprovado) return textos.reprovado;
  return campeao && textos.campeao ? textos.campeao : textos.aprovado;
}
