// A noite da partida adiada: em casa, no tabuleiro do avô, a posição do
// envelope montada para analisar. A mão mexe as peças dos dois lados; ninguém
// proibia analisar em casa, e era o que todo mundo fazia. De manhã, de volta
// ao clube, o árbitro abre o envelope.

import Phaser from "phaser";
import type { Chess } from "chess.js";
import { CONTEUDO, capituloAtual, progresso } from "../estado";
import { t } from "../i18n/textos";
import { posicaoDaAdiada, posicaoParaAnalisar, rotuloDoLance } from "../logica/adiamento";
import { chaveDaArte } from "../ui/arte";
import { botao } from "../ui/componentes";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";
import { Tabuleiro, type LanceDoJogador } from "../ui/tabuleiro";
import { trocarDeCena } from "../ui/transicao";

const CASA = 70;

export class Adiamento extends Phaser.Scene {
  private analise!: Chess;
  private tabuleiro!: Tabuleiro;
  private lancesDoEnvelope = 0;
  private variante!: Phaser.GameObjects.Text;

  constructor() {
    super("Adiamento");
  }

  create(): void {
    const adiada = progresso().adiada;
    if (!adiada || !capituloAtual().desafio.adversarios.includes(adiada.adversario)) {
      // sem envelope (recarregou depois da retomada): volta ao lugar
      this.scene.start("Local");
      return;
    }
    this.cameras.main.fadeIn(900, 0, 0, 0);
    // o quarto, de noite: só a luminária acesa
    this.add.image(LARGURA / 2, ALTURA / 2, chaveDaArte("quarto"));
    this.add.rectangle(LARGURA / 2, ALTURA / 2, LARGURA, ALTURA, 0x05070d, 0.72);
    this.add.circle(1010, 420, 260, COR.luz, 0.07);

    const adversario = CONTEUDO.adversarios[adiada.adversario];
    const ladoDoJogador = adversario.corDoJogador === "brancas" ? "w" : "b";
    this.analise = posicaoParaAnalisar(adiada, ladoDoJogador);
    this.lancesDoEnvelope = this.analise.history().length;
    const origemY = (ALTURA - CASA * 8) / 2;
    this.tabuleiro = new Tabuleiro(this, 96, origemY, CASA, ladoDoJogador, this.analise, (lance) => this.mexer(lance), true);
    this.tabuleiro.liberar(true);

    const x0 = 740;
    this.add.rectangle(x0 + 250, ALTURA / 2, 500, ALTURA - 70, COR.papel, 0.96).setStrokeStyle(2, COR.sepia);
    this.add.text(x0 + 26, 58, t("adiamento.noite_titulo"), {
      fontFamily: FONTE.titulo,
      fontSize: "30px",
      fontStyle: "800",
      color: css(COR.tinta),
    });
    const meu = adiada.quemSelou === ladoDoJogador;
    const lance = rotuloDoLance(posicaoDaAdiada(adiada).moveNumber(), adiada.quemSelou, adiada.selado);
    this.add.text(
      x0 + 26,
      108,
      t(meu ? "adiamento.noite_seu" : "adiamento.noite_dele", { lance, nome: t(adversario.nome) }),
      { fontFamily: FONTE.corpo, fontSize: "18px", color: css(COR.tinta), lineSpacing: 6, wordWrap: { width: 450 } },
    );
    this.variante = this.add.text(x0 + 26, 400, "", {
      fontFamily: FONTE.colunas,
      fontSize: "17px",
      color: css(COR.sepia),
      lineSpacing: 5,
      wordWrap: { width: 450 },
    });
    botao(this, x0 + 130, ALTURA - 150, t("adiamento.desfazer"), () => this.desfazer(), { largura: 220, altura: 46, tamanho: 17, claro: true });
    botao(this, x0 + 370, ALTURA - 150, t("adiamento.voltar_posicao"), () => this.voltarAoEnvelope(), {
      largura: 220,
      altura: 46,
      tamanho: 17,
      claro: true,
    });
    botao(
      this,
      x0 + 250,
      ALTURA - 80,
      t("adiamento.voltar_ao_clube"),
      () => trocarDeCena(this, "Partida", { adversario: adiada.adversario, retomar: true }, 900),
      { largura: 420, altura: 52, tamanho: 19 },
    );
    this.atualizarVariante();
  }

  private mexer(lance: LanceDoJogador): void {
    const feito = this.analise.move(lance);
    this.tabuleiro.marcarUltimo(feito.from, feito.to);
    this.tabuleiro.liberar(true);
    this.atualizarVariante();
  }

  private desfazer(): void {
    if (this.analise.history().length <= this.lancesDoEnvelope) return;
    this.analise.undo();
    const anterior = this.analise.history({ verbose: true }).at(-1);
    if (anterior && this.analise.history().length > this.lancesDoEnvelope) this.tabuleiro.marcarUltimo(anterior.from, anterior.to);
    else this.tabuleiro.esquecerUltimo();
    this.tabuleiro.liberar(true);
    this.atualizarVariante();
  }

  private voltarAoEnvelope(): void {
    while (this.analise.history().length > this.lancesDoEnvelope) this.analise.undo();
    this.tabuleiro.esquecerUltimo();
    this.tabuleiro.liberar(true);
    this.atualizarVariante();
  }

  /** Os lances da análise, a partir da posição do envelope. */
  private atualizarVariante(): void {
    const todos = this.analise.history({ verbose: true }).slice(this.lancesDoEnvelope);
    if (todos.length === 0) {
      this.variante.setText(t("adiamento.sem_variante"));
      return;
    }
    const partes = todos.map((lance, i) => {
      const numero = Math.floor((this.lancesDoEnvelope + i) / 2) + 1;
      if (lance.color === "w") return `${numero}.${lance.san}`;
      return i === 0 ? `${numero}...${lance.san}` : lance.san;
    });
    this.variante.setText(`${t("adiamento.variante")}\n${partes.join(" ")}`);
  }
}
