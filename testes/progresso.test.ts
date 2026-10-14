import { describe, expect, it } from "vitest";
import { carregar, normalizar, novoProgresso, salvar, type Armazenamento } from "../src/logica/progresso";

function memoria(): Armazenamento & { dados: Map<string, string> } {
  const dados = new Map<string, string>();
  return {
    dados,
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => {
      dados.set(chave, valor);
    },
  };
}

describe("progresso", () => {
  it("salva e carrega o mesmo progresso", () => {
    const armazenamento = memoria();
    const p = novoProgresso("en", "realista", "cap1");
    p.resultados.ozols = 0.5;
    salvar(p, armazenamento);
    expect(carregar(armazenamento)).toEqual(p);
  });

  it("sem armazenamento, com dado estragado ou bloqueado, não quebra", () => {
    expect(carregar(undefined)).toBeUndefined();
    const estragado = memoria();
    estragado.dados.set("rumo-ao-trono:progresso", "{não é json");
    expect(carregar(estragado)).toBeUndefined();
    const bloqueado: Armazenamento = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("cheio");
      },
    };
    expect(carregar(bloqueado)).toBeUndefined();
    expect(() => salvar(novoProgresso("pt-BR", "carreira", "cap1"), bloqueado)).not.toThrow();
  });
});

describe("normalizar", () => {
  it("completa salvo antigo sem os campos novos", () => {
    const antigo = { versao: 1, idioma: "en", modo: "carreira", capitulo: "cap1", resultados: { ozols: 1 }, vistos: ["jornal"] };
    const p = normalizar(antigo)!;
    expect(p.forcas).toEqual({});
    expect(p.concluidos).toEqual([]);
    expect(p.resultados).toEqual({ ozols: 1 });
    expect(p.idioma).toBe("en");
  });

  it("troca o que veio com tipo errado pelo valor de jogo novo", () => {
    const p = normalizar({
      versao: 1,
      idioma: "klingon",
      modo: 7,
      capitulo: "cap1",
      forca: "muita",
      resultados: { a: 2, b: 0.5, c: "1" },
      forcas: { a: 900, b: null },
      concluidos: "cap1",
      vistos: [1, "jornal"],
    })!;
    expect(p).toEqual({
      versao: 1,
      idioma: "pt-BR",
      modo: "carreira",
      capitulo: "cap1",
      resultados: { b: 0.5 },
      forcas: { a: 900 },
      concluidos: [],
      vistos: ["cap1:jornal"],
      semente: expect.any(String),
    });
  });

  it("salvo de antes dos capítulos: os vistos ganham o prefixo do capítulo 1", () => {
    expect(normalizar({ versao: 1, capitulo: "cap1", vistos: ["jornal", "cap2:quadro"] })!.vistos).toEqual(["cap1:jornal", "cap2:quadro"]);
  });

  it("guarda a semente do torneio, ou cria uma se faltar", () => {
    expect(normalizar({ versao: 1, capitulo: "cap2", semente: "abc123" })!.semente).toBe("abc123");
    expect(normalizar({ versao: 1, capitulo: "cap2" })!.semente).toMatch(/^[a-z0-9]+$/);
  });

  it("sem versão 1 ou sem capítulo, não aproveita nada", () => {
    expect(normalizar({ versao: 2, capitulo: "cap1" })).toBeUndefined();
    expect(normalizar({ versao: 1 })).toBeUndefined();
    expect(normalizar(null)).toBeUndefined();
    expect(normalizar("texto")).toBeUndefined();
  });
});
