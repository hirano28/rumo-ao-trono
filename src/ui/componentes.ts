// Pedaços de tela reaproveitados pelas cenas: botão, folha de papel e caixa
// de diálogo.

import Phaser from "phaser";
import { ALTURA, COR, FONTE, LARGURA, css } from "./estilo";

export interface OpcoesDeBotao {
  largura?: number;
  altura?: number;
  tamanho?: number;
  claro?: boolean;
}

export function botao(
  cena: Phaser.Scene,
  x: number,
  y: number,
  texto: string,
  aoClicar: () => void,
  { largura = 260, altura = 52, tamanho = 22, claro = false }: OpcoesDeBotao = {},
): Phaser.GameObjects.Container {
  const fundo = cena.add
    .rectangle(0, 0, largura, altura, claro ? COR.papel : COR.oliva)
    .setStrokeStyle(2, claro ? COR.sepia : COR.dourado);
  const rotulo = cena.add
    .text(0, 0, texto, {
      fontFamily: FONTE.corpo,
      fontSize: `${tamanho}px`,
      color: css(claro ? COR.tinta : COR.papel),
      fontStyle: "600",
      align: "center",
      wordWrap: { width: largura - 20 },
    })
    .setOrigin(0.5);
  const caixa = cena.add.container(x, y, [fundo, rotulo]).setSize(largura, altura);
  caixa.setInteractive({ useHandCursor: true });
  caixa.on("pointerover", () => fundo.setFillStyle(claro ? COR.papelSombra : COR.olivaClara));
  caixa.on("pointerout", () => fundo.setFillStyle(claro ? COR.papel : COR.oliva));
  caixa.on("pointerup", aoClicar);
  return caixa;
}

/** Camada das sobreposições (folha, diálogo, avisos): acima de tudo da cena. */
export const CAMADA_SOBRE = 100;

/** Véu escuro que cobre a cena e engole os cliques de baixo. */
export function veu(cena: Phaser.Scene, alfa = 0.6): Phaser.GameObjects.Rectangle {
  return cena.add
    .rectangle(LARGURA / 2, ALTURA / 2, LARGURA, ALTURA, COR.noite, alfa)
    .setInteractive()
    .setDepth(CAMADA_SOBRE);
}

/** Põe os objetos de uma sobreposição na camada de cima, na ordem em que foram criados. */
function sobrepor(objetos: readonly Phaser.GameObjects.GameObject[]): void {
  objetos.forEach((objeto, i) => (objeto as unknown as Phaser.GameObjects.Components.Depth).setDepth(CAMADA_SOBRE + 1 + i));
}

export interface Secao {
  titulo?: string;
  data?: string;
  texto: string;
  /** Texto em colunas (tabela de torneio): fonte de máquina de escrever. */
  monoespacada?: boolean;
}

/**
 * Uma folha de papel (jornal, revista, livro) com cabeçalho e seções.
 * Devolve a função que fecha a folha.
 */
export function folhaDePapel(
  cena: Phaser.Scene,
  cabecalho: string,
  secoes: readonly Secao[],
  rotuloFechar: string,
  aoFechar: () => void,
): () => void {
  const largura = 820;
  const altura = 600;
  const x0 = (LARGURA - largura) / 2;
  const y0 = (ALTURA - altura) / 2;
  const objetos: Phaser.GameObjects.GameObject[] = [];

  objetos.push(veu(cena, 0.7));
  objetos.push(cena.add.rectangle(LARGURA / 2 + 8, ALTURA / 2 + 10, largura, altura, 0x000000, 0.35));
  objetos.push(cena.add.rectangle(LARGURA / 2, ALTURA / 2, largura, altura, COR.papel).setStrokeStyle(1, COR.papelSombra));
  objetos.push(
    cena.add
      .text(LARGURA / 2, y0 + 44, cabecalho, {
        fontFamily: FONTE.titulo,
        fontSize: "34px",
        fontStyle: "800",
        color: css(COR.tinta),
        align: "center",
        wordWrap: { width: largura - 80 },
      })
      .setOrigin(0.5),
  );
  objetos.push(cena.add.rectangle(LARGURA / 2, y0 + 78, largura - 80, 3, COR.tinta));
  objetos.push(cena.add.rectangle(LARGURA / 2, y0 + 85, largura - 80, 1, COR.tinta));

  let y = y0 + 106;
  for (const secao of secoes) {
    if (secao.data) {
      objetos.push(
        cena.add.text(x0 + 40, y, secao.data.toUpperCase(), {
          fontFamily: FONTE.maquina,
          fontSize: "15px",
          color: css(COR.sepia),
        }),
      );
      y += 22;
    }
    if (secao.titulo) {
      const titulo = cena.add.text(x0 + 40, y, secao.titulo, {
        fontFamily: FONTE.titulo,
        fontSize: "23px",
        fontStyle: "600",
        color: css(COR.tinta),
        wordWrap: { width: largura - 80 },
      });
      objetos.push(titulo);
      y += titulo.height + 6;
    }
    const corpo = cena.add.text(x0 + 40, y, secao.texto, {
      fontFamily: secao.monoespacada ? FONTE.colunas : FONTE.corpo,
      fontSize: secao.monoespacada ? "19px" : "18px",
      color: css(COR.tinta),
      lineSpacing: 5,
      wordWrap: { width: largura - 80 },
    });
    objetos.push(corpo);
    y += corpo.height + 22;
  }

  const fechar = (): void => {
    for (const objeto of objetos) objeto.destroy();
    aoFechar();
  };
  objetos.push(botao(cena, LARGURA / 2, y0 + altura - 40, rotuloFechar, fechar, { largura: 200, altura: 44, tamanho: 18 }));
  sobrepor(objetos);
  return fechar;
}

export interface EscolhaDeDialogo {
  texto: string;
  aoEscolher: () => void;
}

/** Caixa de diálogo no rodapé: quem fala, a fala e as respostas possíveis. */
export function caixaDeDialogo(
  cena: Phaser.Scene,
  quem: string,
  fala: string,
  escolhas: readonly EscolhaDeDialogo[],
): () => void {
  const objetos: Phaser.GameObjects.GameObject[] = [];
  const altura = 250;
  const y0 = ALTURA - altura - 16;
  objetos.push(veu(cena, 0.25));
  objetos.push(
    cena.add.rectangle(LARGURA / 2, y0 + altura / 2, LARGURA - 64, altura, COR.papel, 0.97).setStrokeStyle(2, COR.sepia),
  );
  objetos.push(
    cena.add.text(64, y0 + 18, quem, {
      fontFamily: FONTE.titulo,
      fontSize: "24px",
      fontStyle: "600",
      color: css(COR.vermelho),
    }),
  );
  objetos.push(
    cena.add.text(64, y0 + 56, fala, {
      fontFamily: FONTE.corpo,
      fontSize: "20px",
      color: css(COR.tinta),
      lineSpacing: 6,
      wordWrap: { width: LARGURA - 140 },
    }),
  );
  const fechar = (): void => {
    for (const objeto of objetos) objeto.destroy();
  };
  const larguraBotao = Math.min(360, (LARGURA - 160) / escolhas.length - 16);
  escolhas.forEach((escolha, i) => {
    const x = LARGURA / 2 + (i - (escolhas.length - 1) / 2) * (larguraBotao + 16);
    objetos.push(
      botao(
        cena,
        x,
        y0 + altura - 42,
        escolha.texto,
        () => {
          fechar();
          escolha.aoEscolher();
        },
        { largura: larguraBotao, altura: 50, tamanho: 17, claro: i > 0 },
      ),
    );
  });
  sobrepor(objetos);
  return fechar;
}
