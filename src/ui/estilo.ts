// Paleta e tipografia dos anos 50: papel, tinta, sépia, verde-oliva.

export const LARGURA = 1280;
export const ALTURA = 720;

export const COR = {
  noite: 0x14110d,
  parede: 0x3b3226,
  madeira: 0x6b4a2f,
  madeiraEscura: 0x4a321f,
  papel: 0xefe4cc,
  papelSombra: 0xd9c9a6,
  tinta: 0x2b2118,
  sepia: 0x8a6a43,
  oliva: 0x4d5a3a,
  olivaClara: 0x6f7d55,
  dourado: 0xc9a35a,
  vermelho: 0x8e3b2e,
  casaClara: 0xe8d3a8,
  casaEscura: 0xa87a4f,
  luz: 0xffe2a0,
} as const;

/** A mesma cor em texto CSS, para o Phaser.Text. */
export function css(cor: number): string {
  return `#${cor.toString(16).padStart(6, "0")}`;
}

export const FONTE = {
  titulo: "'Playfair Display', Georgia, serif",
  corpo: "Lora, Georgia, serif",
  maquina: "'Special Elite', 'Courier New', monospace",
  /** Monoespaçada de verdade, para colunas (a Special Elite não é). */
  colunas: "'Courier Prime', 'Courier New', monospace",
} as const;

export const FONTES_A_CARREGAR = [
  "800 64px 'Playfair Display'",
  "600 32px 'Playfair Display'",
  "400 20px Lora",
  "600 20px Lora",
  "italic 400 20px Lora",
  "400 20px 'Special Elite'",
  "400 20px 'Courier Prime'",
];
