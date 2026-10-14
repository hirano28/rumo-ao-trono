import { describe, expect, it } from "vitest";
import { VOCE, classificacao, conferirRodadas, expectativa, jogoSimulado, jogosAte, sorteioFixo, type Rodadas } from "../src/logica/torneio";

const ADVERSARIOS = ["a", "b", "c", "d"];
// o jogador enfrenta a, b, c, d nas rodadas 1–4 e folga na 5
const RODADAS: Rodadas = [[["b", "c"]], [["a", "d"]], [["b", "d"]], [["a", "c"]], [["a", "b"], ["c", "d"]]];
const FORCAS = { a: 1200, b: 1250, c: 1300, d: 1400 };

describe("calendário", () => {
  it("o calendário de exemplo está certo", () => {
    expect(conferirRodadas(RODADAS, ADVERSARIOS)).toEqual([]);
  });

  it("acusa par repetido, par faltando e quem joga duas vezes na rodada", () => {
    const ruim: Rodadas = [[["b", "c"]], [["a", "d"]], [["b", "c"]], [["a", "c"]], [["a", "b"], ["a", "d"]]];
    const problemas = conferirRodadas(ruim, ADVERSARIOS);
    expect(problemas).toContain("b×c se enfrentam duas vezes");
    expect(problemas).toContain("b×d não se enfrentam");
    expect(problemas).toContain("rodada 5: a joga duas vezes");
  });

  it("acusa o rival do jogador jogando outro jogo na mesma rodada", () => {
    const ruim: Rodadas = [[["a", "c"]], [["a", "d"]], [["b", "d"]], [["b", "c"]], [["a", "b"], ["c", "d"]]];
    expect(conferirRodadas(ruim, ADVERSARIOS)).toContain("rodada 1: a joga duas vezes");
  });
});

describe("jogo simulado", () => {
  it("é sempre o mesmo para a mesma semente", () => {
    expect(jogoSimulado("s1", 1, "a", "b", 1200, 1300)).toBe(jogoSimulado("s1", 1, "a", "b", 1200, 1300));
  });

  it("o sorteio fixo fica entre 0 e 1 e varia com a chave", () => {
    const valores = Array.from({ length: 200 }, (_, i) => sorteioFixo(`k${i}`));
    expect(Math.min(...valores)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...valores)).toBeLessThan(1);
    expect(new Set(valores).size).toBe(200);
  });

  it("em muitos jogos, a média bate com a expectativa do Elo", () => {
    let soma = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) soma += jogoSimulado(`s${i}`, 1, "a", "b", 1500, 1300);
    expect(soma / n).toBeCloseTo(expectativa(1500, 1300), 1);
  });
});

describe("tabela", () => {
  it("só mostra as rodadas já jogadas e soma os pontos de todos", () => {
    const jogos = jogosAte(2, RODADAS, ADVERSARIOS, { a: 1, b: 0.5 }, FORCAS, "x");
    expect(jogos.filter((j) => j.brancas === VOCE)).toHaveLength(2);
    expect(jogos).toHaveLength(4);
    const tabela = classificacao([VOCE, ...ADVERSARIOS], jogos);
    expect(tabela.find((l) => l.id === VOCE)).toEqual({ id: VOCE, pontos: 1.5, jogos: 2 });
    expect(tabela.reduce((s, l) => s + l.pontos, 0)).toBe(4);
  });

  it("ordena por pontos e, empatado, quem jogou menos fica acima", () => {
    const tabela = classificacao(["p", "q", "r"], [
      { rodada: 1, brancas: "p", pretas: "q", pontos: 1 },
      { rodada: 2, brancas: "r", pretas: "q", pontos: 1 },
      { rodada: 3, brancas: "p", pretas: "r", pontos: 0.5 },
    ]);
    expect(tabela.map((l) => l.id)).toEqual(["p", "r", "q"]);
  });

  it("o jogador ainda sem resultado na rodada não entra na tabela dela", () => {
    const jogos = jogosAte(1, RODADAS, ADVERSARIOS, {}, FORCAS, "x");
    expect(jogos.every((j) => j.brancas !== VOCE)).toBe(true);
  });
});

describe("estabilidade do quadro", () => {
  it("com as forças de todos desde o começo, o jogo da rodada 1 é o mesmo no quadro e no fim", () => {
    const naRodada1 = jogosAte(1, RODADAS, ADVERSARIOS, { a: 1 }, FORCAS, "semente").find((j) => j.brancas === "b")!;
    const noFim = jogosAte(5, RODADAS, ADVERSARIOS, { a: 1, b: 0, c: 0.5, d: 1 }, FORCAS, "semente").find(
      (j) => j.rodada === 1 && j.brancas === "b",
    )!;
    expect(noFim.pontos).toBe(naRodada1.pontos);
  });
});
