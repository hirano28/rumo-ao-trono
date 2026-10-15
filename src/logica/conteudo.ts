// O formato do conteúdo de uma época e a conferência dele (DESIGN.md §9).
// O código do jogo não sabe que é 1950: tudo vem destes dados.

import type { Pontos } from "./forca";
import type { RegraDeAdiamento } from "./adiamento";
import type { ControleDeTempo } from "./relogio";
import { calendarioDo, conferirRodadas } from "./torneio";

export type Confianca = "alta" | "media" | "baixa";

export interface Noticia {
  id: string;
  /** "AAAA", "AAAA-MM" ou "AAAA-MM-DD": só a precisão que a fonte sustenta. */
  data: string;
  titulo: string;
  texto: string;
  /** URL ou referência bibliográfica de onde o fato saiu. Obrigatória. */
  fonte: string;
  confianca: Confianca;
}

export interface Adversario {
  nome: string;
  apresentacao: string;
  forcaHistorica: number;
  degrau: number;
  /** Cor com que o JOGADOR joga contra este adversário. */
  corDoJogador: "brancas" | "pretas";
}

export interface Opcao {
  texto: string;
  vai?: string;
  acao?: "jogar" | "sair";
}

export interface NoDeDialogo {
  fala: string;
  opcoes: Opcao[];
}

export interface Dialogo {
  quem: string;
  inicio: string;
  nos: Record<string, NoDeDialogo>;
}

export interface ObjetoDoQuarto {
  id: string;
  rotulo: string;
  /** "noticias": as notícias listadas; "texto": um texto só; "tabela": a tabela do torneio. */
  tipo: "noticias" | "texto" | "tabela";
  cabecalho: string;
  noticias?: string[];
  texto?: string;
  /** Posição e tamanho da área de clique, nos lugares fora do quarto. */
  x?: number;
  y?: number;
  largura?: number;
  altura?: number;
}

export interface Personagem {
  /** Também o nome do desenho: public/arte/personagens/<id>.svg. */
  id: string;
  dialogo: string;
  adversario?: string;
  /** Onde ficam os pés na cena (1280×720). */
  x: number;
  y: number;
  /** 1 = adulto; menos para criança. */
  altura: number;
}

/** Os cenários que a cena de local sabe desenhar. */
export type Cenario = "parque" | "palacio" | "clube";

export interface Desafio {
  adversarios: string[];
  pontosMinimos: number;
  /** Desafio de calibração: os adversários jogam sempre na força histórica, mesmo rejogado. */
  calibracao?: boolean;
  /** Sem relógio, as partidas são livres (como no parque). */
  relogio?: ControleDeTempo;
  /** Partida que chega ao lance da regra é adiada, com lance secreto (só com relógio). */
  adiamento?: RegraDeAdiamento;
  /** Turno único: os jogos entre os outros, rodada a rodada. */
  torneio?: Torneio;
}

/** Um acontecimento contado entre duas rodadas (no resumo das rodadas simuladas). */
export interface EventoDoTorneio {
  depoisDaRodada: number;
  titulo: string;
  texto: string;
}

export interface Torneio {
  titulo: string;
  /** Torneio pequeno: os jogos entre os outros, escritos à mão. */
  rodadas?: Array<Array<[string, string]>>;
  /**
   * Torneio grande: todos os rivais do jogador, na ordem das rodadas. O
   * calendário sai daqui; só os do `desafio.adversarios` são jogados de
   * verdade, os outros jogos do jogador são simulados pela força dele, e a
   * aprovação passa a contar os pontos do torneio inteiro.
   */
  ordem?: string[];
  eventos?: EventoDoTorneio[];
}

export interface Capitulo {
  id: string;
  ano: number;
  titulo: string;
  abertura: string[];
  /** Sem quarto, a abertura leva direto ao local. */
  quarto?: { objetos: ObjetoDoQuarto[]; saida: string };
  local: { titulo: string; cenario: Cenario; personagens: Personagem[]; objetos?: ObjetoDoQuarto[] };
  desafio: Desafio;
  /**
   * `tentar`: o botão de quem não passou ("Voltar ao parque amanhã").
   * `campeao`: o texto de quem terminou o torneio em primeiro (a história muda).
   */
  fechamento: { aprovado: string; reprovado: string; proximo: string; tentar?: string; campeao?: string };
}

export interface Epoca {
  id: string;
  titulo: string;
  subtitulo: string;
  capitulos: Capitulo[];
}

export interface ConteudoDaEpoca {
  epoca: Epoca;
  adversarios: Record<string, Adversario>;
  dialogos: Record<string, Dialogo>;
  noticias: Noticia[];
}

export function pontosDoDesafio(resultados: Record<string, Pontos>, adversarios: readonly string[]): number {
  return adversarios.reduce((soma, id) => soma + (resultados[id] ?? 0), 0);
}

export function desafioCompleto(resultados: Record<string, Pontos>, adversarios: readonly string[]): boolean {
  return adversarios.every((id) => resultados[id] !== undefined);
}

/** Os campos do conteúdo que guardam chave de texto (o resto é id, número, fonte…). */
const CAMPOS_DE_TEXTO = new Set([
  "titulo",
  "subtitulo",
  "texto",
  "fala",
  "rotulo",
  "cabecalho",
  "saida",
  "nome",
  "apresentacao",
  "quem",
  "aprovado",
  "reprovado",
  "proximo",
  "tentar",
  "campeao",
  "abertura",
]);

/** Toda chave de texto citada num campo de texto do conteúdo, em qualquer profundidade. */
export function chavesUsadas(dado: unknown, achadas = new Set<string>()): Set<string> {
  if (Array.isArray(dado)) {
    for (const item of dado) chavesUsadas(item, achadas);
  } else if (dado && typeof dado === "object") {
    for (const [campo, valor] of Object.entries(dado)) {
      if (CAMPOS_DE_TEXTO.has(campo) && typeof valor === "string") achadas.add(valor);
      else if (CAMPOS_DE_TEXTO.has(campo) && Array.isArray(valor)) {
        for (const item of valor) if (typeof item === "string") achadas.add(item);
      } else chavesUsadas(valor, achadas);
    }
  }
  return achadas;
}

/**
 * Problemas do conteúdo: notícia sem fonte ou de confiança baixa, chave de
 * texto faltando num idioma, referência a adversário, diálogo, nó ou notícia
 * que não existe. Lista vazia = conteúdo pronto para o jogo.
 */
export function conferirConteudo(
  conteudo: ConteudoDaEpoca,
  textosPorIdioma: Record<string, Record<string, string>>,
): string[] {
  const problemas: string[] = [];
  const idsDeNoticia = new Set(conteudo.noticias.map((n) => n.id));

  for (const noticia of conteudo.noticias) {
    if (!noticia.fonte || noticia.fonte.trim().length < 8) {
      problemas.push(`notícia ${noticia.id} sem fonte`);
    }
    if (noticia.confianca === "baixa") {
      problemas.push(`notícia ${noticia.id} com confiança baixa não entra no jogo`);
    }
    if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(noticia.data)) {
      problemas.push(`notícia ${noticia.id} com data fora do formato: ${noticia.data}`);
    }
  }

  for (const capitulo of conteudo.epoca.capitulos) {
    for (const objeto of [...(capitulo.quarto?.objetos ?? []), ...(capitulo.local.objetos ?? [])]) {
      for (const id of objeto.noticias ?? []) {
        if (!idsDeNoticia.has(id)) problemas.push(`objeto ${objeto.id} cita notícia inexistente ${id}`);
      }
    }
    for (const personagem of capitulo.local.personagens) {
      if (!conteudo.dialogos[personagem.dialogo]) {
        problemas.push(`personagem ${personagem.id} sem diálogo ${personagem.dialogo}`);
      }
      if (personagem.adversario && !conteudo.adversarios[personagem.adversario]) {
        problemas.push(`personagem ${personagem.id} cita adversário inexistente ${personagem.adversario}`);
      }
    }
    for (const id of capitulo.desafio.adversarios) {
      if (!conteudo.adversarios[id]) problemas.push(`desafio de ${capitulo.id} cita adversário inexistente ${id}`);
      if (!capitulo.local.personagens.some((p) => p.adversario === id)) {
        problemas.push(`desafio de ${capitulo.id}: ${id} não tem personagem no local (o jogador nunca poderia jogar com ele)`);
      }
    }
    const torneio = capitulo.desafio.torneio;
    const partidas = torneio?.ordem?.length ?? capitulo.desafio.adversarios.length;
    if (capitulo.desafio.pontosMinimos > partidas) {
      problemas.push(`desafio de ${capitulo.id} pede mais pontos do que partidas`);
    }
    if (torneio) {
      if (!torneio.rodadas && !torneio.ordem) problemas.push(`torneio de ${capitulo.id} sem rodadas nem ordem`);
      if (torneio.ordem) {
        for (const id of torneio.ordem) {
          if (!conteudo.adversarios[id]) problemas.push(`torneio de ${capitulo.id} cita participante inexistente ${id}`);
        }
        if (new Set(torneio.ordem).size !== torneio.ordem.length) problemas.push(`torneio de ${capitulo.id}: participante repetido`);
        const posicoes = capitulo.desafio.adversarios.map((id) => torneio.ordem!.indexOf(id));
        if (posicoes.some((p) => p < 0)) problemas.push(`torneio de ${capitulo.id}: adversário ao vivo fora da ordem`);
        if (posicoes.some((p, i) => i > 0 && p <= posicoes[i - 1])) {
          problemas.push(`torneio de ${capitulo.id}: os adversários ao vivo não estão na ordem das rodadas`);
        }
      }
      const { rodadas, ordem } = calendarioDo(torneio, capitulo.desafio.adversarios);
      for (const problema of conferirRodadas(rodadas, ordem)) problemas.push(`torneio de ${capitulo.id}: ${problema}`);
      for (const evento of torneio.eventos ?? []) {
        if (!(evento.depoisDaRodada >= 1 && evento.depoisDaRodada <= rodadas.length)) {
          problemas.push(`torneio de ${capitulo.id}: evento depois da rodada ${evento.depoisDaRodada}, fora do torneio`);
        }
      }
    }
    const relogio = capitulo.desafio.relogio;
    if (relogio && !(relogio.minutos > 0 && relogio.incremento >= 0 && relogio.minutosDaHistoria > 0)) {
      problemas.push(`relógio de ${capitulo.id} inválido`);
    }
    const adiamento = capitulo.desafio.adiamento;
    if (adiamento && !relogio) problemas.push(`adiamento de ${capitulo.id} sem relógio`);
    if (adiamento && !(Number.isInteger(adiamento.noLance) && adiamento.noLance > 0 && adiamento.minutosDaHistoria > 0)) {
      problemas.push(`adiamento de ${capitulo.id} inválido`);
    }
  }

  for (const [id, dialogo] of Object.entries(conteudo.dialogos)) {
    if (!dialogo.nos[dialogo.inicio]) problemas.push(`diálogo ${id} começa num nó inexistente`);
    for (const [nome, no] of Object.entries(dialogo.nos)) {
      if (no.opcoes.length === 0) problemas.push(`diálogo ${id}, nó ${nome}, sem opção de saída`);
      for (const opcao of no.opcoes) {
        if (opcao.vai && !dialogo.nos[opcao.vai]) problemas.push(`diálogo ${id}, nó ${nome}, vai para ${opcao.vai} inexistente`);
        if (!opcao.vai && !opcao.acao) problemas.push(`diálogo ${id}, nó ${nome}, opção sem destino`);
      }
    }
  }

  const usadas = chavesUsadas(conteudo);
  const idiomas = Object.keys(textosPorIdioma);
  for (const idioma of idiomas) {
    const tabela = textosPorIdioma[idioma];
    for (const chave of usadas) {
      if (tabela[chave] === undefined) problemas.push(`texto ${chave} ausente em ${idioma}`);
    }
    for (const outro of idiomas) {
      if (outro === idioma) continue;
      for (const chave of Object.keys(tabela)) {
        if (textosPorIdioma[outro][chave] === undefined) problemas.push(`texto ${chave} existe em ${idioma} e falta em ${outro}`);
      }
    }
  }

  return [...new Set(problemas)];
}
