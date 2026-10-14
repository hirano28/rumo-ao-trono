// Todo texto visível sai daqui, por chave (DESIGN.md §8). Os arquivos de cada
// idioma têm as mesmas chaves; o teste de conteúdo acusa a que faltar.

import interfacePt from "../../conteudo/interface/textos.pt-BR.json";
import interfaceEn from "../../conteudo/interface/textos.en.json";
import epocaPt from "../../conteudo/epocas/riga-1950/textos.pt-BR.json";
import epocaEn from "../../conteudo/epocas/riga-1950/textos.en.json";

export type Idioma = "pt-BR" | "en";

export const IDIOMAS: readonly Idioma[] = ["pt-BR", "en"];

type Tabela = Record<string, string>;

const TABELAS: Record<Idioma, Tabela> = {
  "pt-BR": { ...interfacePt, ...epocaPt },
  en: { ...interfaceEn, ...epocaEn },
};

let atual: Idioma = "pt-BR";

export function definirIdioma(idioma: Idioma): void {
  atual = idioma;
  document.documentElement.lang = idioma;
}

export function idiomaAtual(): Idioma {
  return atual;
}

/** "1950" → "1950"; "1950-05" → "maio de 1950" / "May 1950"; com dia, a data inteira. */
export function dataPorExtenso(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  if (!mes) return String(ano);
  const quando = new Date(Date.UTC(ano, mes - 1, dia ?? 1));
  const formato: Intl.DateTimeFormatOptions = dia
    ? { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
    : { month: "long", year: "numeric", timeZone: "UTC" };
  return quando.toLocaleDateString(atual, formato);
}

/** Texto da chave no idioma atual, com {variavel} substituída. */
export function t(chave: string, variaveis: Record<string, string | number> = {}): string {
  const bruto = TABELAS[atual][chave];
  if (bruto === undefined) {
    console.warn(`Texto ausente: ${chave} (${atual})`);
    return `⟦${chave}⟧`;
  }
  return bruto.replace(/\{(\w+)\}/g, (_, nome: string) => String(variaveis[nome] ?? `{${nome}}`));
}
