import { describe, expect, it } from "vitest";
import { categoriaDa, forcaNoTabuleiro, performance } from "../src/logica/forca";

describe("performance", () => {
  const desafio = [800, 900, 1050];

  it("três vitórias valem a média mais 400", () => {
    const r = performance(desafio.map((f) => ({ forcaAdversario: f, pontos: 1 as const })));
    expect(r).toBe(Math.round((800 + 900 + 1050) / 3 + 400));
  });

  it("três derrotas valem a média menos 400", () => {
    const r = performance(desafio.map((f) => ({ forcaAdversario: f, pontos: 0 as const })));
    expect(r).toBe(Math.round(2750 / 3 - 400));
  });

  it("empates não mexem na média", () => {
    const r = performance(desafio.map((f) => ({ forcaAdversario: f, pontos: 0.5 as const })));
    expect(r).toBe(Math.round(2750 / 3));
  });

  it("um desafio ruim não derruba mais de 100 da força anterior", () => {
    expect(performance([{ forcaAdversario: 1500, pontos: 0 }], 1600)).toBe(1500);
  });

  it("recusa desafio sem partidas", () => {
    expect(() => performance([])).toThrow();
  });
});

describe("categoriaDa", () => {
  it.each([
    [700, "iniciante"],
    [1149, "iniciante"],
    [1150, "terceira"],
    [1600, "segunda"],
    [1900, "primeira"],
    [2100, "candidato_a_mestre"],
    [2300, "mestre"],
    [2700, "grande_mestre"],
  ])("força %i é %s", (forca, categoria) => {
    expect(categoriaDa(forca)).toBe(categoria);
  });
});

describe("forcaNoTabuleiro", () => {
  const tal = { forcaHistorica: 2700, degrau: 150 };

  it("no realista vale a força histórica", () => {
    expect(forcaNoTabuleiro("realista", tal, 1600)).toBe(2700);
  });

  it("na carreira vale a força do jogador mais o degrau", () => {
    expect(forcaNoTabuleiro("carreira", tal, 1600)).toBe(1750);
  });

  it("sem força do jogador (primeiro desafio) vale a histórica", () => {
    expect(forcaNoTabuleiro("carreira", tal)).toBe(2700);
  });
});
