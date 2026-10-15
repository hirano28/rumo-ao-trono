import Phaser from "phaser";
import { CONTEUDO, definirProgresso } from "../estado";
import { IDIOMAS, definirIdioma, idiomaAtual, t, type Idioma } from "../i18n/textos";
import type { Modo } from "../logica/forca";
import { carregar, novoProgresso } from "../logica/progresso";
import { HISTORICO_LIGADO } from "../servidor/cliente";
import { agendarProgresso, contaConectada, criarConta, recuperarConta } from "../servidor/sincronia";
import { perguntarApelido } from "../ui/apelido";
import { botao } from "../ui/componentes";
import { carregarPecas } from "../ui/tabuleiro";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";

const CHAVE_PULOU = "rumo-ao-trono:sem-conta";

function lerPulou(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_PULOU) === "1";
  } catch {
    return false;
  }
}

function gravarPulou(): void {
  try {
    window.localStorage.setItem(CHAVE_PULOU, "1");
  } catch {
    // sem armazenamento: pergunta de novo da próxima vez
  }
}

export class Titulo extends Phaser.Scene {
  private modo: Modo = "carreira";
  private rotuloDaConta?: Phaser.GameObjects.GameObject;

  constructor() {
    super("Titulo");
  }

  preload(): void {
    carregarPecas(this, 128);
  }

  create(): void {
    const salvo = carregar();
    if (salvo) {
      definirIdioma(salvo.idioma);
      this.modo = salvo.modo;
    }
    this.desenhar(salvo !== undefined);
    void this.conectar(false);
  }

  /**
   * Na primeira vez (ou quando o jogador pede), pergunta o apelido e cria a
   * conta anônima. Quem pulou não é perguntado de novo a cada abertura: o
   * título mostra o botão "Salvar meu histórico".
   */
  private async conectar(pedido: boolean): Promise<void> {
    if (!HISTORICO_LIGADO) return;
    if (contaConectada() || (await recuperarConta())) return this.mostrarConta();
    if (!pedido && lerPulou()) return this.mostrarConta();
    const resposta = await perguntarApelido(async (apelido) => {
      const resultado = await criarConta(apelido);
      return typeof resultado === "string" ? resultado : undefined;
    });
    if (resposta.apelido) {
      const salvo = carregar();
      if (salvo) agendarProgresso(salvo);
    } else {
      gravarPulou();
    }
    this.mostrarConta();
  }

  private mostrarConta(): void {
    if (!HISTORICO_LIGADO || !this.scene.isActive()) return;
    this.rotuloDaConta?.destroy();
    const conta = contaConectada();
    if (conta) {
      this.rotuloDaConta = this.add
        .text(30, ALTURA - 44, t("titulo.jogando_como", { apelido: conta.apelido }), {
          fontFamily: FONTE.corpo,
          fontSize: "16px",
          fontStyle: "italic",
          color: css(COR.papelSombra),
        })
        .setOrigin(0, 0.5);
    } else {
      this.rotuloDaConta = botao(this, 150, ALTURA - 44, t("titulo.salvar_historico"), () => void this.conectar(true), {
        largura: 240,
        altura: 36,
        tamanho: 15,
        claro: true,
      });
    }
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

    let y = temSalvo ? 335 : 345;
    if (temSalvo) {
      botao(this, LARGURA / 2, y, t("titulo.continuar"), () => this.continuar());
      y += 64;
    }
    botao(this, LARGURA / 2, y, t("titulo.novo_jogo"), () => this.novoJogo(), { claro: temSalvo });
    y += 64;
    botao(this, LARGURA / 2, y, t("titulo.capitulos"), () => this.scene.start("Capitulos", { modo: this.modo }), { claro: true });
    y += 80;

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
          this.mostrarConta();
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
          this.mostrarConta();
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
    this.scene.start(salvo.concluidos.includes(salvo.capitulo) ? "Resultado" : "Local");
  }
}
