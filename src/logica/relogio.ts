// O relógio de xadrez (DESIGN.md §6). A partida corre no tempo real (ex.:
// 10 minutos + 5 s por lance), mas a tela mostra o tempo da história (ex.:
// 2 horas), como num relógio mecânico da época: os ponteiros andam até as
// 6 horas, quando a bandeira cai.

export interface ControleDeTempo {
  /** Minutos reais de cada jogador. */
  minutos: number;
  /** Segundos reais somados a cada lance feito. */
  incremento: number;
  /** Quanto esse tempo vale na história, em minutos (ex.: 120). */
  minutosDaHistoria: number;
}

export type Lado = "w" | "b";

export class Relogio {
  private readonly restante: Record<Lado, number>;
  private vez: Lado = "w";
  private desde?: number;
  private parado = false;
  /** Antes do primeiro `iniciar`, nada anda (nem ao reexibir a aba). */
  private iniciado = false;

  constructor(
    private readonly controle: ControleDeTempo,
    private readonly agora: () => number = () => performance.now(),
    /** Na retomada de uma partida adiada: o que restava a cada um. */
    restante?: Record<Lado, number>,
  ) {
    const ms = controle.minutos * 60_000;
    this.restante = restante ? { ...restante } : { w: ms, b: ms };
  }

  /** Tempo da história somado aos dois lados (a hora a mais da retomada). */
  acrescentar(minutosDaHistoria: number): void {
    const ms = (minutosDaHistoria * this.controle.minutos * 60_000) / this.controle.minutosDaHistoria;
    this.restante.w += ms;
    this.restante.b += ms;
  }

  /** Começa a contar para quem joga (o relógio é apertado no primeiro lance). */
  iniciar(vez: Lado): void {
    this.iniciado = true;
    this.vez = vez;
    this.desde = this.agora();
  }

  /** Quem jogou aperta o relógio: ganha o incremento, e passa a contar para o outro. */
  apertar(): void {
    this.descontar();
    this.restante[this.vez] += this.controle.incremento * 1000;
    this.vez = this.vez === "w" ? "b" : "w";
  }

  parar(): void {
    this.descontar();
    this.desde = undefined;
    this.parado = true;
  }

  /** Aba escondida: o jogo para (e o adversário com ele), e o relógio também. */
  pausar(): void {
    this.descontar();
    this.desde = undefined;
  }

  retomar(): void {
    if (this.iniciado && !this.parado && this.desde === undefined) this.desde = this.agora();
  }

  /** Milissegundos reais que restam a um lado, sem passar de zero. */
  restanteMs(lado: Lado): number {
    const corrente = lado === this.vez && this.desde !== undefined ? this.agora() - this.desde : 0;
    return Math.max(0, this.restante[lado] - corrente);
  }

  /** A bandeira de quem caiu, se caiu. */
  bandeira(): Lado | undefined {
    if (this.restanteMs("w") === 0) return "w";
    if (this.restanteMs("b") === 0) return "b";
    return undefined;
  }

  /** Minutos que restam, no tempo da história. */
  minutosDaHistoria(lado: Lado): number {
    const fator = this.controle.minutosDaHistoria / this.controle.minutos;
    return (this.restanteMs(lado) / 60_000) * fator;
  }

  private descontar(): void {
    if (this.desde === undefined) return;
    const instante = this.agora();
    this.restante[this.vez] = Math.max(0, this.restante[this.vez] - (instante - this.desde));
    this.desde = instante;
  }
}

/**
 * Ângulo dos ponteiros (em graus, 0 = 12 horas, sentido horário) para um
 * tempo restante: o relógio mecânico marca 6:00 quando o tempo acaba.
 */
export function ponteiros(minutosRestantes: number): { horas: number; minutos: number } {
  const marca = 6 * 60 - minutosRestantes; // minutos depois da meia-noite no mostrador
  const noMostrador = ((marca % 720) + 720) % 720;
  return { horas: (noMostrador / 720) * 360, minutos: ((noMostrador % 60) / 60) * 360 };
}

/** "1h47" ou "12 min", para ler o relógio sem precisar dos ponteiros. */
export function tempoPorExtenso(minutos: number): string {
  const inteiros = Math.ceil(minutos);
  if (inteiros < 60) return `${inteiros} min`;
  return `${Math.floor(inteiros / 60)}h${String(inteiros % 60).padStart(2, "0")}`;
}
