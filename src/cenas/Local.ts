// Um lugar da história (o parque, o Palácio dos Pioneiros…): o cenário, os
// personagens com quem conversar, os objetos para olhar e o desafio do
// capítulo. Tudo vem do conteúdo do capítulo; num torneio, o jogador enfrenta
// os adversários na ordem das rodadas e a tabela fica na parede.

import Phaser from "phaser";
import {
  CONTEUDO,
  adversarioDe,
  capituloAtual,
  partidasDoMatchAtual,
  guardar,
  jogosDoTorneio,
  pontosDoJogador,
  progresso,
  rodadasJogadas,
  torneioAtual,
  vistoChave,
} from "../estado";
import { dataPorExtenso, t } from "../i18n/textos";
import { desafioCompleto, type Dialogo, type ObjetoDoQuarto, type Opcao, type Personagem } from "../logica/conteudo";
import { adversarioDaPartida, placarDoMatch } from "../logica/match";
import { classificacao, VOCE } from "../logica/torneio";
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
        t("local.retomar_adiada", { adversario: t(adversarioDe(adversario).nome) }),
        () => trocarDeCena(this, "Partida", { adversario, retomar: true }),
        { largura: 520 },
      );
      botao(this, LARGURA / 2 + 280, ALTURA - 50, t("local.voltar_analise"), () => trocarDeCena(this, "Adiamento"), {
        largura: 300,
        claro: true,
      });
    }

    if (desafioCompleto(progresso().resultados, capitulo.desafio.adversarios)) {
      const rotulo = capitulo.desafio.match ? "local.ver_resultado_match" : capitulo.desafio.torneio ? "local.ver_classificacao" : "local.fim_do_dia";
      botao(this, LARGURA / 2, ALTURA - 50, t(rotulo), () => trocarDeCena(this, "Resultado"), { largura: 440 });
    }

    // torneio grande: as rodadas que passaram fora da tela, contadas numa folha (antes de qualquer clique)
    this.resumirRodadas();
  }

  /**
   * As rodadas completas desde a última vez que o jogador olhou: os jogos dele
   * que foram simulados e o que aconteceu entre as rodadas. Ao fechar a folha,
   * fica marcado nos vistos com a semente do torneio ("cap4:rodadas:<semente>:9"):
   * não conta duas vezes, e um torneio novo (semente nova) conta tudo de novo.
   */
  private resumirRodadas(): void {
    const capitulo = capituloAtual();
    if (capitulo.desafio.match) return this.resumirPartidas();
    const torneio = capitulo.desafio.torneio;
    if (!torneio?.ordem || this.ocupado) return;
    const prefixo = vistoChave(`rodadas:${progresso().semente}:`);
    const vista = Math.max(0, ...progresso().vistos.filter((v) => v.startsWith(prefixo)).map((v) => Number(v.slice(prefixo.length)) || 0));
    const ate = rodadasJogadas();
    if (ate <= vista) return;
    const secoes: Secao[] = [];
    const meus = jogosDoTorneio(ate).filter((j) => j.simulado && j.rodada > vista);
    const linhas = meus.map((j) => {
      const rival = t(CONTEUDO.adversarios[j.pretas].nome);
      const como = j.pontos === 1 ? "torneio.simulada_vitoria" : j.pontos === 0 ? "torneio.simulada_derrota" : "torneio.simulada_empate";
      return `${t("torneio.rodada_n", { rodada: j.rodada })}: ${t(como, { nome: rival })}`;
    });
    if (linhas.length) secoes.push({ texto: linhas.join("\n") });
    for (const evento of torneio.eventos ?? []) {
      if (evento.depoisDaRodada > vista && evento.depoisDaRodada <= ate) secoes.push({ titulo: t(evento.titulo), texto: t(evento.texto) });
    }
    const marcar = (): void => {
      progresso().vistos.push(`${prefixo}${ate}`);
      guardar();
    };
    if (secoes.length === 0) return marcar();
    this.ocupado = true;
    // a partida ao vivo que acabou de ser jogada não entra na folha, nem no título
    const rodadasNaFolha = [
      ...meus.map((j) => j.rodada),
      ...(torneio.eventos ?? []).filter((e) => e.depoisDaRodada > vista && e.depoisDaRodada <= ate).map((e) => e.depoisDaRodada),
    ];
    const de = Math.min(...rodadasNaFolha);
    const cabecalho =
      de === ate
        ? t("torneio.resumo_uma", { rodada: ate })
        : t(de + 1 === ate ? "torneio.resumo_duas" : "torneio.resumo_varias", { de, ate });
    folhaDePapel(this, cabecalho, secoes, t("comum.fechar"), () => {
      marcar();
      this.ocupado = false;
    });
  }

  /** No match, as partidas simuladas desde a última vez, contadas numa folha (como as rodadas do torneio grande). */
  private resumirPartidas(): void {
    const { match } = capituloAtual().desafio;
    if (!match || this.ocupado) return;
    const prefixo = vistoChave(`partidas:${progresso().semente}:`);
    const vista = Math.max(0, ...progresso().vistos.filter((v) => v.startsWith(prefixo)).map((v) => Number(v.slice(prefixo.length)) || 0));
    const partidas = partidasDoMatchAtual();
    const ate = partidas.length;
    if (ate <= vista) return;
    const novas = partidas.filter((p) => p.simulada && p.numero > vista);
    const marcar = (): void => {
      progresso().vistos.push(`${prefixo}${ate}`);
      guardar();
    };
    if (novas.length === 0) return marcar();
    this.ocupado = true;
    const nome = t(adversarioDe(match.adversario).nome);
    const linhas = novas.map((p) => {
      const como = p.pontos === 1 ? "match.simulada_vitoria" : p.pontos === 0 ? "match.simulada_derrota" : "match.simulada_empate";
      return `${t("match.partida_n", { partida: p.numero })}: ${t(como, { nome })}`;
    });
    const { voce, ele } = placarDoMatch(partidas);
    linhas.push("", t("match.placar_parcial", { voce: formatarPontos(voce), ele: formatarPontos(ele), nome }));
    const de = novas[0].numero;
    const fim = novas[novas.length - 1].numero;
    const cabecalho =
      de === fim ? t("match.resumo_uma", { partida: de }) : t(de + 1 === fim ? "match.resumo_duas" : "match.resumo_varias", { de, ate: fim });
    folhaDePapel(this, cabecalho, [{ texto: linhas.join("\n") }], t("comum.fechar"), () => {
      marcar();
      this.ocupado = false;
    });
  }

  /** A próxima partida ainda não jogada contra este adversário (no match, "saigin@5"; fora dele, o próprio id). */
  private proximaPartida(adversario: string): string | undefined {
    const resultados = progresso().resultados;
    return capituloAtual().desafio.adversarios.find((id) => adversarioDaPartida(id) === adversario && resultados[id] === undefined);
  }

  /** O resultado da última partida já jogada contra este adversário. */
  private ultimoResultado(adversario: string): number | undefined {
    const resultados = progresso().resultados;
    const jogadas = capituloAtual().desafio.adversarios.filter((id) => adversarioDaPartida(id) === adversario && resultados[id] !== undefined);
    return jogadas.length ? resultados[jogadas[jogadas.length - 1]] : undefined;
  }

  /** No torneio e no match, a partida da vez; fora deles, qualquer uma ainda não jogada. */
  private podeJogarCom(adversario: string): boolean {
    const { desafio } = capituloAtual();
    const resultados = progresso().resultados;
    if (resultados[adversario] !== undefined) return false;
    // com uma partida no envelope, só ela pode ser jogada
    const adiada = progresso().adiada;
    if (adiada) return adiada.adversario === adversario;
    if (!desafio.torneio && !desafio.match) return true;
    return desafio.adversarios.find((id) => resultados[id] === undefined) === adversario;
  }

  private desenharPlacar(): void {
    const capitulo = capituloAtual();
    const { desafio } = capitulo;
    const feitos = desafio.adversarios.filter((id) => progresso().resultados[id] !== undefined).length;
    const pontos = pontosDoJogador();
    const proximo = desafio.adversarios.find((id) => progresso().resultados[id] === undefined);
    const torneio = torneioAtual();
    const match = desafio.match;
    const texto = match
      ? t(proximo ? "local.placar_match" : "local.placar_match_fim", {
          partida: partidasDoMatchAtual().length + 1,
          total: match.partidas,
          ...placarEmTexto(placarDoMatch(partidasDoMatchAtual())),
          nome: t(adversarioDe(match.adversario).nome),
        })
      : torneio
      ? t(proximo ? "local.placar_torneio" : "local.placar_torneio_fim", {
          rodada: rodadasJogadas() + 1,
          total: torneio.rodadas.length,
          adversario: proximo ? t(adversarioDe(proximo).nome) : "",
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

  /** A tabela do torneio até a última rodada completa; no match, o placar partida a partida. */
  private secoesDaTabela(): Secao[] {
    const { match } = capituloAtual().desafio;
    if (match) return [{ texto: placarDoMatchEmTexto(match.partidas, partidasDoMatchAtual()), monoespacada: true }];
    const torneio = torneioAtual();
    if (!torneio) return [{ texto: "" }];
    const tabela = classificacao([VOCE, ...torneio.ordem], jogosDoTorneio());
    return [{ texto: tabelaEmTexto(tabela), monoespacada: true, miuda: tabela.length > 12 }];
  }

  private desenharPersonagem(personagem: Personagem): void {
    const h = desenharPersonagem(this, personagem);
    const dialogo = CONTEUDO.dialogos[personagem.dialogo];
    const jaJogou = personagem.adversario
      ? this.proximaPartida(personagem.adversario) === undefined && this.ultimoResultado(personagem.adversario) !== undefined
      : false;
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
    // no match, o examinador só sai das novidades quando o match acaba
    const doMatch = personagem.adversario !== undefined && personagem.adversario === capituloAtual().desafio.match?.adversario;
    clicavel(this, personagem.x, personagem.y - h / 2, h * 0.42, h, t("local.conversar"), () => this.conversar(personagem, dialogo), {
      visto: jaJogou || (!doMatch && progresso().vistos.includes(vistoChave(personagem.id))),
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
    const resultado = personagem.adversario ? this.ultimoResultado(personagem.adversario) : undefined;
    const depois = resultado === undefined ? undefined : `depois_${resultado === 1 ? "vitoria" : resultado === 0 ? "derrota" : "empate"}`;
    this.marcarVisto(personagem.id);
    this.mostrarNo(personagem, dialogo, depois && dialogo.nos[depois] ? depois : dialogo.inicio);
  }

  private mostrarNo(personagem: Personagem, dialogo: Dialogo, nome: string): void {
    const no = dialogo.nos[nome];
    const proxima = personagem.adversario ? this.proximaPartida(personagem.adversario) : undefined;
    const pode = proxima !== undefined && this.podeJogarCom(proxima);
    // no match, depois de uma partida, o adversário oferece a seguinte
    const noEnvelope = progresso().adiada?.adversario === proxima;
    const seguinte: Opcao[] =
      nome.startsWith("depois_") && pode ? [{ texto: noEnvelope ? "dlg.op.retomar_adiada" : "dlg.op.proxima_partida", acao: "jogar" }] : [];
    const opcoes = [...seguinte, ...no.opcoes].filter((o) => o.acao !== "jogar" || pode);
    caixaDeDialogo(
      this,
      t(dialogo.quem),
      t(no.fala),
      opcoes.map((opcao) => ({
        texto: t(opcao.texto),
        aoEscolher: () => {
          if (opcao.vai) return this.mostrarNo(personagem, dialogo, opcao.vai);
          this.ocupado = false;
          if (opcao.acao === "jogar" && proxima) {
            const retomar = progresso().adiada?.adversario === proxima;
            trocarDeCena(this, "Partida", { adversario: proxima, retomar });
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

function placarEmTexto({ voce, ele }: { voce: number; ele: number }): { voce: string; ele: string } {
  return { voce: formatarPontos(voce), ele: formatarPontos(ele) };
}

/** O placar do match no quadro: uma linha por partida decidida, e o total. */
export function placarDoMatchEmTexto(total: number, partidas: ReadonlyArray<{ numero: number; pontos: number }>): string {
  const linhas = [`${t("match.partida").padEnd(10)}${t("torneio.voce").padStart(8)}`];
  for (let numero = 1; numero <= total; numero++) {
    const partida = partidas.find((p) => p.numero === numero);
    linhas.push(`${String(numero).padStart(3)}${"".padEnd(7)}${(partida ? formatarPontos(partida.pontos) || "0" : "·").padStart(8)}`);
  }
  const { voce, ele } = placarEmTexto(placarDoMatch(partidas.map((p) => ({ ...p, simulada: false, pontos: p.pontos as 0 | 0.5 | 1 }))));
  linhas.push("", `${t("match.total")}: ${voce} × ${ele}`);
  return linhas.join("\n");
}
