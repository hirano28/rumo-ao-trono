import { describe, expect, it } from "vitest";
import { capitulosLiberados, carregar, comecarCapitulo, normalizar, novoProgresso, salvar, type Armazenamento } from "../src/logica/progresso";

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

describe("comecarCapitulo", () => {
  it("sem jogo salvo, começa direto no capítulo escolhido, sem força", () => {
    const p = comecarCapitulo(undefined, "cap2", "en", "realista");
    expect(p.capitulo).toBe("cap2");
    expect(p.forca).toBeUndefined();
    expect(p.idioma).toBe("en");
    expect(p.modo).toBe("realista");
  });

  it("rejogar o capítulo 1 mantém a carreira e zera só as partidas dele", () => {
    const salvo = {
      ...novoProgresso("pt-BR", "carreira", "cap2"),
      forca: 1320,
      concluidos: ["cap1", "cap2"],
      resultados: { valdis: 1 as const },
      forcas: { valdis: 1220 },
      vistos: ["cap1:jornal"],
    };
    const p = comecarCapitulo(salvo, "cap1", "pt-BR", "carreira");
    expect(p.capitulo).toBe("cap1");
    expect(p.forca).toBe(1320);
    expect(p.concluidos).toEqual(["cap2"]);
    expect(p.resultados).toEqual({});
    expect(p.forcas).toEqual({});
    expect(p.vistos).toEqual(["cap1:jornal"]);
    expect(p.semente).not.toBe(salvo.semente);
  });
});

describe("capitulosLiberados", () => {
  const ordem = ["cap1", "cap2", "cap3"];

  it("sem jogo salvo, só o primeiro", () => {
    expect([...capitulosLiberados(ordem)]).toEqual(["cap1"]);
  });

  it("o capítulo 1 em andamento não libera o 2", () => {
    expect(capitulosLiberados(ordem, novoProgresso("pt-BR", "carreira", "cap1")).has("cap2")).toBe(false);
  });

  it("o capítulo 1 vencido libera o 2, e não o 3", () => {
    const salvo = { ...novoProgresso("pt-BR", "carreira", "cap2"), concluidos: ["cap1"] };
    const liberados = capitulosLiberados(ordem, salvo);
    expect(liberados.has("cap2")).toBe(true);
    expect(liberados.has("cap3")).toBe(false);
  });

  it("rejogando o 1 depois de vencer o 2, o 2 e o 3 continuam liberados", () => {
    const salvo = { ...novoProgresso("pt-BR", "carreira", "cap1"), concluidos: ["cap2"] };
    const liberados = capitulosLiberados(ordem, salvo);
    expect([...liberados].sort()).toEqual(["cap1", "cap2", "cap3"]);
  });
});

describe("resumos de rodada do torneio grande", () => {
  it("recomeçar o capítulo apaga as marcas de resumo dele e mantém o resto", () => {
    const p = { ...novoProgresso("pt-BR", "carreira", "cap4"), vistos: ["cap4:rodadas:6", "cap4:quadro", "cap3:rodadas:2"] };
    expect(comecarCapitulo(p, "cap4", "pt-BR", "carreira").vistos).toEqual(["cap4:quadro", "cap3:rodadas:2"]);
  });
});
