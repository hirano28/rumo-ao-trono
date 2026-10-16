// Gera os personagens ilustrados do jogo (SVG), no estilo da arte nova:
// traço escuro, cores chapadas com sombra lateral, roupa de época. Cada
// personagem sai em dois quadros: olhos abertos e olhos fechados (para
// piscar). Os pés ficam no pé da imagem: a cena posiciona pelo chão.
//
// Uso: node ferramentas/gerar_personagens.mjs   →   public/arte/personagens/*.svg
// Para mudar alguém, mude a ficha em PERSONAGENS e rode de novo.
import { mkdirSync, writeFileSync } from "node:fs";

const L = 160; // largura da imagem
const A = 300; // altura da imagem (pés em ~296)
const TRACO = "#2b2118";
const PELE = { clara: "#e3bf98", media: "#d2a57c", rosada: "#e8b99a" };

/** Ficha de cada personagem. idade: "crianca" | "jovem" | "adulto" | "idoso". */
const PERSONAGENS = {
  peteris: { idade: "crianca", pele: "rosada", cabelo: { estilo: "curto", cor: "#c79a52" }, chapeu: "bone", corChapeu: "#4a4a52",
    roupa: "jaqueta", corRoupa: "#5b6b8a", calca: "#3d3f4a", sapato: "#3a2718", cachecol: "#a5352b" },
  grisha: { idade: "idoso", pele: "media", cabelo: { estilo: "curto", cor: "#9a958c" }, chapeu: "quepe", corChapeu: "#2f3a4a",
    roupa: "uniforme", corRoupa: "#34404f", calca: "#2b333d", sapato: "#1f1712", bigode: "#b8b2a6", cachimbo: true },
  ozols: { idade: "idoso", pele: "clara", cabelo: { estilo: "calvo", cor: "#d6d2c8" }, chapeu: "chapeu", corChapeu: "#3a3530",
    roupa: "casaco", corRoupa: "#4a4744", calca: "#2e2c2a", sapato: "#1f1712", bigode: "#e0dcd2", oculos: true, corrente: true },
  marta: { idade: "adulto", pele: "rosada", cabelo: { estilo: "coque", cor: "#6b4a2e" }, chapeu: "lenco", corChapeu: "#7a3d2c",
    roupa: "vestido", corRoupa: "#5c4a63", meia: "#4a3b32", sapato: "#2b1d12", avental: "#d9cdb4", casaquinho: "#6f7d55" },
  kruzkops: { idade: "adulto", pele: "clara", cabelo: { estilo: "penteado", cor: "#5a4430" }, roupa: "terno", corRoupa: "#3b3f5c",
    calca: "#30334a", sapato: "#1f1712", gravata: "#7a2e27", oculos: true },
  tal: { idade: "jovem", pele: "media", cabelo: { estilo: "cacheado", cor: "#2a1d15" }, roupa: "sueter", corRoupa: "#6b2f25",
    calca: "#33302c", sapato: "#2b1d12", gola: "#efe4cc" },
  valdis: { idade: "crianca", pele: "rosada", cabelo: { estilo: "baguncado", cor: "#d8b26a" }, roupa: "colete", corRoupa: "#5b6b8a",
    calca: "#3d3f4a", sapato: "#3a2718", gola: "#f2ead8", pioneiro: true },
  ilze: { idade: "jovem", pele: "clara", cabelo: { estilo: "trancas", cor: "#b07a3e" }, roupa: "uniformeEscolar", corRoupa: "#6b4a2e",
    meia: "#3b2e26", sapato: "#2b1d12", avental: "#262321", laco: "#f2ead8", caderno: true },
  boris: { idade: "jovem", pele: "media", cabelo: { estilo: "penteado", cor: "#3a2a1e" }, roupa: "jaqueta", corRoupa: "#4d5a3a",
    calca: "#33302c", sapato: "#2b1d12", gola: "#efe4cc" },
  gipslis: { idade: "jovem", pele: "clara", cabelo: { estilo: "curto", cor: "#8a6a43" }, roupa: "sueter", corRoupa: "#5a4a3a",
    calca: "#30334a", sapato: "#2b1d12", gola: "#efe4cc" },
  // capítulo 3: o torneio de adultos (1952)
  arbitro: { idade: "idoso", pele: "clara", cabelo: { estilo: "calvo", cor: "#b8b2a6" }, roupa: "terno", corRoupa: "#4a4744",
    calca: "#33302c", sapato: "#1f1712", gravata: "#2b2b33", oculos: true, bigode: "#b8b2a6" },
  kalnins: { idade: "adulto", pele: "rosada", cabelo: { estilo: "penteado", cor: "#c9a868" }, roupa: "jaqueta", corRoupa: "#6b5a44",
    calca: "#3d3a34", sapato: "#2b1d12", gola: "#efe4cc", oculos: true },
  sokolov: { idade: "adulto", pele: "media", cabelo: { estilo: "curto", cor: "#8f8a80" }, roupa: "uniforme", corRoupa: "#56603f",
    calca: "#3c4230", sapato: "#1f1712", bigode: "#8f8a80" },
  zenta: { idade: "jovem", pele: "clara", cabelo: { estilo: "coque", cor: "#8a5a32" }, roupa: "vestido", corRoupa: "#34405a",
    meia: "#3b2e26", sapato: "#2b1d12", casaquinho: "#7d7468", avental: "#3d4a66", caderno: true },
  zilber: { idade: "jovem", pele: "media", cabelo: { estilo: "penteado", cor: "#231915" }, roupa: "jaqueta", corRoupa: "#3d3f48",
    calca: "#2b2b30", sapato: "#1f1712", gola: "#efe4cc" },
  // capítulo 4: a final do campeonato da Letônia (1953)
  koblencs: { idade: "adulto", pele: "clara", cabelo: { estilo: "penteado", cor: "#3a2a1e" }, roupa: "terno", corRoupa: "#2f3340",
    calca: "#262833", sapato: "#1f1712", gravata: "#5a2a2a" },
  klavins: { idade: "jovem", pele: "rosada", cabelo: { estilo: "curto", cor: "#b8935a" }, roupa: "sueter", corRoupa: "#3f5a4a",
    calca: "#33302c", sapato: "#2b1d12", gola: "#efe4cc", oculos: true },
  // capítulo 5: o examinador do match de mestre (1954)
  kalvaitis: { idade: "adulto", pele: "clara", cabelo: { estilo: "curto", cor: "#7a7268" }, roupa: "terno", corRoupa: "#5a4a3a",
    calca: "#3a3028", sapato: "#1f1712", gravata: "#2f3a4a", bigode: "#6a625a" },
};

/** Medidas do corpo por idade (a cena ainda escala pela altura da ficha). */
function medidas(idade) {
  const crianca = idade === "crianca";
  const jovem = idade === "jovem";
  return {
    cabeca: { cy: crianca ? 62 : jovem ? 56 : 52, rx: crianca ? 25 : 23, ry: crianca ? 28 : 26 },
    ombro: crianca ? 100 : jovem ? 92 : 88,
    cintura: crianca ? 190 : jovem ? 186 : 182,
    larguraOmbro: crianca ? 34 : jovem ? 36 : 40,
    curvado: idade === "idoso" ? 3 : 0,
  };
}

function rosto(f, m, piscando) {
  const { cy, rx, ry } = m.cabeca;
  const pele = PELE[f.pele];
  const partes = [];
  // orelhas, cabeça, bochechas
  partes.push(`<ellipse cx="${80 - rx}" cy="${cy + 4}" rx="5" ry="7" fill="${pele}" stroke="${TRACO}" stroke-width="1.5"/>`);
  partes.push(`<ellipse cx="${80 + rx}" cy="${cy + 4}" rx="5" ry="7" fill="${pele}" stroke="${TRACO}" stroke-width="1.5"/>`);
  partes.push(`<ellipse cx="80" cy="${cy}" rx="${rx}" ry="${ry}" fill="${pele}" stroke="${TRACO}" stroke-width="2"/>`);
  partes.push(`<path d="M${80 + rx * 0.2} ${cy - ry * 0.9} A${rx} ${ry} 0 0 1 ${80 + rx * 0.2} ${cy + ry * 0.9} A${rx * 0.7} ${ry} 0 0 0 ${80 + rx * 0.2} ${cy - ry * 0.9} Z" fill="#000" opacity="0.08"/>`);
  partes.push(`<ellipse cx="${80 - rx * 0.55}" cy="${cy + ry * 0.35}" rx="5" ry="3" fill="#d9786a" opacity="0.35"/>`);
  partes.push(`<ellipse cx="${80 + rx * 0.55}" cy="${cy + ry * 0.35}" rx="5" ry="3" fill="#d9786a" opacity="0.35"/>`);
  // olhos (ou pálpebras fechadas) e sobrancelhas
  const olhoY = cy + 2;
  for (const x of [80 - rx * 0.38, 80 + rx * 0.38]) {
    if (piscando) partes.push(`<path d="M${x - 3.5} ${olhoY} q3.5 2.5 7 0" stroke="${TRACO}" stroke-width="1.8" fill="none"/>`);
    else partes.push(`<ellipse cx="${x}" cy="${olhoY}" rx="2.4" ry="3" fill="${TRACO}"/><circle cx="${x + 0.8}" cy="${olhoY - 1}" r="0.8" fill="#fff"/>`);
    const corSobrancelha = f.idade === "idoso" ? (f.bigode ?? f.cabelo.cor) : f.cabelo.cor;
    partes.push(`<path d="M${x - 5} ${olhoY - 7} q5 -3 10 0" stroke="${corSobrancelha}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  }
  // nariz e boca
  partes.push(`<path d="M80 ${cy + 3} l-3 9 h5" stroke="${TRACO}" stroke-width="1.4" fill="none" opacity="0.7"/>`);
  if (f.idade === "idoso") {
    partes.push(`<path d="M${80 - rx * 0.62} ${cy - 2} q-3 6 0 12 M${80 + rx * 0.62} ${cy - 2} q3 6 0 12" stroke="${TRACO}" stroke-width="1" fill="none" opacity="0.35"/>`);
  }
  if (f.bigode) {
    partes.push(`<path d="M${80 - 11} ${cy + 15} q11 -8 22 0 q-4 6 -11 3 q-7 3 -11 -3 Z" fill="${f.bigode}" stroke="${TRACO}" stroke-width="1"/>`);
  } else {
    partes.push(`<path d="M${80 - 7} ${cy + 17} q7 5 14 0" stroke="${TRACO}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);
  }
  if (f.oculos) {
    for (const x of [80 - rx * 0.38, 80 + rx * 0.38]) partes.push(`<circle cx="${x}" cy="${olhoY}" r="6.5" fill="#cfe0e6" fill-opacity="0.25" stroke="${TRACO}" stroke-width="1.6"/>`);
    partes.push(`<path d="M${80 - rx * 0.38 + 6.5} ${olhoY} h${rx * 0.76 - 13}" stroke="${TRACO}" stroke-width="1.6"/>`);
  }
  if (f.cachimbo) {
    partes.push(`<path d="M${80 + 6} ${cy + 19} l14 4" stroke="#4a2f1b" stroke-width="3" stroke-linecap="round"/>`);
    partes.push(`<rect x="${80 + 18}" y="${cy + 14}" width="8" height="12" rx="2" fill="#5a3b22" stroke="${TRACO}" stroke-width="1"/>`);
  }
  return partes.join("");
}

function cabelo(f, m) {
  const { cy, rx, ry } = m.cabeca;
  const c = f.cabelo.cor;
  const topo = cy - ry;
  switch (f.cabelo.estilo) {
    case "calvo":
      return `<path d="M${80 - rx} ${cy - 2} q-2 -10 4 -14 M${80 + rx} ${cy - 2} q2 -10 -4 -14" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case "cacheado": {
      let bolas = "";
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        bolas += `<circle cx="${80 + Math.cos(a) * rx * 0.95}" cy="${cy - 4 + Math.sin(a) * ry * 0.92}" r="9" fill="${c}"/>`;
      }
      return `<path d="M${80 - rx - 2} ${cy} C${80 - rx} ${topo - 10} ${80 + rx} ${topo - 10} ${80 + rx + 2} ${cy} C${80 + rx - 6} ${cy - 16} ${80 - rx + 6} ${cy - 16} ${80 - rx - 2} ${cy} Z" fill="${c}"/>${bolas}`;
    }
    case "trancas":
      return `<path d="M${80 - rx - 1} ${cy + 2} C${80 - rx} ${topo - 8} ${80 + rx} ${topo - 8} ${80 + rx + 1} ${cy + 2} C${80 + rx - 8} ${cy - 18} ${80 - rx + 8} ${cy - 18} ${80 - rx - 1} ${cy + 2} Z" fill="${c}"/>
        <path d="M80 ${topo + 2} v14" stroke="#000" stroke-opacity="0.2" stroke-width="2"/>
        <path d="M${80 - rx + 2} ${cy + 6} q-6 22 -2 46" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="7 2"/>
        <path d="M${80 + rx - 2} ${cy + 6} q6 22 2 46" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="7 2"/>
        <path d="M${80 - rx - 6} ${cy + 50} l6 -5 l6 5 l-6 4 Z M${80 + rx - 6} ${cy + 50} l6 -5 l6 5 l-6 4 Z" fill="${f.laco ?? "#fff"}" stroke="${TRACO}" stroke-width="1"/>`;
    case "coque":
      return `<path d="M${80 - rx - 1} ${cy} C${80 - rx} ${topo - 8} ${80 + rx} ${topo - 8} ${80 + rx + 1} ${cy} C${80 + rx - 8} ${cy - 16} ${80 - rx + 8} ${cy - 16} ${80 - rx - 1} ${cy} Z" fill="${c}"/>`;
    case "baguncado":
      return `<path d="M${80 - rx - 2} ${cy - 2} C${80 - rx} ${topo - 12} ${80 + rx} ${topo - 12} ${80 + rx + 2} ${cy - 2} L${80 + rx - 6} ${cy - 12} L${80 + 6} ${cy - 18} L${80 - 4} ${cy - 10} L${80 - 14} ${cy - 18} L${80 - rx + 4} ${cy - 10} Z" fill="${c}"/>
        <path d="M${80 - 4} ${topo - 6} l-6 -6 M${80 + 6} ${topo - 6} l5 -7" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
    case "penteado":
      return `<path d="M${80 - rx - 1} ${cy - 2} C${80 - rx} ${topo - 10} ${80 + rx} ${topo - 10} ${80 + rx + 1} ${cy - 2} C${80 + rx - 4} ${cy - 14} ${80 - 4} ${cy - 20} ${80 - rx + 6} ${cy - 10} Z" fill="${c}"/>
        <path d="M${80 - 8} ${topo - 2} q16 -2 26 10" stroke="#000" stroke-opacity="0.2" stroke-width="1.6" fill="none"/>`;
    default:
      return `<path d="M${80 - rx - 1} ${cy - 2} C${80 - rx} ${topo - 9} ${80 + rx} ${topo - 9} ${80 + rx + 1} ${cy - 2} C${80 + rx - 8} ${cy - 14} ${80 - rx + 8} ${cy - 14} ${80 - rx - 1} ${cy - 2} Z" fill="${c}"/>`;
  }
}

function chapeu(f, m) {
  const { cy, rx, ry } = m.cabeca;
  const topo = cy - ry;
  const c = f.corChapeu;
  switch (f.chapeu) {
    case "bone":
      return `<path d="M${80 - rx - 3} ${topo + 14} C${80 - rx} ${topo - 6} ${80 + rx} ${topo - 6} ${80 + rx + 3} ${topo + 14} Z" fill="${c}" stroke="${TRACO}" stroke-width="1.6"/>
        <path d="M${80 - rx - 4} ${topo + 14} q${rx + 4} 9 ${2 * rx + 20} -2" stroke="${TRACO}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case "quepe":
      return `<path d="M${80 - rx - 2} ${topo + 12} L${80 - rx} ${topo - 4} L${80 + rx} ${topo - 4} L${80 + rx + 2} ${topo + 12} Z" fill="${c}" stroke="${TRACO}" stroke-width="1.6"/>
        <rect x="${80 - rx - 2}" y="${topo + 8}" width="${2 * rx + 4}" height="5" fill="#1d242e"/>
        <path d="M${80 - rx + 2} ${topo + 13} q${rx - 2} 10 ${2 * rx - 4} 0" fill="#151a21"/>
        <circle cx="80" cy="${topo + 3}" r="4" fill="#c9a35a" stroke="${TRACO}" stroke-width="1"/>`;
    case "chapeu":
      return `<ellipse cx="80" cy="${topo + 10}" rx="${rx + 14}" ry="6" fill="${c}" stroke="${TRACO}" stroke-width="1.6"/>
        <path d="M${80 - rx + 2} ${topo + 9} C${80 - rx + 2} ${topo - 18} ${80 + rx - 2} ${topo - 18} ${80 + rx - 2} ${topo + 9} Z" fill="${c}" stroke="${TRACO}" stroke-width="1.6"/>
        <path d="M80 ${topo - 10} v8" stroke="#000" stroke-opacity="0.3" stroke-width="3"/>
        <rect x="${80 - rx + 2}" y="${topo + 2}" width="${2 * rx - 4}" height="5" fill="#1f1b18"/>`;
    case "lenco":
      return `<path d="M${80 - rx - 4} ${cy + 6} C${80 - rx - 4} ${topo - 10} ${80 + rx + 4} ${topo - 10} ${80 + rx + 4} ${cy + 6} C${80 + rx - 2} ${cy - 8} ${80 - rx + 2} ${cy - 8} ${80 - rx - 4} ${cy + 6} Z" fill="${c}" stroke="${TRACO}" stroke-width="1.6"/>
        <path d="M${80 - rx - 2} ${cy + 6} l-6 16 l12 -6 Z" fill="${c}" stroke="${TRACO}" stroke-width="1.2"/>
        <g fill="#efe4cc" opacity="0.6"><circle cx="${80 - 8}" cy="${topo + 4}" r="2"/><circle cx="${80 + 6}" cy="${topo + 8}" r="2"/><circle cx="${80 + 16}" cy="${topo + 16}" r="2"/><circle cx="${80 - 16}" cy="${topo + 14}" r="2"/></g>`;
    default:
      return "";
  }
}

function corpo(f, m) {
  const ombro = m.ombro;
  const cintura = m.cintura;
  const lo = m.larguraOmbro;
  const partes = [];
  // sombra do lado direito, sempre dentro do contorno da roupa
  const sombraLateral = (topoX, topoY, baixoX, baixoY) =>
    `<path d="M${topoX} ${topoY} L${80 + lo} ${ombro + 8} L${baixoX} ${baixoY} L${topoX + (baixoX - 80 - lo) * 0.4 + 6} ${baixoY} Z" fill="#000" opacity="0.18"/>`;
  const comBarra = f.roupa === "casaco" || f.roupa === "vestido" || f.roupa === "uniformeEscolar";
  const barra = f.roupa === "casaco" ? 240 : f.roupa === "uniformeEscolar" ? 232 : f.roupa === "vestido" ? 246 : cintura + 12;

  // pernas: calça ou meias
  if (f.calca) {
    partes.push(`<path d="M${80 - 22} ${cintura} L${80 - 24} 284 L${80 - 4} 284 L${80 - 1} ${cintura + 18} L${80 + 1} ${cintura + 18} L${80 + 4} 284 L${80 + 24} 284 L${80 + 22} ${cintura} Z" fill="${f.calca}" stroke="${TRACO}" stroke-width="1.6"/>`);
    partes.push(`<path d="M${80 + 4} ${cintura + 18} L${80 + 6} 284 L${80 + 24} 284 L${80 + 22} ${cintura} Z" fill="#000" opacity="0.15"/>`);
  } else {
    partes.push(`<rect x="${80 - 18}" y="${barra - 6}" width="12" height="${284 - barra + 6}" fill="${f.meia}" stroke="${TRACO}" stroke-width="1.4"/>`);
    partes.push(`<rect x="${80 + 6}" y="${barra - 6}" width="12" height="${284 - barra + 6}" fill="${f.meia}" stroke="${TRACO}" stroke-width="1.4"/>`);
  }
  // sapatos
  partes.push(`<path d="M${80 - 30} 296 q0 -12 10 -13 h14 v13 Z" fill="${f.sapato}" stroke="${TRACO}" stroke-width="1.4"/>`);
  partes.push(`<path d="M${80 + 30} 296 q0 -12 -10 -13 h-14 v13 Z" fill="${f.sapato}" stroke="${TRACO}" stroke-width="1.4"/>`);

  // tronco (com barra comprida, se for casaco ou vestido)
  const baixo = comBarra ? barra : cintura + 12;
  const larguraBaixo = comBarra ? lo + 12 : lo + 2;
  partes.push(`<path d="M${80 - lo} ${ombro + 8} Q80 ${ombro - 6} ${80 + lo} ${ombro + 8} L${80 + larguraBaixo} ${baixo} L${80 - larguraBaixo} ${baixo} Z" fill="${f.corRoupa}" stroke="${TRACO}" stroke-width="2"/>`);
  partes.push(sombraLateral(80 + lo * 0.35, ombro + 4, 80 + larguraBaixo, baixo));

  // detalhes por tipo de roupa
  if (f.roupa === "casaco") {
    partes.push(`<path d="M80 ${ombro + 2} L${80 - 12} ${ombro + 40} L80 ${ombro + 50} L${80 + 12} ${ombro + 40} Z" fill="#000" opacity="0.2"/>`);
    partes.push(`<path d="M80 ${ombro + 48} V${baixo}" stroke="${TRACO}" stroke-width="1.4"/>`);
    for (let i = 0; i < 3; i++) partes.push(`<circle cx="${80 - 6}" cy="${ombro + 62 + i * 28}" r="2.6" fill="#1f1b18"/>`);
    if (f.corrente) partes.push(`<path d="M${80 - 14} ${ombro + 70} q12 10 24 0" stroke="#c9a35a" stroke-width="1.6" fill="none"/>`);
  }
  if (f.roupa === "uniforme") {
    partes.push(`<path d="M80 ${ombro + 2} V${baixo}" stroke="${TRACO}" stroke-width="1.4"/>`);
    for (let i = 0; i < 4; i++) partes.push(`<circle cx="${80 + 5}" cy="${ombro + 18 + i * 22}" r="2.8" fill="#c9a35a" stroke="${TRACO}" stroke-width="0.8"/>`);
    partes.push(`<rect x="${80 - lo + 4}" y="${ombro + 8}" width="12" height="5" fill="#c9a35a" opacity="0.8"/><rect x="${80 + lo - 16}" y="${ombro + 8}" width="12" height="5" fill="#c9a35a" opacity="0.8"/>`);
  }
  if (f.roupa === "terno") {
    partes.push(`<path d="M${80 - 12} ${ombro + 2} L80 ${ombro + 46} L${80 + 12} ${ombro + 2} Z" fill="#efe4cc" stroke="${TRACO}" stroke-width="1.2"/>`);
    partes.push(`<path d="M${80 - 3} ${ombro + 6} L80 ${ombro + 4} L${80 + 3} ${ombro + 6} L${80 + 4} ${ombro + 36} L80 ${ombro + 44} L${80 - 4} ${ombro + 36} Z" fill="${f.gravata}" stroke="${TRACO}" stroke-width="1"/>`);
    partes.push(`<path d="M${80 - 14} ${ombro + 2} L${80 - 4} ${ombro + 52} M${80 + 14} ${ombro + 2} L${80 + 4} ${ombro + 52}" stroke="${TRACO}" stroke-width="1.6"/>`);
    partes.push(`<rect x="${80 + 14}" y="${ombro + 22}" width="12" height="4" fill="#efe4cc" opacity="0.8"/>`);
  }
  if (f.roupa === "sueter" || f.roupa === "colete" || f.roupa === "jaqueta") {
    if (f.gola) partes.push(`<path d="M${80 - 12} ${ombro + 1} L80 ${ombro + 14} L${80 + 12} ${ombro + 1} L${80 + 6} ${ombro - 2} L80 ${ombro + 6} L${80 - 6} ${ombro - 2} Z" fill="${f.gola}" stroke="${TRACO}" stroke-width="1.2"/>`);
    partes.push(`<path d="M${80 - lo - 2} ${baixo - 6} H${80 + lo + 2}" stroke="#000" stroke-opacity="0.25" stroke-width="5"/>`);
    if (f.roupa === "jaqueta") partes.push(`<path d="M80 ${ombro + 12} V${baixo}" stroke="${TRACO}" stroke-width="1.4"/><circle cx="${80 - 5}" cy="${ombro + 40}" r="2.4" fill="#1f1b18"/><circle cx="${80 - 5}" cy="${ombro + 66}" r="2.4" fill="#1f1b18"/>`);
    if (f.roupa === "colete") partes.push(`<path d="M${80 - lo + 4} ${ombro + 10} L${80 - lo + 4} ${baixo} M${80 + lo - 4} ${ombro + 10} L${80 + lo - 4} ${baixo}" stroke="${f.gola}" stroke-width="7" opacity="0.9"/>`);
  }
  if (f.roupa === "vestido" || f.roupa === "uniformeEscolar") {
    if (f.casaquinho) partes.push(`<path d="M${80 - lo} ${ombro + 8} L${80 - lo + 2} ${cintura} L${80 - 14} ${cintura} L${80 - 10} ${ombro + 4} Z M${80 + lo} ${ombro + 8} L${80 + lo - 2} ${cintura} L${80 + 14} ${cintura} L${80 + 10} ${ombro + 4} Z" fill="${f.casaquinho}" stroke="${TRACO}" stroke-width="1.4"/>`);
    // avental: o branco da vendedora, o preto do uniforme escolar
    partes.push(`<path d="M${80 - 16} ${ombro + 30} H${80 + 16} L${80 + 22} ${baixo - 4} H${80 - 22} Z" fill="${f.avental}" stroke="${TRACO}" stroke-width="1.2"/>`);
    if (f.roupa === "uniformeEscolar") {
      partes.push(`<path d="M${80 - 16} ${ombro + 30} L${80 - 24} ${ombro + 4} M${80 + 16} ${ombro + 30} L${80 + 24} ${ombro + 4}" stroke="${f.avental}" stroke-width="5"/>`);
      partes.push(`<path d="M${80 - 9} ${ombro + 1} L80 ${ombro + 8} L${80 + 9} ${ombro + 1}" stroke="#f2ead8" stroke-width="4" fill="none"/>`);
    }
  }
  // braços e mãos
  const pele = PELE[f.pele];
  const mao = cintura + 8;
  partes.push(`<path d="M${80 - lo} ${ombro + 8} Q${80 - lo - 12} ${ombro + 50} ${80 - lo - 8} ${mao} L${80 - lo + 4} ${mao} Q${80 - lo} ${ombro + 50} ${80 - lo + 10} ${ombro + 16} Z" fill="${f.corRoupa}" stroke="${TRACO}" stroke-width="1.8"/>`);
  partes.push(`<path d="M${80 + lo} ${ombro + 8} Q${80 + lo + 12} ${ombro + 50} ${80 + lo + 8} ${mao} L${80 + lo - 4} ${mao} Q${80 + lo} ${ombro + 50} ${80 + lo - 10} ${ombro + 16} Z" fill="${f.corRoupa}" stroke="${TRACO}" stroke-width="1.8"/>`);
  partes.push(`<path d="M${80 + lo} ${ombro + 8} Q${80 + lo + 12} ${ombro + 50} ${80 + lo + 8} ${mao} L${80 + lo - 4} ${mao} Z" fill="#000" opacity="0.15"/>`);
  partes.push(`<circle cx="${80 - lo - 2}" cy="${mao + 5}" r="6.5" fill="${pele}" stroke="${TRACO}" stroke-width="1.4"/>`);
  partes.push(`<circle cx="${80 + lo + 2}" cy="${mao + 5}" r="6.5" fill="${pele}" stroke="${TRACO}" stroke-width="1.4"/>`);
  if (f.caderno) partes.push(`<rect x="${80 - lo - 14}" y="${mao - 22}" width="20" height="28" rx="2" fill="#2f4a3a" stroke="${TRACO}" stroke-width="1.2" transform="rotate(-8 ${80 - lo - 4} ${mao - 8})"/>`);
  // pescoço, cachecol e lenço de pioneiro
  partes.push(`<rect x="${80 - 7}" y="${m.cabeca.cy + m.cabeca.ry - 6}" width="14" height="${ombro - (m.cabeca.cy + m.cabeca.ry) + 10}" fill="${pele}" stroke="${TRACO}" stroke-width="1.4"/>`);
  if (f.cachecol) partes.push(`<path d="M${80 - 18} ${ombro - 2} Q80 ${ombro + 10} ${80 + 18} ${ombro - 2} L${80 + 18} ${ombro + 6} Q80 ${ombro + 18} ${80 - 18} ${ombro + 6} Z" fill="${f.cachecol}" stroke="${TRACO}" stroke-width="1.4"/><path d="M${80 + 8} ${ombro + 8} l4 34 l-10 0 Z" fill="${f.cachecol}" stroke="${TRACO}" stroke-width="1.2"/>`);
  if (f.pioneiro) partes.push(`<path d="M${80 - 14} ${ombro + 2} L${80 + 14} ${ombro + 2} L80 ${ombro + 18} Z" fill="#b8352b" stroke="${TRACO}" stroke-width="1.2"/><path d="M80 ${ombro + 14} l-6 22 M80 ${ombro + 14} l6 22" stroke="#b8352b" stroke-width="4"/>`);
  return partes.join("");
}

function desenhar(f, piscando) {
  const m = medidas(f.idade);
  const inclinacao = m.curvado ? `transform="rotate(${m.curvado} 80 290)"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}" viewBox="0 0 ${L} ${A}">
<g ${inclinacao}>${corpo(f, m)}${rosto(f, m, piscando)}${f.chapeu === "lenco" ? "" : cabelo(f, m)}${chapeu(f, m)}</g>
</svg>
`;
}

mkdirSync("public/arte/personagens", { recursive: true });
for (const [id, ficha] of Object.entries(PERSONAGENS)) {
  writeFileSync(`public/arte/personagens/${id}.svg`, desenhar(ficha, false));
  writeFileSync(`public/arte/personagens/${id}-piscando.svg`, desenhar(ficha, true));
}
console.log(Object.keys(PERSONAGENS).length, "personagens");
