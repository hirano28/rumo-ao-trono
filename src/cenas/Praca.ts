// O parque do bairro: as mesas de pedra, os frequentadores e o primeiro
// desafio. Cada adversário conversa antes e depois da partida.

import Phaser from "phaser";
import { CONTEUDO, capituloAtual, guardar, progresso } from "../estado";
import { t } from "../i18n/textos";
import { desafioCompleto, pontosDoDesafio, type Dialogo, type Personagem } from "../logica/conteudo";
import { clicavel } from "../ui/clicavel";
import { botao, caixaDeDialogo } from "../ui/componentes";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";
import { trocarDeCena } from "../ui/transicao";

/** Onde cada personagem está no parque, e a cor do casaco. */
const LUGAR: Record<string, { x: number; y: number; casaco: number; altura: number }> = {
  peteris: { x: 330, y: 470, casaco: 0x5b6b8a, altura: 0.8 },
  grisha: { x: 640, y: 455, casaco: 0x5a4a3a, altura: 1 },
  ozols: { x: 960, y: 460, casaco: 0x3a3a3a, altura: 1 },
  marta: { x: 1150, y: 430, casaco: 0x7a3d2c, altura: 0.95 },
};

export class Praca extends Phaser.Scene {
  private conversando = false;

  constructor() {
    super("Praca");
  }

  create(): void {
    this.conversando = false;
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.desenharParque();
    const capitulo = capituloAtual();
    for (const personagem of capitulo.praca.personagens) this.desenharPersonagem(personagem);
    this.desenharPlacar();

    if (desafioCompleto(progresso().resultados, capitulo.desafio.adversarios)) {
      botao(this, LARGURA / 2, ALTURA - 50, t("praca.fim_do_dia"), () => this.irPara("Resultado"), { largura: 440 });
    }
  }

  private desenharPlacar(): void {
    const { desafio } = capituloAtual();
    const feitos = desafio.adversarios.filter((id) => progresso().resultados[id] !== undefined).length;
    const pontos = pontosDoDesafio(progresso().resultados, desafio.adversarios);
    const texto = t("praca.placar", {
      pontos: formatarPontos(pontos),
      jogadas: feitos,
      total: desafio.adversarios.length,
      minimo: desafio.pontosMinimos,
    });
    this.add.rectangle(LARGURA - 200, 52, 360, 70, COR.papel, 0.95).setStrokeStyle(2, COR.sepia);
    this.add
      .text(LARGURA - 200, 52, texto, {
        fontFamily: FONTE.maquina,
        fontSize: "17px",
        color: css(COR.tinta),
        align: "center",
        wordWrap: { width: 330 },
      })
      .setOrigin(0.5);
    this.add
      .text(40, 40, t(capituloAtual().praca.titulo), {
        fontFamily: FONTE.titulo,
        fontSize: "34px",
        fontStyle: "800",
        color: css(COR.papel),
      })
      .setShadow(2, 2, "#000", 4);
  }

  private desenharPersonagem(personagem: Personagem): void {
    const lugar = LUGAR[personagem.id];
    if (!lugar) return;
    const { x, y, casaco, altura } = lugar;
    const g = this.add.graphics();
    const h = 150 * altura;
    g.fillStyle(0x000000, 0.25).fillEllipse(x, y + h / 2 + 6, 90, 16);
    g.fillStyle(casaco).fillRoundedRect(x - 34, y - h / 2 + 34, 68, h - 34, 16);
    const cabeca = y - h / 2 + 16;
    g.fillStyle(0xd9b48f).fillCircle(x, cabeca, 22);
    // chapéu: copa e aba por cima da cabeça, sem cobrir o rosto
    g.fillStyle(0x2b2118).fillRoundedRect(x - 17, cabeca - 38, 34, 20, 7);
    g.fillEllipse(x, cabeca - 18, 58, 10);
    const dialogo = CONTEUDO.dialogos[personagem.dialogo];
    const jaJogou = personagem.adversario ? progresso().resultados[personagem.adversario] !== undefined : false;
    this.add
      .text(x, y + h / 2 + 24, t(dialogo.quem), {
        fontFamily: FONTE.corpo,
        fontSize: "17px",
        fontStyle: "600",
        color: css(COR.papel),
        backgroundColor: "rgba(20,17,13,0.55)",
        padding: { x: 8, y: 2 },
      })
      .setOrigin(0.5);
    clicavel(this, x, y, 90, h, t("praca.conversar"), () => this.conversar(personagem, dialogo), {
      visto: jaJogou || progresso().vistos.includes(personagem.id),
    });
  }

  private conversar(personagem: Personagem, dialogo: Dialogo): void {
    if (this.conversando) return;
    this.conversando = true;
    const resultado = personagem.adversario ? progresso().resultados[personagem.adversario] : undefined;
    const depois = resultado === undefined ? undefined : `depois_${resultado === 1 ? "vitoria" : resultado === 0 ? "derrota" : "empate"}`;
    if (!progresso().vistos.includes(personagem.id)) {
      progresso().vistos.push(personagem.id);
      guardar();
    }
    this.mostrarNo(personagem, dialogo, depois && dialogo.nos[depois] ? depois : dialogo.inicio);
  }

  private mostrarNo(personagem: Personagem, dialogo: Dialogo, nome: string): void {
    const no = dialogo.nos[nome];
    const jaJogou = personagem.adversario ? progresso().resultados[personagem.adversario] !== undefined : true;
    const opcoes = no.opcoes.filter((o) => o.acao !== "jogar" || !jaJogou);
    caixaDeDialogo(
      this,
      t(dialogo.quem),
      t(no.fala),
      opcoes.map((opcao) => ({
        texto: t(opcao.texto),
        aoEscolher: () => {
          if (opcao.vai) return this.mostrarNo(personagem, dialogo, opcao.vai);
          this.conversando = false;
          if (opcao.acao === "jogar" && personagem.adversario) {
            this.irPara("Partida", { adversario: personagem.adversario });
          }
        },
      })),
    );
  }

  private irPara(cena: string, dados?: object): void {
    trocarDeCena(this, cena, dados);
  }

  private desenharParque(): void {
    const g = this.add.graphics();
    // céu de fim de tarde de outono
    const faixas = [0x8a9bb0, 0x9fa9b3, 0xb6b2a6, 0xc9b593];
    faixas.forEach((cor, i) => g.fillStyle(cor).fillRect(0, i * 70, LARGURA, 70));
    // prédios ao fundo
    g.fillStyle(0x6d6a66);
    [[0, 150, 180], [170, 120, 140], [300, 170, 120], [800, 130, 200], [1000, 160, 150], [1140, 110, 140]].forEach(([x, y, l]) =>
      g.fillRect(x, y, l, 280 - y),
    );
    g.fillStyle(0x5d5a57).fillRect(560, 60, 40, 220).fillTriangle(555, 60, 580, -20, 605, 60);
    // gramado e caminho
    g.fillStyle(0x58663f).fillRect(0, 280, LARGURA, ALTURA - 280);
    g.fillStyle(0xb9a27c).fillRect(0, 560, LARGURA, 90);
    g.fillStyle(0xa58f6b);
    for (let x = 0; x < LARGURA; x += 70) g.fillRect(x, 600, 34, 4);
    // árvores com folhas de outono
    [[90, 250], [470, 230], [790, 250], [1210, 240]].forEach(([x, y]) => {
      g.fillStyle(0x3a2a1a).fillRect(x - 10, y, 20, 150);
      [0xa4652a, 0xb87d35, 0x8f5a2a].forEach((cor, i) => g.fillStyle(cor).fillCircle(x + (i - 1) * 38, y - 10 - (i % 2) * 30, 62));
    });
    // mesas de pedra com tabuleiro
    [[480, 520], [800, 520]].forEach(([x, y]) => {
      g.fillStyle(0x8b8680).fillRect(x - 60, y - 14, 120, 18).fillRect(x - 12, y + 4, 24, 60);
      for (let c = 0; c < 8; c++) {
        g.fillStyle(c % 2 === 0 ? COR.casaClara : COR.casaEscura).fillRect(x - 40 + c * 10, y - 22, 10, 8);
      }
    });
    // banca de jornal
    g.fillStyle(0x4d5a3a).fillRect(1080, 300, 150, 120);
    g.fillStyle(0x6f7d55).fillTriangle(1070, 300, 1155, 260, 1240, 300);
    g.fillStyle(COR.papel).fillRect(1095, 320, 40, 50).fillRect(1145, 320, 40, 50);
  }
}

export function formatarPontos(pontos: number): string {
  const inteiro = Math.floor(pontos);
  const meio = pontos - inteiro >= 0.5;
  if (!meio) return String(inteiro);
  return inteiro === 0 ? "½" : `${inteiro}½`;
}
