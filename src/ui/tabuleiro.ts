// O tabuleiro de madeira: desenha a posição de um chess.js, mostra os lances
// legais da peça escolhida e entrega o lance do jogador (clique na peça,
// clique na casa). A promoção abre uma escolha das quatro peças.

import Phaser from "phaser";
import type { Chess, Color, PieceSymbol, Square } from "chess.js";
import { COR, FONTE, css } from "./estilo";

const COLUNAS = "abcdefgh";

export interface LanceDoJogador {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

export const PECAS = ["wp", "wn", "wb", "wr", "wq", "wk", "bp", "bn", "bb", "br", "bq", "bk"] as const;

/** Carrega as imagens das peças (chamar no preload da cena). */
export function carregarPecas(cena: Phaser.Scene, tamanho: number): void {
  for (const peca of PECAS) {
    if (!cena.textures.exists(peca)) {
      cena.load.svg(peca, `${import.meta.env.BASE_URL}pecas/${peca}.svg`, { width: tamanho, height: tamanho });
    }
  }
}

export class Tabuleiro extends Phaser.GameObjects.Container {
  private readonly casa: number;
  private readonly lado: Color;
  private readonly marcas: Phaser.GameObjects.GameObject[] = [];
  private readonly pecas: Phaser.GameObjects.Image[] = [];
  private selecionada?: Square;
  private bloqueado = true;
  private ultimo?: { from: Square; to: Square };
  private escolhaDePromocao?: Phaser.GameObjects.Container;

  constructor(
    cena: Phaser.Scene,
    x: number,
    y: number,
    casa: number,
    lado: Color,
    private readonly partida: Chess,
    private readonly aoJogar: (lance: LanceDoJogador) => void,
  ) {
    super(cena, x, y);
    this.casa = casa;
    this.lado = lado;
    cena.add.existing(this);
    this.desenharMoldura();
    this.desenhar();
  }

  /** Libera ou trava a mão do jogador (travado enquanto o adversário pensa). */
  liberar(liberado: boolean): void {
    this.bloqueado = !liberado;
    if (!liberado) this.selecionada = undefined;
    this.desenhar();
  }

  marcarUltimo(from: Square, to: Square): void {
    this.ultimo = { from, to };
  }

  desenhar(): void {
    for (const objeto of [...this.marcas, ...this.pecas]) objeto.destroy();
    this.marcas.length = 0;
    this.pecas.length = 0;

    const tabuleiro = this.partida.board();
    const legais = this.selecionada ? this.partida.moves({ square: this.selecionada, verbose: true }) : [];
    const reiEmXeque = this.partida.inCheck() ? this.casaDoRei(this.partida.turn()) : undefined;

    for (let linha = 0; linha < 8; linha++) {
      for (let coluna = 0; coluna < 8; coluna++) {
        const casa = this.nomeDaCasa(linha, coluna);
        const { x, y } = this.posicao(casa);
        if (this.ultimo && (casa === this.ultimo.from || casa === this.ultimo.to)) {
          this.marcar(this.scene.add.rectangle(x, y, this.casa, this.casa, COR.dourado, 0.45));
        }
        if (casa === this.selecionada) {
          this.marcar(this.scene.add.rectangle(x, y, this.casa, this.casa, COR.oliva, 0.55));
        }
        if (casa === reiEmXeque) {
          this.marcar(this.scene.add.circle(x, y, this.casa * 0.48, COR.vermelho, 0.55));
        }
        const fileira = 8 - Number(casa[1]);
        const peca = tabuleiro[fileira][COLUNAS.indexOf(casa[0])];
        if (peca) {
          const imagem = this.scene.add.image(x, y, peca.color + peca.type).setDisplaySize(this.casa * 0.92, this.casa * 0.92);
          this.add(imagem);
          this.pecas.push(imagem);
        }
      }
    }
    for (const lance of legais) {
      const { x, y } = this.posicao(lance.to);
      const captura = lance.captured !== undefined;
      this.marcar(
        captura
          ? this.scene.add.circle(x, y, this.casa * 0.44).setStrokeStyle(5, COR.oliva, 0.75)
          : this.scene.add.circle(x, y, this.casa * 0.14, COR.oliva, 0.75),
      );
    }
  }

  private desenharMoldura(): void {
    const total = this.casa * 8;
    const borda = this.casa * 0.42;
    this.add(this.scene.add.rectangle(total / 2 + 6, total / 2 + 8, total + borda * 2, total + borda * 2, 0x000000, 0.35));
    this.add(this.scene.add.rectangle(total / 2, total / 2, total + borda * 2, total + borda * 2, COR.madeiraEscura));
    for (let linha = 0; linha < 8; linha++) {
      for (let coluna = 0; coluna < 8; coluna++) {
        const clara = (linha + coluna) % 2 === 0;
        const quadrado = this.scene.add
          .rectangle(coluna * this.casa + this.casa / 2, linha * this.casa + this.casa / 2, this.casa, this.casa, clara ? COR.casaClara : COR.casaEscura)
          .setInteractive({ useHandCursor: true });
        const nome = this.nomeDaCasa(linha, coluna);
        quadrado.on("pointerup", () => this.clicar(nome));
        this.add(quadrado);
      }
    }
    const estiloCoordenada = { fontFamily: FONTE.corpo, fontSize: `${Math.round(this.casa * 0.22)}px`, color: css(COR.casaClara) };
    for (let i = 0; i < 8; i++) {
      const coluna = this.lado === "w" ? COLUNAS[i] : COLUNAS[7 - i];
      const fileira = this.lado === "w" ? 8 - i : i + 1;
      this.add(this.scene.add.text(i * this.casa + this.casa / 2, total + borda / 2, coluna, estiloCoordenada).setOrigin(0.5));
      this.add(this.scene.add.text(-borda / 2, i * this.casa + this.casa / 2, String(fileira), estiloCoordenada).setOrigin(0.5));
    }
  }

  private marcar(objeto: Phaser.GameObjects.Shape): void {
    this.add(objeto);
    this.marcas.push(objeto);
  }

  private clicar(casa: Square): void {
    if (this.escolhaDePromocao) {
      // clicar fora da escolha de promoção desiste do lance
      this.escolhaDePromocao.destroy();
      this.escolhaDePromocao = undefined;
      this.desenhar();
      return;
    }
    if (this.bloqueado) return;
    const peca = this.partida.get(casa);
    if (this.selecionada) {
      const lance = this.partida.moves({ square: this.selecionada, verbose: true }).find((m) => m.to === casa);
      if (lance) {
        const de = this.selecionada;
        this.selecionada = undefined;
        if (lance.promotion) {
          this.escolherPromocao(de, casa);
        } else {
          this.aoJogar({ from: de, to: casa });
        }
        return;
      }
    }
    this.selecionada = peca && peca.color === this.partida.turn() && peca.color === this.lado ? casa : undefined;
    this.desenhar();
  }

  private escolherPromocao(from: Square, to: Square): void {
    const { x, y } = this.posicao(to);
    const opcoes: PieceSymbol[] = ["q", "r", "b", "n"];
    const fundo = this.scene.add.rectangle(0, 0, this.casa * 4.4, this.casa * 1.2, COR.papel).setStrokeStyle(2, COR.sepia);
    const filhos: Phaser.GameObjects.GameObject[] = [fundo];
    opcoes.forEach((tipo, i) => {
      const imagem = this.scene.add
        .image((i - 1.5) * this.casa * 1.05, 0, this.lado + tipo)
        .setDisplaySize(this.casa * 0.95, this.casa * 0.95)
        .setInteractive({ useHandCursor: true });
      imagem.on("pointerup", () => {
        this.escolhaDePromocao?.destroy();
        this.escolhaDePromocao = undefined;
        this.aoJogar({ from, to, promotion: tipo });
      });
      filhos.push(imagem);
    });
    const meio = this.casa * 4;
    this.escolhaDePromocao = this.scene.add.container(this.x + Phaser.Math.Clamp(x, this.casa * 2.2, meio * 2 - this.casa * 2.2), this.y + y, filhos);
  }

  private casaDoRei(cor: Color): Square | undefined {
    for (const fileira of this.partida.board()) {
      for (const peca of fileira) {
        if (peca && peca.type === "k" && peca.color === cor) return peca.square;
      }
    }
    return undefined;
  }

  private nomeDaCasa(linha: number, coluna: number): Square {
    const c = this.lado === "w" ? coluna : 7 - coluna;
    const f = this.lado === "w" ? 8 - linha : linha + 1;
    return `${COLUNAS[c]}${f}` as Square;
  }

  private posicao(casa: Square): { x: number; y: number } {
    const c = COLUNAS.indexOf(casa[0]);
    const f = Number(casa[1]);
    const coluna = this.lado === "w" ? c : 7 - c;
    const linha = this.lado === "w" ? 8 - f : f - 1;
    return { x: coluna * this.casa + this.casa / 2, y: linha * this.casa + this.casa / 2 };
  }
}
