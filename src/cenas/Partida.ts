// Uma partida contra um adversário do desafio. No parque não há relógio,
// como era de fato; no clube, o relógio mecânico conta o tempo da história
// (DESIGN.md §6).

import Phaser from "phaser";
import { Chess, type Color } from "chess.js";
import { CONTEUDO, capituloAtual, forcaDoAdversario, guardar, progresso } from "../estado";
import { contaConectada, registrar } from "../servidor/sincronia";
import { t } from "../i18n/textos";
import type { Pontos } from "../logica/forca";
import type { Adversario } from "../logica/conteudo";
import { Relogio, type Lado } from "../logica/relogio";
import { lanceDoAdversario, prepararAdversario, type LanceUci } from "../motor/adversario";
import { motor } from "../motor/motor";
import { CAMADA_SOBRE, botao, veu } from "../ui/componentes";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";
import { chaveDaArte } from "../ui/arte";
import { RelogioDeXadrez } from "../ui/relogioDeXadrez";
import { Tabuleiro, type LanceDoJogador } from "../ui/tabuleiro";
import { trocarDeCena } from "../ui/transicao";

const CASA = 72;
const PENSAR_MINIMO_MS = 700;
const PENSAR_VARIACAO_MS = 1100;

export class Partida extends Phaser.Scene {
  private partida!: Chess;
  private tabuleiro!: Tabuleiro;
  private idAdversario!: string;
  private adversario!: Adversario;
  private ladoDoJogador!: Color;
  private forcaDoAdversario!: number;
  private situacao!: Phaser.GameObjects.Text;
  private lances!: Phaser.GameObjects.Text;
  private terminada = false;
  /** Conta as partidas desta cena: o Phaser reaproveita o objeto, e um lance
   *  atrasado do motor não pode cair na partida seguinte. */
  private numero = 0;
  private fecharConfirmacao?: () => void;
  private relogio?: Relogio;
  private mostradores?: RelogioDeXadrez;

  constructor() {
    super("Partida");
  }

  init(dados: { adversario: string }): void {
    this.idAdversario = dados.adversario;
    this.adversario = CONTEUDO.adversarios[dados.adversario];
    this.ladoDoJogador = this.adversario.corDoJogador === "brancas" ? "w" : "b";
    this.forcaDoAdversario = forcaDoAdversario(dados.adversario);
    this.terminada = false;
    this.numero++;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x2b3a26);
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.desenharMesa();
    this.partida = new Chess();
    // a rede do Maia (ou o Stockfish, nos níveis altos) começa a carregar já
    prepararAdversario(this.forcaDoAdversario);
    const origemX = 92;
    const origemY = (ALTURA - CASA * 8) / 2;
    this.tabuleiro = new Tabuleiro(this, origemX, origemY, CASA, this.ladoDoJogador, this.partida, (lance) => this.jogar(lance));
    const controle = capituloAtual().desafio.relogio;
    this.relogio = controle ? new Relogio(controle) : undefined;
    this.mostradores = undefined;
    this.desenharPainel();
    this.relogio?.iniciar("w");
    // com a aba escondida o jogo para (e o adversário com ele): o relógio também
    const pausar = () => this.relogio?.pausar();
    const retomar = () => this.relogio?.retomar();
    this.game.events.on(Phaser.Core.Events.HIDDEN, pausar);
    this.game.events.on(Phaser.Core.Events.VISIBLE, retomar);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.HIDDEN, pausar);
      this.game.events.off(Phaser.Core.Events.VISIBLE, retomar);
    });
    this.proximaVez();
  }

  update(): void {
    if (!this.relogio || !this.mostradores || this.terminada) return;
    const eu = this.ladoDoJogador;
    const ele: Lado = eu === "w" ? "b" : "w";
    const vez = this.partida.turn();
    this.mostradores.atualizar([this.relogio.minutosDaHistoria(eu), this.relogio.minutosDaHistoria(ele)], vez === eu ? 0 : 1);
    const caiu = this.relogio.bandeira();
    if (caiu) this.perdeuNoTempo(caiu);
  }

  /** Bandeira caída perde, a não ser que o outro lado só tenha o rei (aí é empate). */
  private perdeuNoTempo(lado: Lado): void {
    const outro: Lado = lado === "w" ? "b" : "w";
    const soRei = this.partida.board().flat().filter((p) => p && p.color === outro).length === 1;
    if (soRei) return this.registrar(0.5, "partida.fim_tempo_sem_material");
    const meu = lado === this.ladoDoJogador;
    this.registrar(meu ? 0 : 1, meu ? "partida.fim_tempo_seu" : "partida.fim_tempo_dele");
  }

  /** A mesa do lugar: a de pedra do parque ou a de madeira do Palácio. */
  private desenharMesa(): void {
    const mesa = capituloAtual().local.cenario === "parque" ? "mesa-parque" : "mesa-palacio";
    this.add.image(LARGURA / 2, ALTURA / 2, chaveDaArte(mesa));
  }

  private desenharPainel(): void {
    const x0 = 770;
    this.add.rectangle(x0 + 230, ALTURA / 2, 460, ALTURA - 80, COR.papel, 0.96).setStrokeStyle(2, COR.sepia);
    this.add.text(x0 + 24, 64, t(this.adversario.nome), {
      fontFamily: FONTE.titulo,
      fontSize: "32px",
      fontStyle: "800",
      color: css(COR.tinta),
    });
    this.add.text(x0 + 24, 110, t(this.adversario.apresentacao), {
      fontFamily: FONTE.corpo,
      fontSize: "17px",
      fontStyle: "italic",
      color: css(COR.sepia),
      wordWrap: { width: 410 },
    });
    this.add.text(x0 + 24, 190, t(this.ladoDoJogador === "w" ? "partida.voce_de_brancas" : "partida.voce_de_pretas"), {
      fontFamily: FONTE.corpo,
      fontSize: "18px",
      color: css(COR.tinta),
    });
    this.situacao = this.add.text(x0 + 24, 226, "", {
      fontFamily: FONTE.corpo,
      fontSize: "21px",
      fontStyle: "600",
      color: css(COR.vermelho),
      wordWrap: { width: 410 },
    });
    if (this.relogio) {
      this.mostradores = new RelogioDeXadrez(this, x0 + 230, 340, [t("torneio.voce"), t(this.adversario.nome)]);
    }
    this.lances = this.add.text(x0 + 24, this.relogio ? 470 : 280, "", {
      fontFamily: FONTE.colunas,
      fontSize: "17px",
      color: css(COR.tinta),
      lineSpacing: 6,
    });
    botao(this, x0 + 230, ALTURA - 90, t("partida.abandonar"), () => this.confirmarAbandono(), {
      largura: 220,
      altura: 46,
      tamanho: 17,
      claro: true,
    });
  }

  private proximaVez(): void {
    this.atualizarLances();
    if (this.partida.isGameOver()) return this.encerrar();
    const vezDoJogador = this.partida.turn() === this.ladoDoJogador;
    this.situacao.setText(
      vezDoJogador
        ? t(this.partida.inCheck() ? "partida.sua_vez_xeque" : "partida.sua_vez")
        : t("partida.adversario_pensa", { nome: t(this.adversario.nome) }),
    );
    this.tabuleiro.liberar(vezDoJogador);
    if (!vezDoJogador) void this.vezDoAdversario();
  }

  private jogar(lance: LanceDoJogador): void {
    if (this.terminada) return;
    const feito = this.partida.move(lance);
    this.relogio?.apertar();
    this.tabuleiro.marcarUltimo(feito.from, feito.to);
    this.proximaVez();
  }

  private async vezDoAdversario(): Promise<void> {
    const numero = this.numero;
    const partida = this.partida;
    const inicio = performance.now();
    let lance: LanceUci;
    try {
      lance = await lanceDoAdversario(motor, partida, this.forcaDoAdversario);
    } catch (erro) {
      // sem motor (falhou ou não respondeu), a partida segue com um lance legal ao acaso
      console.error(erro);
      const legais = partida.moves({ verbose: true });
      lance = legais[Math.floor(Math.random() * legais.length)];
    }
    const valeAinda = (): boolean => numero === this.numero && partida === this.partida && !this.terminada;
    if (!valeAinda()) return;
    let espera = PENSAR_MINIMO_MS + Math.random() * PENSAR_VARIACAO_MS - (performance.now() - inicio);
    // apertado no relógio, o adversário joga logo
    if (this.relogio) espera = Math.min(espera, this.relogio.restanteMs(partida.turn()) / 30);
    this.time.delayedCall(Math.max(0, espera), () => {
      if (!valeAinda()) return;
      const feito = partida.move(lance);
      this.relogio?.apertar();
      this.tabuleiro.marcarUltimo(feito.from, feito.to);
      this.proximaVez();
    });
  }

  private atualizarLances(): void {
    const historico = this.partida.history();
    const linhas: string[] = [];
    for (let i = 0; i < historico.length; i += 2) {
      linhas.push(`${String(i / 2 + 1).padStart(3)}. ${historico[i].padEnd(8)}${historico[i + 1] ?? ""}`);
    }
    this.lances.setText(linhas.slice(this.relogio ? -6 : -14).join("\n"));
  }

  private encerrar(): void {
    let pontos: Pontos;
    let motivo: string;
    if (this.partida.isCheckmate()) {
      pontos = this.partida.turn() === this.ladoDoJogador ? 0 : 1;
      motivo = "partida.fim_mate";
    } else {
      pontos = 0.5;
      motivo = this.partida.isStalemate()
        ? "partida.fim_afogamento"
        : this.partida.isThreefoldRepetition()
          ? "partida.fim_repeticao"
          : this.partida.isInsufficientMaterial()
            ? "partida.fim_material"
            : "partida.fim_50_lances";
    }
    this.registrar(pontos, motivo);
  }

  private confirmarAbandono(): void {
    if (this.terminada) return;
    const objetos: Phaser.GameObjects.GameObject[] = [veu(this, 0.6)];
    objetos.push(this.add.rectangle(LARGURA / 2, ALTURA / 2, 520, 220, COR.papel).setStrokeStyle(2, COR.sepia));
    objetos.push(
      this.add
        .text(LARGURA / 2, ALTURA / 2 - 50, t("partida.abandonar_pergunta"), {
          fontFamily: FONTE.corpo,
          fontSize: "21px",
          color: css(COR.tinta),
          align: "center",
          wordWrap: { width: 460 },
        })
        .setOrigin(0.5),
    );
    for (const objeto of objetos) (objeto as Phaser.GameObjects.Rectangle).setDepth(CAMADA_SOBRE);
    const fechar = (): void => {
      objetos.forEach((o) => o.destroy());
      this.fecharConfirmacao = undefined;
    };
    this.fecharConfirmacao = fechar;
    objetos.push(botao(this, LARGURA / 2 - 120, ALTURA / 2 + 50, t("partida.abandonar_sim"), () => {
      fechar();
      this.registrar(0, "partida.fim_abandono");
    }, { largura: 210, altura: 46, tamanho: 17 }).setDepth(CAMADA_SOBRE));
    objetos.push(botao(this, LARGURA / 2 + 120, ALTURA / 2 + 50, t("partida.abandonar_nao"), fechar, {
      largura: 210,
      altura: 46,
      tamanho: 17,
      claro: true,
    }).setDepth(CAMADA_SOBRE));
  }

  /** A partida inteira vai para o histórico do jogador no servidor (PGN com cabeçalho). */
  private registrarNoHistorico(pontos: Pontos, motivo: string): void {
    const voce = contaConectada()?.apelido ?? t("torneio.voce");
    const ele = t(this.adversario.nome);
    const brancasGanharam = (this.ladoDoJogador === "w") === (pontos === 1);
    const resultado = pontos === 0.5 ? "1/2-1/2" : brancasGanharam ? "1-0" : "0-1";
    this.partida.setHeader("Event", t(capituloAtual().titulo));
    this.partida.setHeader("Site", "Rumo ao Trono");
    this.partida.setHeader("Date", new Date().toISOString().slice(0, 10).replace(/-/g, "."));
    this.partida.setHeader("White", this.ladoDoJogador === "w" ? voce : ele);
    this.partida.setHeader("Black", this.ladoDoJogador === "w" ? ele : voce);
    this.partida.setHeader("Result", resultado);
    registrar("partidas", {
      capitulo: progresso().capitulo,
      adversario: this.idAdversario,
      cor: this.ladoDoJogador,
      modo: progresso().modo,
      forca_adversario: Math.round(this.forcaDoAdversario),
      resultado: pontos,
      motivo: motivo.replace("partida.", ""),
      lances: this.partida.history().length,
      pgn: this.partida.pgn(),
    });
  }

  private registrar(pontos: Pontos, motivo: string): void {
    // a partida pode acabar no tabuleiro com a confirmação de abandono aberta: vale o que acabou primeiro
    if (this.terminada) return;
    this.fecharConfirmacao?.();
    this.terminada = true;
    this.relogio?.parar();
    this.tabuleiro.liberar(false);
    progresso().resultados[this.idAdversario] = pontos;
    progresso().forcas[this.idAdversario] = this.forcaDoAdversario;
    guardar();
    this.registrarNoHistorico(pontos, motivo);

    const titulo = pontos === 1 ? "partida.voce_venceu" : pontos === 0 ? "partida.voce_perdeu" : "partida.empate";
    this.situacao.setText(t(titulo));
    veu(this, 0.45);
    this.add.rectangle(LARGURA / 2, ALTURA / 2, 560, 260, COR.papel).setStrokeStyle(3, COR.dourado).setDepth(CAMADA_SOBRE);
    this.add
      .text(LARGURA / 2, ALTURA / 2 - 70, t(titulo), {
        fontFamily: FONTE.titulo,
        fontSize: "40px",
        fontStyle: "800",
        color: css(pontos === 0 ? COR.vermelho : COR.tinta),
      })
      .setOrigin(0.5)
      .setDepth(CAMADA_SOBRE);
    this.add
      .text(LARGURA / 2, ALTURA / 2 - 10, t(motivo), {
        fontFamily: FONTE.corpo,
        fontSize: "19px",
        fontStyle: "italic",
        color: css(COR.sepia),
        align: "center",
        wordWrap: { width: 500 },
      })
      .setOrigin(0.5)
      .setDepth(CAMADA_SOBRE);
    botao(this, LARGURA / 2, ALTURA / 2 + 72, t("partida.levantar"), () => trocarDeCena(this, "Local")).setDepth(
      CAMADA_SOBRE,
    );
  }
}
