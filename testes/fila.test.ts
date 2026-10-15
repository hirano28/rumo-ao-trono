import { describe, expect, it } from "vitest";
import { LIMITE_DA_FILA, enfileirar, gravarFila, lerFila, limparApelido } from "../src/logica/fila";
import type { Armazenamento } from "../src/logica/progresso";

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

describe("fila de registros pendentes", () => {
  it("guarda na ordem e lê de volta", () => {
    const m = memoria();
    enfileirar({ tabela: "partidas", linha: { a: 1 } }, m);
    enfileirar({ tabela: "desafios", linha: { b: 2 } }, m);
    expect(lerFila(m)).toEqual([
      { tabela: "partidas", linha: { a: 1 } },
      { tabela: "desafios", linha: { b: 2 } },
    ]);
  });

  it("não passa do limite: os mais antigos saem", () => {
    const m = memoria();
    gravarFila(
      Array.from({ length: LIMITE_DA_FILA + 5 }, (_, i) => ({ tabela: "partidas" as const, linha: { i } })),
      m,
    );
    const fila = lerFila(m);
    expect(fila).toHaveLength(LIMITE_DA_FILA);
    expect(fila[0].linha).toEqual({ i: 5 });
  });

  it("ignora dado estragado e tabela desconhecida", () => {
    const m = memoria();
    m.dados.set("rumo-ao-trono:pendentes", JSON.stringify([{ tabela: "jogadores", linha: {} }, { tabela: "partidas", linha: { ok: true } }, 7]));
    expect(lerFila(m)).toEqual([{ tabela: "partidas", linha: { ok: true } }]);
    m.dados.set("rumo-ao-trono:pendentes", "{quebrado");
    expect(lerFila(m)).toEqual([]);
    expect(lerFila(undefined)).toEqual([]);
  });
});

describe("limparApelido", () => {
  it.each([
    ["  Edson  ", "Edson"],
    ["Misha   Tal", "Misha Tal"],
    ["", undefined],
    ["    ", undefined],
    ["x".repeat(40), "x".repeat(30)],
  ])("%j vira %j", (entrada, saida) => {
    expect(limparApelido(entrada)).toBe(saida);
  });
});
