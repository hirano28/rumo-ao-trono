import { describe, expect, it } from "vitest";
import { Relogio, ponteiros, tempoPorExtenso } from "../src/logica/relogio";

function relogioDeTeste() {
  let agora = 0;
  const relogio = new Relogio({ minutos: 10, incremento: 5, minutosDaHistoria: 120 }, () => agora);
  return { relogio, passar: (ms: number) => (agora += ms) };
}

describe("Relogio", () => {
  it("desconta só de quem está pensando e soma o incremento de quem jogou", () => {
    const { relogio, passar } = relogioDeTeste();
    relogio.iniciar("w");
    passar(30_000);
    relogio.apertar();
    expect(relogio.restanteMs("w")).toBe(600_000 - 30_000 + 5_000);
    passar(10_000);
    expect(relogio.restanteMs("b")).toBe(590_000);
    expect(relogio.restanteMs("w")).toBe(575_000);
  });

  it("converte para o tempo da história (10 min reais = 2 h)", () => {
    const { relogio, passar } = relogioDeTeste();
    relogio.iniciar("w");
    expect(relogio.minutosDaHistoria("w")).toBe(120);
    passar(300_000);
    expect(relogio.minutosDaHistoria("w")).toBe(60);
  });

  it("a bandeira cai quando o tempo acaba, e não fica negativo", () => {
    const { relogio, passar } = relogioDeTeste();
    relogio.iniciar("b");
    passar(700_000);
    expect(relogio.bandeira()).toBe("b");
    expect(relogio.restanteMs("b")).toBe(0);
  });

  it("parado, não desconta mais", () => {
    const { relogio, passar } = relogioDeTeste();
    relogio.iniciar("w");
    passar(1_000);
    relogio.parar();
    passar(60_000);
    expect(relogio.restanteMs("w")).toBe(599_000);
  });
});

describe("ponteiros", () => {
  it("com 2 horas restantes, marca 4:00; sem tempo, 6:00", () => {
    expect(ponteiros(120)).toEqual({ horas: 120, minutos: 0 });
    expect(ponteiros(0)).toEqual({ horas: 180, minutos: 0 });
  });

  it("com 1h45 restantes, marca 4:15", () => {
    const { horas, minutos } = ponteiros(105);
    expect(minutos).toBeCloseTo(90);
    expect(horas).toBeCloseTo(127.5);
  });
});

describe("tempoPorExtenso", () => {
  it.each([
    [120, "2h00"],
    [107.2, "1h48"],
    [59.5, "1h00"],
    [12.1, "13 min"],
  ])("%f minutos é %s", (minutos, texto) => {
    expect(tempoPorExtenso(minutos)).toBe(texto);
  });
});

describe("Relogio pausado (aba escondida)", () => {
  it("não desconta de ninguém enquanto pausado, e volta a contar ao retomar", () => {
    let agora = 0;
    const relogio = new Relogio({ minutos: 15, incremento: 0, minutosDaHistoria: 120 }, () => agora);
    relogio.iniciar("w");
    agora += 10_000;
    relogio.pausar();
    agora += 600_000;
    expect(relogio.restanteMs("w")).toBe(890_000);
    relogio.retomar();
    agora += 5_000;
    expect(relogio.restanteMs("w")).toBe(885_000);
  });

  it("depois de parado (fim da partida), retomar não religa", () => {
    let agora = 0;
    const relogio = new Relogio({ minutos: 15, incremento: 0, minutosDaHistoria: 120 }, () => agora);
    relogio.iniciar("w");
    relogio.parar();
    relogio.retomar();
    agora += 60_000;
    expect(relogio.restanteMs("w")).toBe(900_000);
  });
});

describe("Relogio antes de iniciar", () => {
  it("reexibir a aba antes do primeiro iniciar não põe o relógio para andar", () => {
    let agora = 0;
    const relogio = new Relogio({ minutos: 15, incremento: 0, minutosDaHistoria: 150 }, () => agora, { w: 60_000, b: 60_000 });
    relogio.pausar();
    relogio.retomar();
    agora += 5_000;
    expect(relogio.restanteMs("w")).toBe(60_000);
    expect(relogio.restanteMs("b")).toBe(60_000);
  });
});
