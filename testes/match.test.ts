import { describe, expect, it } from "vitest";
import {
  adversarioDaPartida,
  corNaPartida,
  idDaPartida,
  numeroDaPartida,
  partidasCompletas,
  partidasDoMatch,
  placarDoMatch,
} from "../src/logica/match";
import { VOCE } from "../src/logica/torneio";
import { maiorCategoria } from "../src/logica/forca";
import { comecarCapitulo, novoProgresso } from "../src/logica/progresso";

const MATCH = { titulo: "t", adversario: "saigin", partidas: 14 };
const AO_VIVO = [1, 5, 9, 14].map((n) => idDaPartida("saigin", n));
const FORCAS = { [VOCE]: 1800, saigin: 1900 };

describe("ids de partida do match", () => {
  it("separa adversário e número, e o id sem número continua o mesmo", () => {
    expect(idDaPartida("saigin", 3)).toBe("saigin@3");
    expect(adversarioDaPartida("saigin@3")).toBe("saigin");
    expect(numeroDaPartida("saigin@3")).toBe(3);
    expect(adversarioDaPartida("ozols")).toBe("ozols");
    expect(numeroDaPartida("ozols")).toBeUndefined();
  });

  it("as cores se alternam: a da ficha nas ímpares, a outra nas pares", () => {
    expect(corNaPartida("saigin@1", "brancas")).toBe("brancas");
    expect(corNaPartida("saigin@2", "brancas")).toBe("pretas");
    expect(corNaPartida("saigin@14", "pretas")).toBe("brancas");
    expect(corNaPartida("ozols", "pretas")).toBe("pretas");
  });
});

describe("andamento do match", () => {
  it("as partidas completas vão até a próxima ao vivo que falta", () => {
    expect(partidasCompletas(MATCH, AO_VIVO, {})).toBe(0);
    expect(partidasCompletas(MATCH, AO_VIVO, { "saigin@1": 1 })).toBe(4);
    expect(partidasCompletas(MATCH, AO_VIVO, { "saigin@1": 1, "saigin@5": 0, "saigin@9": 0.5, "saigin@14": 1 })).toBe(14);
  });

  it("as jogadas valem o resultado; as outras são simuladas, sempre iguais com a mesma semente", () => {
    const resultados = { "saigin@1": 1 as const, "saigin@5": 0.5 as const };
    const partidas = partidasDoMatch(MATCH, AO_VIVO, resultados, FORCAS, "s", 8);
    expect(partidas.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(partidas.filter((p) => !p.simulada).map((p) => [p.numero, p.pontos])).toEqual([[1, 1], [5, 0.5]]);
    expect(partidasDoMatch(MATCH, AO_VIVO, resultados, FORCAS, "s", 8)).toEqual(partidas);
  });

  it("partida ao vivo ainda não jogada não entra no placar", () => {
    const partidas = partidasDoMatch(MATCH, AO_VIVO, {}, FORCAS, "s", 14);
    expect(partidas.some((p) => p.numero === 5)).toBe(false);
  });

  it("o placar soma os pontos dos dois lados", () => {
    expect(placarDoMatch([{ numero: 1, pontos: 1, simulada: false }, { numero: 2, pontos: 0.5, simulada: true }])).toEqual({ voce: 1.5, ele: 0.5 });
  });
});

describe("título conquistado", () => {
  it("a conquista nunca é rebaixada pela força", () => {
    expect(maiorCategoria("primeira", "mestre")).toBe("mestre");
    expect(maiorCategoria("grande_mestre", "mestre")).toBe("grande_mestre");
    expect(maiorCategoria("segunda")).toBe("segunda");
  });

});

describe("resumos do match", () => {
  it("recomeçar o capítulo apaga as marcas de resumo de partida dele", () => {
    const p = { ...novoProgresso("pt-BR", "carreira", "cap5"), vistos: ["cap5:partidas:abc:3", "cap5:quadro"] };
    expect(comecarCapitulo(p, "cap5", "pt-BR", "carreira").vistos).toEqual(["cap5:quadro"]);
  });
});
