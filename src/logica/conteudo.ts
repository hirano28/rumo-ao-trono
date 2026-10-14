// O formato do conteúdo de uma época e a conferência dele (DESIGN.md §9).
// O código do jogo não sabe que é 1950: tudo vem destes dados.

import type { Pontos } from "./forca";

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
  /** "noticias": mostra as notícias listadas; "texto": um texto só. */
  tipo: "noticias" | "texto";
  cabecalho: string;
  noticias?: string[];
  texto?: string;
}

export interface Personagem {
  id: string;
  dialogo: string;
  adversario?: string;
}

export interface Capitulo {
  id: string;
  ano: number;
  titulo: string;
  abertura: string[];
  quarto: { objetos: ObjetoDoQuarto[]; saida: string };
  praca: { titulo: string; personagens: Personagem[] };
  desafio: { adversarios: string[]; pontosMinimos: number };
  fechamento: { aprovado: string; reprovado: string; proximo: string };
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
    for (const objeto of capitulo.quarto.objetos) {
      for (const id of objeto.noticias ?? []) {
        if (!idsDeNoticia.has(id)) problemas.push(`objeto ${objeto.id} cita notícia inexistente ${id}`);
      }
    }
    for (const personagem of capitulo.praca.personagens) {
      if (!conteudo.dialogos[personagem.dialogo]) {
        problemas.push(`personagem ${personagem.id} sem diálogo ${personagem.dialogo}`);
      }
      if (personagem.adversario && !conteudo.adversarios[personagem.adversario]) {
        problemas.push(`personagem ${personagem.id} cita adversário inexistente ${personagem.adversario}`);
      }
    }
    for (const id of capitulo.desafio.adversarios) {
      if (!conteudo.adversarios[id]) problemas.push(`desafio de ${capitulo.id} cita adversário inexistente ${id}`);
    }
    if (capitulo.desafio.pontosMinimos > capitulo.desafio.adversarios.length) {
      problemas.push(`desafio de ${capitulo.id} pede mais pontos do que partidas`);
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
