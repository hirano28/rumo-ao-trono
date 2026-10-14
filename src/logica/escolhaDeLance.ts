// Como o adversário da fase 1 escolhe o lance (DESIGN.md §5.4): o Stockfish
// analisa os melhores lances a uma profundidade que depende da força, e o
// lance sai de um sorteio que pesa a perda em centipeões contra uma
// "temperatura" — quanto mais fraco, mais quente e mais erro. Às vezes, um
// descuido puro: um lance legal qualquer.

export interface LinhaAnalise {
  /** Lance em UCI (ex.: "e2e4", "e7e8q"). */
  lance: string;
  /** Avaliação do ponto de vista de quem joga, em centipeões (mate já convertido). */
  cp: number;
}

export interface Perfil {
  temperatura: number;
  chanceDeDescuido: number;
  profundidade: number;
}

export type Sorteio = () => number;

// força → [temperatura em cp, chance de descuido, profundidade]
const TABELA: ReadonlyArray<[number, number, number, number]> = [
  [600, 300, 0.15, 1],
  [800, 220, 0.1, 2],
  [1000, 160, 0.07, 3],
  [1200, 120, 0.05, 4],
  [1500, 75, 0.03, 6],
  [1800, 45, 0.015, 8],
  [2100, 25, 0.007, 10],
  [2400, 14, 0.003, 12],
  [2700, 6, 0.001, 14],
];

export const LINHAS_ANALISADAS = 6;

export function perfilDaForca(forca: number): Perfil {
  const primeira = TABELA[0];
  const ultima = TABELA[TABELA.length - 1];
  if (forca <= primeira[0]) return perfil(primeira);
  if (forca >= ultima[0]) return perfil(ultima);
  for (let i = 1; i < TABELA.length; i++) {
    const [f1, t1, d1, p1] = TABELA[i];
    const [f0, t0, d0, p0] = TABELA[i - 1];
    if (forca <= f1) {
      const k = (forca - f0) / (f1 - f0);
      return {
        temperatura: t0 + k * (t1 - t0),
        chanceDeDescuido: d0 + k * (d1 - d0),
        profundidade: Math.round(p0 + k * (p1 - p0)),
      };
    }
  }
  return perfil(ultima);
}

function perfil([, temperatura, chanceDeDescuido, profundidade]: readonly number[]): Perfil {
  return { temperatura, chanceDeDescuido, profundidade };
}

/** Converte o placar UCI ("cp 35" ou "mate -3") em centipeões. */
export function centipeoes(tipo: "cp" | "mate", valor: number): number {
  if (tipo === "cp") return valor;
  const sinal = valor > 0 ? 1 : -1;
  return sinal * (10000 - Math.abs(valor) * 10);
}

export function escolherLance(
  linhas: readonly LinhaAnalise[],
  lancesLegais: readonly string[],
  perfil: Perfil,
  sorteio: Sorteio = Math.random,
): string {
  if (lancesLegais.length === 0) {
    throw new Error("Sem lance legal");
  }
  const validas = linhas.filter((l) => lancesLegais.includes(l.lance));
  if (validas.length === 0 || sorteio() < perfil.chanceDeDescuido) {
    return lancesLegais[Math.floor(sorteio() * lancesLegais.length)];
  }
  const melhor = Math.max(...validas.map((l) => l.cp));
  const pesos = validas.map((l) => Math.exp(-(melhor - l.cp) / perfil.temperatura));
  const total = pesos.reduce((a, b) => a + b, 0);
  let alvo = sorteio() * total;
  for (let i = 0; i < validas.length; i++) {
    alvo -= pesos[i];
    if (alvo <= 0) return validas[i].lance;
  }
  return validas[validas.length - 1].lance;
}
