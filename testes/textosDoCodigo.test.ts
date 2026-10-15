// As chaves de texto que o código pede (t("…") e as famílias montadas por
// modelo, como `categoria.${c}`) têm de existir nos dois idiomas.
import { describe, expect, it } from "vitest";
import interfacePt from "../conteudo/interface/textos.pt-BR.json";
import interfaceEn from "../conteudo/interface/textos.en.json";
import { CATEGORIAS } from "../src/logica/forca";

const FONTES = import.meta.glob("../src/**/*.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const PREFIXOS = ["titulo", "abertura", "quarto", "comum", "local", "torneio", "partida", "resultado", "categoria", "capitulos", "apelido"];
const LITERAL = new RegExp(`"((?:${PREFIXOS.join("|")})[.][a-z0-9_.]+)"`, "g");

const literais = new Set(Object.values(FONTES).flatMap((fonte) => [...fonte.matchAll(LITERAL)].map((m) => m[1])));
const familias = [
  ...CATEGORIAS.map((c) => `categoria.${c}`),
  ...["carreira", "realista"].flatMap((m) => [`titulo.modo_${m}`, `titulo.modo_${m}_explicacao`]),
];

describe("textos pedidos pelo código", () => {
  it("acha as chaves literais do código", () => {
    expect(literais.size).toBeGreaterThan(20);
  });

  it.each([...literais, ...familias])("%s existe em pt-BR e en", (chave) => {
    expect(interfacePt).toHaveProperty([chave]);
    expect(interfaceEn).toHaveProperty([chave]);
  });
});
