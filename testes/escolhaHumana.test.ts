import { describe, expect, it } from "vitest";
import { escolherLanceHumano, perfilHumano } from "../src/logica/escolhaHumana";

function sorteioFixo(semente = 42): () => number {
  let estado = semente;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 2 ** 32;
    return estado / 2 ** 32;
  };
}

/** Política da posição inicial segundo o Maia 1100 (lc0, testes/referencia_maia.json), arredondada. */
const INICIAL = new Map([
  ["e2e4", 0.66],
  ["d2d4", 0.21],
  ["e2e3", 0.03],
  ["g1f3", 0.024],
  ["c2c4", 0.02],
  ["b1c3", 0.015],
  ["d2d3", 0.012],
  ["h2h4", 0.003],
  ["a2a4", 0.003],
  ["g2g4", 0.003],
]);

function frequencias(temperatura: number): Map<string, number> {
  const sorteio = sorteioFixo();
  const contagem = new Map<string, number>();
  for (let i = 0; i < 4000; i++) {
    const lance = escolherLanceHumano(INICIAL, temperatura, sorteio);
    contagem.set(lance, (contagem.get(lance) ?? 0) + 1 / 4000);
  }
  return contagem;
}

describe("perfilHumano", () => {
  it.each([
    [800, 1100, 1.6],
    [1050, 1100, 1.1],
    [1100, 1100, 1],
    [1250, 1300, 1],
    [1480, 1500, 1],
    [1900, 1900, 1],
    [2000, 1900, 1],
  ])("força %i usa a rede %i com temperatura %f", (forca, nivel, temperatura) => {
    const perfil = perfilHumano(forca);
    expect(perfil.nivel).toBe(nivel);
    expect(perfil.temperatura).toBeCloseTo(temperatura);
  });

  it("a temperatura não passa de 2, por mais fraco que seja", () => {
    expect(perfilHumano(0).temperatura).toBe(2);
  });
});

describe("escolherLanceHumano", () => {
  it("na temperatura 1, joga na proporção da rede", () => {
    const f = frequencias(1);
    expect(f.get("e2e4")).toBeCloseTo(0.68, 1);
    expect(f.get("d2d4")).toBeCloseTo(0.22, 1);
  });

  it("o núcleo corta a cauda: lance que quase ninguém joga não sai", () => {
    const f = frequencias(1);
    for (const raro of ["h2h4", "a2a4", "g2g4"]) expect(f.get(raro) ?? 0).toBe(0);
  });

  it("esquentada, espalha mais (o fraco erra mais), mas ainda prefere o lance humano", () => {
    const fria = frequencias(1);
    const quente = frequencias(1.6);
    expect(quente.get("e2e4")!).toBeLessThan(fria.get("e2e4")!);
    expect(quente.get("e2e4")!).toBeGreaterThan(0.4);
  });

  it("recusa posição sem lance", () => {
    expect(() => escolherLanceHumano(new Map(), 1)).toThrow();
  });
});
