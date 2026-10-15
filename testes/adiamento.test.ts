import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import {
  horaDeAdiar,
  normalizarAdiada,
  posicaoDaAdiada,
  posicaoParaAnalisar,
  rotuloDoLance,
  type PartidaAdiada,
} from "../src/logica/adiamento";
import { comecarCapitulo, normalizar, novoProgresso } from "../src/logica/progresso";
import { Relogio } from "../src/logica/relogio";

/** Lances ao acaso (sempre os mesmos) que não acabam a partida nem repetem posição. */
function partidaAte(lances: number): Chess {
  const partida = new Chess();
  let semente = 7;
  const sorteio = (n: number) => {
    semente = (semente * 1103515245 + 12345) % 2 ** 31;
    return semente % n;
  };
  while (partida.history().length < lances * 2) {
    const legais = partida.moves();
    const lance = legais[sorteio(legais.length)];
    partida.move(lance);
    if (partida.isGameOver()) partida.undo();
  }
  return partida;
}

const REGRA = { noLance: 40, minutosDaHistoria: 60 };

/** Um lance legal das brancas na posição do lance 41. */
const LANCE_41 = partidaAte(40).moves()[0];
/** Um lance que as brancas não podem fazer ali. */
const ILEGAL = "Ke8";

function envelope(selado = LANCE_41, quemSelou: "w" | "b" = "w"): PartidaAdiada {
  return {
    capitulo: "cap3",
    adversario: "zilber",
    lances: partidaAte(40).history(),
    selado,
    quemSelou,
    restanteMs: { w: 60_000, b: 90_000 },
  };
}

describe("hora de adiar", () => {
  it("adia depois do 40º lance das pretas, com a vez das brancas", () => {
    expect(horaDeAdiar(partidaAte(40), REGRA, false)).toBe(true);
    expect(horaDeAdiar(partidaAte(39), REGRA, false)).toBe(false);
    const meioLance = partidaAte(40);
    meioLance.move(LANCE_41);
    expect(horaDeAdiar(meioLance, REGRA, false)).toBe(false);
  });

  it("sem regra, ou numa partida já retomada, não adia", () => {
    expect(horaDeAdiar(partidaAte(40), undefined, false)).toBe(false);
    expect(horaDeAdiar(partidaAte(40), REGRA, true)).toBe(false);
  });

  it("partida terminada não se adia", () => {
    // mate do pastor no 4º lance; a regra pediria adiar no lance 4
    const mate = new Chess();
    for (const lance of ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"]) mate.move(lance);
    expect(horaDeAdiar(mate, { noLance: 4, minutosDaHistoria: 60 }, false)).toBe(false);
  });
});

describe("a posição do envelope", () => {
  it("o clube monta a posição de antes do lance secreto", () => {
    expect(posicaoDaAdiada(envelope()).fen()).toBe(partidaAte(40).fen());
  });

  it("quem selou analisa depois do próprio lance; quem não selou, a posição de antes", () => {
    expect(posicaoParaAnalisar(envelope(LANCE_41, "w"), "w").turn()).toBe("b");
    expect(posicaoParaAnalisar(envelope(LANCE_41, "w"), "b").fen()).toBe(partidaAte(40).fen());
  });

  it("o rótulo do lance traz o número, com reticências para as pretas", () => {
    expect(rotuloDoLance(41, "w", "Nf3")).toBe("41.Nf3");
    expect(rotuloDoLance(40, "b", "Kg7")).toBe("40...Kg7");
  });
});

describe("o envelope guardado", () => {
  it("um envelope válido volta igual", () => {
    expect(normalizarAdiada(JSON.parse(JSON.stringify(envelope())))).toEqual(envelope());
  });

  it("lance secreto ilegal, vez errada ou tempo estragado: o envelope é descartado", () => {
    expect(normalizarAdiada(envelope(ILEGAL))).toBeUndefined();
    expect(normalizarAdiada(envelope(LANCE_41, "b"))).toBeUndefined();
    expect(normalizarAdiada({ ...envelope(), restanteMs: { w: -1, b: 5 } })).toBeUndefined();
    expect(normalizarAdiada({ ...envelope(), lances: ["e4", "e4"] })).toBeUndefined();
    expect(normalizarAdiada("nada")).toBeUndefined();
  });

  it("o progresso guarda o envelope do capítulo em curso e descarta o de outro capítulo", () => {
    const p = { ...novoProgresso("pt-BR", "carreira", "cap3"), adiada: envelope() };
    expect(normalizar(JSON.parse(JSON.stringify(p)))?.adiada).toEqual(envelope());
    const outro = { ...p, capitulo: "cap4" };
    expect(normalizar(JSON.parse(JSON.stringify(outro)))?.adiada).toBeUndefined();
  });

  it("envelope de partida que já tem resultado não vale mais", () => {
    const p = { ...novoProgresso("pt-BR", "carreira", "cap3"), adiada: envelope(), resultados: { zilber: 1 } };
    expect(normalizar(JSON.parse(JSON.stringify(p)))?.adiada).toBeUndefined();
  });

  it("recomeçar o capítulo joga o envelope fora", () => {
    const p = { ...novoProgresso("pt-BR", "carreira", "cap3"), adiada: envelope() };
    expect(comecarCapitulo(p, "cap3", "pt-BR", "carreira").adiada).toBeUndefined();
  });
});

describe("o relógio na retomada", () => {
  it("volta com o tempo que restava e soma a hora a mais aos dois", () => {
    let agora = 0;
    // 20 minutos reais valem 2h30 da história: 1 hora da história = 8 minutos reais
    const relogio = new Relogio({ minutos: 20, incremento: 0, minutosDaHistoria: 150 }, () => agora, { w: 60_000, b: 90_000 });
    relogio.acrescentar(60);
    expect(relogio.restanteMs("w")).toBe(60_000 + 480_000);
    expect(relogio.restanteMs("b")).toBe(90_000 + 480_000);
    relogio.iniciar("b");
    agora += 10_000;
    expect(relogio.restanteMs("b")).toBe(560_000);
    expect(relogio.restanteMs("w")).toBe(540_000);
  });
});
