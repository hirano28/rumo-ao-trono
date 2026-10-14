// A regra das fontes (DESIGN.md §9) e a dos idiomas (§8): o conteúdo real da
// época tem de passar na conferência sem nenhum problema.
import { describe, expect, it } from "vitest";
import epoca from "../conteudo/epocas/riga-1950/epoca.json";
import adversarios from "../conteudo/epocas/riga-1950/adversarios.json";
import dialogos from "../conteudo/epocas/riga-1950/dialogos.json";
import noticias from "../conteudo/epocas/riga-1950/noticias.json";
import epocaPt from "../conteudo/epocas/riga-1950/textos.pt-BR.json";
import epocaEn from "../conteudo/epocas/riga-1950/textos.en.json";
import interfacePt from "../conteudo/interface/textos.pt-BR.json";
import interfaceEn from "../conteudo/interface/textos.en.json";
import { conferirConteudo, desafioCompleto, pontosDoDesafio, type ConteudoDaEpoca } from "../src/logica/conteudo";

const CONTEUDO = { epoca, adversarios, dialogos, noticias } as ConteudoDaEpoca;
const TEXTOS: Record<string, Record<string, string>> = {
  "pt-BR": { ...interfacePt, ...epocaPt },
  en: { ...interfaceEn, ...epocaEn },
};

describe("conteúdo da época Riga 1950", () => {
  it("passa na conferência sem nenhum problema", () => {
    expect(conferirConteudo(CONTEUDO, TEXTOS)).toEqual([]);
  });
});

describe("conferirConteudo", () => {
  it("acusa notícia sem fonte e de confiança baixa", () => {
    const ruim = structuredClone(CONTEUDO);
    ruim.noticias[0].fonte = "";
    ruim.noticias[1].confianca = "baixa";
    const problemas = conferirConteudo(ruim, TEXTOS);
    expect(problemas).toContain(`notícia ${ruim.noticias[0].id} sem fonte`);
    expect(problemas).toContain(`notícia ${ruim.noticias[1].id} com confiança baixa não entra no jogo`);
  });

  it("acusa texto que falta num idioma", () => {
    const semTitulo = { ...TEXTOS.en };
    delete semTitulo["cap1.titulo"];
    const problemas = conferirConteudo(CONTEUDO, { ...TEXTOS, en: semTitulo });
    expect(problemas).toContain("texto cap1.titulo ausente em en");
    expect(problemas).toContain("texto cap1.titulo existe em pt-BR e falta em en");
  });

  it("acusa chave fora do padrão num campo de texto", () => {
    const ruim = structuredClone(CONTEUDO);
    ruim.noticias[0].titulo = "not.N1950-errada.titulo";
    expect(conferirConteudo(ruim, TEXTOS)).toContain("texto not.N1950-errada.titulo ausente em pt-BR");
  });

  it("acusa referência quebrada", () => {
    const ruim = structuredClone(CONTEUDO);
    ruim.epoca.capitulos[0].desafio.adversarios.push("fantasma");
    ruim.dialogos.marta.nos.inicio.opcoes.push({ texto: "dlg.op.ate_logo", vai: "lugar_nenhum" });
    const problemas = conferirConteudo(ruim, TEXTOS);
    expect(problemas).toContain("desafio de cap1 cita adversário inexistente fantasma");
    expect(problemas).toContain("diálogo marta, nó inicio, vai para lugar_nenhum inexistente");
  });
});

describe("pontos do desafio", () => {
  it("soma meio ponto do empate e sabe quando acabou", () => {
    const ids = ["a", "b", "c"];
    expect(pontosDoDesafio({ a: 1, b: 0.5 }, ids)).toBe(1.5);
    expect(desafioCompleto({ a: 1, b: 0.5 }, ids)).toBe(false);
    expect(desafioCompleto({ a: 1, b: 0.5, c: 0 }, ids)).toBe(true);
  });
});
