import { describe, expect, it } from "vitest";
import { calendarioCircular } from "../src/logica/calendario";
import { conferirRodadas } from "../src/logica/torneio";

const nomes = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);

describe("calendário circular", () => {
  it.each([3, 4, 5, 8, 19])("com %i adversários, todos se enfrentam uma vez e o jogador pega a ordem dada", (n) => {
    const ordem = nomes(n);
    const rodadas = calendarioCircular(ordem);
    expect(conferirRodadas(rodadas, ordem)).toEqual([]);
    expect(rodadas.length).toBe(n % 2 === 1 ? n : n + 1);
  });

  it("19 adversários: 19 rodadas de 9 jogos entre os outros", () => {
    const rodadas = calendarioCircular(nomes(19));
    expect(rodadas).toHaveLength(19);
    expect(rodadas.every((r) => r.length === 9)).toBe(true);
  });
});
