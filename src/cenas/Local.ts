// Um lugar da história (o parque, o Palácio dos Pioneiros…): o cenário, os
// personagens com quem conversar, os objetos para olhar e o desafio do
// capítulo. Tudo vem do conteúdo do capítulo; num torneio, o jogador enfrenta
// os adversários na ordem das rodadas e a tabela fica na parede.

import Phaser from "phaser";
import { CONTEUDO, capituloAtual, forcasDoDesafio, guardar, progresso, vistoChave } from "../estado";
import { dataPorExtenso, t } from "../i18n/textos";
import { desafioCompleto, pontosDoDesafio, type Dialogo, type ObjetoDoQuarto, type Personagem } from "../logica/conteudo";
import { classificacao, jogosAte, VOCE } from "../logica/torneio";
import { clicavel } from "../ui/clicavel";
import { chaveDoPersonagem } from "../ui/arte";
import { desenharCenario, desenharPersonagem } from "../ui/cenarios";
import { botao, caixaDeDialogo, folhaDePapel, type Secao } from "../ui/componentes";
import { ALTURA, COR, FONTE, LARGURA, css } from "../ui/estilo";
import { trocarDeCena } from "../ui/transicao";

export class Local extends Phaser.Scene {
  private ocupado = false;

  constructor() {
    super("Local");
  }

  create(): void {
    this.ocupado = false;
    this.cameras.main.fadeIn(700, 0, 0, 0);
    const capitulo = capituloAtual();
    desenharCenario(this, capitulo.local.cenario);
    for (const objeto of capitulo.local.objetos ?? []) this.desenharObjeto(objeto);
    for (const personagem of capitulo.local.personagens) this.desenharPersonagem(personagem);
    this.desenharPlacar();

    // envelope de um adversário que não está mais no desafio (conteúdo mudou): não vale
    const adiada = progresso().adiada;
    if (adiada && !capitulo.desafio.adversarios.includes(adiada.adversario)) {
      delete progresso().adiada;
      guardar();
    }
    if (progresso().adiada) {
      const { adversario } = progresso().adiada!;
      botao(
        this,
        LARGURA / 2 - 150,
        ALTURA - 50,
        t("local.retomar_adiada", { adversario: t(CONTEUDO.adversarios[adversario].nome) }),
        () => trocarDeCena(this, "Partida", { adversario, retomar: true }),
        { largura: 520 },
      );
      botao(this, LARGURA / 2 + 280, ALTURA - 50, t("local.voltar_analise"), () => trocarDeCena(this, "Adiamento"), {
        largura: 300,
        claro: true,
      });
    }

    if (desafioCompleto(progresso().resultados, capitulo.desafio.adversarios)) {
      const rotulo = capitulo.desafio.torneio ? "local.ver_classificacao" : "local.fim_do_dia";
      botao(this, LARGURA / 2, ALTURA - 50, t(rotulo), () => trocarDeCena(this, "Resultado"), { largura: 440 });
    }
  }

  /** No torneio, o adversário da rodada em curso; fora dele, qualquer um ainda não enfrentado. */
  private podeJogarCom(adversario: string): boolean {
    const { desafio } = capituloAtual();
    const resultados = progresso().resultados;
    if (resultados[adversario] !== undefined) return false;
    // com uma partida no envelope, só ela pode ser jogada
    const adiada = progresso().adiada;
    if (adiada) return adiada.adversario === adversario;
    if (!desafio.torneio) return true;
    return desafio.adversarios.find((id) => resultados[id] === undefined) === adversario;
  }

  private desenharPlacar(): void {
    const capitulo = capituloAtual();
    const { desafio } = capitulo;
    const feitos = desafio.adversarios.filter((id) => progresso().resultados[id] !== undefined).length;
    const pontos = pontosDoDesafio(progresso().resultados, desafio.adversarios);
    const proximo = desafio.adversarios.find((id) => progresso().resultados[id] === undefined);
    const texto = desafio.torneio
      ? t(proximo ? "local.placar_torneio" : "local.placar_torneio_fim", {
          rodada: feitos + 1,
          total: desafio.torneio.rodadas.length,
          adversario: proximo ? t(CONTEUDO.adversarios[proximo].nome) : "",
          pontos: formatarPontos(pontos),
        })
      : t("local.placar", { pontos: formatarPontos(pontos), jogadas: feitos, total: desafio.adversarios.length, minimo: desafio.pontosMinimos });
    this.add.rectangle(LARGURA - 200, 52, 360, 70, COR.papel, 0.95).setStrokeStyle(2, COR.sepia);
    this.add
      .text(LARGURA - 200, 52, texto, { fontFamily: FONTE.maquina, fontSize: "17px", color: css(COR.tinta), align: "center", wordWrap: { width: 330 } })
      .setOrigin(0.5);
    this.add
      .text(40, 40, t(capitulo.local.titulo), { fontFamily: FONTE.titulo, fontSize: "34px", fontStyle: "800", color: css(COR.papel) })
      .setShadow(2, 2, "#000", 4);
  }

  private desenharObjeto(objeto: ObjetoDoQuarto): void {
    if (objeto.x === undefined || objeto.y === undefined) return;
    clicavel(this, objeto.x, objeto.y, objeto.largura ?? 120, objeto.altura ?? 80, t(objeto.rotulo), () => this.abrirObjeto(objeto), {
      visto: progresso().vistos.includes(vistoChave(objeto.id)),
    });
  }

  private abrirObjeto(objeto: ObjetoDoQuarto): void {
    if (this.ocupado) return;
    this.ocupado = true;
    this.marcarVisto(objeto.id);
    const secoes: Secao[] =
      objeto.tipo === "tabela"
        ? this.secoesDaTabela()
        : objeto.tipo === "noticias"
          ? (objeto.noticias ?? []).map((id) => {
              const noticia = CONTEUDO.noticias.find((n) => n.id === id)!;
              return { data: dataPorExtenso(noticia.data), titulo: t(noticia.titulo), texto: t(noticia.texto) };
            })
          : [{ texto: t(objeto.texto!) }];
    folhaDePapel(this, t(objeto.cabecalho), secoes, t("comum.fechar"), () => {
      this.ocupado = false;
    });
  }

  /** A tabela do torneio até a rodada que o jogador já jogou. */
  private secoesDaTabela(): Secao[] {
    const { desafio } = capituloAtual();
    if (!desafio.torneio) return [{ texto: "" }];
    const atual = progresso();
    const feitas = desafio.adversarios.filter((id) => atual.resultados[id] !== undefined).length;
    const jogos = jogosAte(feitas, desafio.torneio.rodadas, desafio.adversarios, atual.resultados, forcasDoDesafio(), atual.semente);
    return [{ texto: tabelaEmTexto(classificacao([VOCE, ...desafio.adversarios], jogos)), monoespacada: true }];
  }

  private desenharPersonagem(personagem: Personagem): void {
    const h = desenharPersonagem(this, personagem);
    const dialogo = CONTEUDO.dialogos[personagem.dialogo];
    const jaJogou = personagem.adversario ? progresso().resultados[personagem.adversario] !== undefined : false;
    this.add
      .text(personagem.x, personagem.y + 18, t(dialogo.quem), {
        fontFamily: FONTE.corpo,
        fontSize: "17px",
        fontStyle: "600",
        color: css(COR.papel),
        backgroundColor: "rgba(20,17,13,0.55)",
        padding: { x: 8, y: 2 },
      })
      .setOrigin(0.5);
    clicavel(this, personagem.x, personagem.y - h / 2, h * 0.42, h, t("local.conversar"), () => this.conversar(personagem, dialogo), {
      visto: jaJogou || progresso().vistos.includes(vistoChave(personagem.id)),
    });
  }

  private marcarVisto(id: string): void {
    const chave = vistoChave(id);
    if (!progresso().vistos.includes(chave)) {
      progresso().vistos.push(chave);
      guardar();
    }
  }

  private conversar(personagem: Personagem, dialogo: Dialogo): void {
    if (this.ocupado) return;
    this.ocupado = true;
    const resultado = personagem.adversario ? progresso().resultados[personagem.adversario] : undefined;
    const depois = resultado === undefined ? undefined : `depois_${resultado === 1 ? "vitoria" : resultado === 0 ? "derrota" : "empate"}`;
    this.marcarVisto(personagem.id);
    this.mostrarNo(personagem, dialogo, depois && dialogo.nos[depois] ? depois : dialogo.inicio);
  }

  private mostrarNo(personagem: Personagem, dialogo: Dialogo, nome: string): void {
    const no = dialogo.nos[nome];
    const pode = personagem.adversario ? this.podeJogarCom(personagem.adversario) : false;
    const opcoes = no.opcoes.filter((o) => o.acao !== "jogar" || pode);
    caixaDeDialogo(
      this,
      t(dialogo.quem),
      t(no.fala),
      opcoes.map((opcao) => ({
        texto: t(opcao.texto),
        aoEscolher: () => {
          if (opcao.vai) return this.mostrarNo(personagem, dialogo, opcao.vai);
          this.ocupado = false;
          if (opcao.acao === "jogar" && personagem.adversario) {
            const retomar = progresso().adiada?.adversario === personagem.adversario;
            trocarDeCena(this, "Partida", { adversario: personagem.adversario, retomar });
          }
        },
      })),
      chaveDoPersonagem(personagem.id),
    );
  }
}

export function formatarPontos(pontos: number): string {
  const inteiro = Math.floor(pontos);
  const meio = pontos - inteiro >= 0.5;
  if (!meio) return String(inteiro);
  return inteiro === 0 ? "½" : `${inteiro}½`;
}

/** A tabela como texto em colunas: posição, nome, pontos e jogos. */
export function tabelaEmTexto(linhas: ReadonlyArray<{ id: string; pontos: number; jogos: number }>): string {
  const nome = (id: string) => (id === VOCE ? t("torneio.voce") : t(CONTEUDO.adversarios[id].nome));
  const largura = Math.max(...linhas.map((l) => nome(l.id).length)) + 2;
  const cabecalho = `${"".padEnd(4)}${t("torneio.jogador").padEnd(largura)}${t("torneio.pontos").padStart(6)}${t("torneio.jogos").padStart(7)}`;
  return [
    cabecalho,
    ...linhas.map((l, i) => `${`${i + 1}.`.padEnd(4)}${nome(l.id).padEnd(largura)}${formatarPontos(l.pontos).padStart(6)}${String(l.jogos).padStart(7)}`),
  ].join("\n");
}
