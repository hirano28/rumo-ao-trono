import { describe, expect, it } from "vitest";
import { centipeoes, escolherLance, perfilDaForca } from "../src/logica/escolhaDeLance";
import { lerAnalise } from "../src/logica/uci";

/** Sorteio previsível (gerador linear congruente) para medir frequências. */
function sorteioFixo(semente = 42): () => number {
  let estado = semente;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 2 ** 32;
    return estado / 2 ** 32;
  };
}

const LINHAS = [
  { lance: "e2e4", cp: 30 },
  { lance: "d2d4", cp: 20 },
  { lance: "g1f3", cp: -60 },
  { lance: "a2a4", cp: -300 },
];
const LEGAIS = ["e2e4", "d2d4", "g1f3", "a2a4", "h2h4"];

function frequencia(forca: number, lance: string, semente = 42): number {
  const sorteio = sorteioFixo(semente);
  const perfil = perfilDaForca(forca);
  let vezes = 0;
  for (let i = 0; i < 2000; i++) if (escolherLance(LINHAS, LEGAIS, perfil, sorteio) === lance) vezes++;
  return vezes / 2000;
}

describe("perfilDaForca", () => {
  it("quanto mais forte, mais frio, mais fundo e menos descuidado", () => {
    const fraco = perfilDaForca(800);
    const forte = perfilDaForca(2400);
    expect(forte.temperatura).toBeLessThan(fraco.temperatura);
    expect(forte.profundidade).toBeGreaterThan(fraco.profundidade);
    expect(forte.chanceDeDescuido).toBeLessThan(fraco.chanceDeDescuido);
  });

  it("interpola entre as faixas da tabela", () => {
    const p = perfilDaForca(900);
    expect(p.temperatura).toBeCloseTo(190);
    expect(p.chanceDeDescuido).toBeCloseTo(0.085);
  });

  it("fica nos extremos fora da tabela", () => {
    expect(perfilDaForca(100)).toEqual(perfilDaForca(600));
    expect(perfilDaForca(3500)).toEqual(perfilDaForca(2700));
  });
});

describe("escolherLance", () => {
  it("o forte quase sempre joga o melhor; o fraco, bem menos", () => {
    const forte = frequencia(2700, "e2e4");
    const fraco = frequencia(800, "e2e4");
    expect(forte).toBeGreaterThan(0.6);
    expect(fraco).toBeLessThan(forte - 0.25);
  });

  it("o lance que perde 330 cp quase nunca sai para o forte, e sai às vezes para o fraco", () => {
    expect(frequencia(2700, "a2a4", 7)).toBeLessThan(0.01);
    expect(frequencia(800, "a2a4", 7)).toBeGreaterThan(0.05);
  });

  it("só devolve lance legal, mesmo com análise que cita lance ilegal", () => {
    const sorteio = sorteioFixo(3);
    const perfil = perfilDaForca(1000);
    for (let i = 0; i < 500; i++) {
      expect(LEGAIS).toContain(escolherLance([{ lance: "e1g1", cp: 900 }, ...LINHAS], LEGAIS, perfil, sorteio));
    }
  });

  it("sem análise, sorteia entre os legais", () => {
    expect(LEGAIS).toContain(escolherLance([], LEGAIS, perfilDaForca(1500), sorteioFixo()));
  });

  it("recusa posição sem lance legal", () => {
    expect(() => escolherLance(LINHAS, [], perfilDaForca(1500))).toThrow();
  });
});

describe("leitura UCI", () => {
  it("converte mate em centipeões com sinal", () => {
    expect(centipeoes("mate", 3)).toBe(9970);
    expect(centipeoes("mate", -2)).toBe(-9980);
    expect(centipeoes("cp", -45)).toBe(-45);
  });

  it("fica com a profundidade mais alta de cada multipv e ignora placar parcial", () => {
    const saida = [
      "info depth 1 seldepth 1 multipv 1 score cp 20 nodes 20 nps 10000 time 2 pv d2d4",
      "info depth 1 seldepth 1 multipv 2 score cp 10 nodes 40 nps 10000 time 2 pv e2e4",
      "info depth 2 seldepth 2 multipv 1 score cp 35 lowerbound nodes 90 nps 10000 time 3 pv e2e4",
      "info depth 2 seldepth 3 multipv 1 score cp 31 nodes 120 nps 10000 time 3 pv e2e4 e7e5",
      "info depth 2 seldepth 3 multipv 2 score mate -4 nodes 150 nps 10000 time 3 pv f2f3 e7e5",
      "info depth 1 seldepth 1 multipv 3 score cp -5 nodes 160 nps 10000 time 3 pv a7a8q",
      "bestmove e2e4 ponder e7e5",
    ];
    expect(lerAnalise(saida)).toEqual([
      { lance: "e2e4", cp: 31 },
      { lance: "f2f3", cp: -9960 },
      { lance: "a7a8q", cp: -5 },
    ]);
  });
});
