// Esboço de cada personagem para o SDXL: o desenho SVG atual, grande, de pé,
// num fundo cinza claro liso (832×1216, o retrato do SDXL).
// Uso: node ferramentas/arte_ia/esbocos_personagens.cjs
const { chromium } = require("C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright");
const fs = require("fs");
const IDS = ["peteris", "grisha", "ozols", "marta", "kruzkops", "tal", "valdis", "ilze", "boris", "gipslis"];
(async () => {
  fs.mkdirSync("fotos/esbocos/personagens", { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 832, height: 1216 } });
  for (const id of IDS) {
    const arquivo = "data:image/svg+xml;base64," + fs.readFileSync(`public/arte/personagens/${id}.svg`).toString("base64");
    await p.setContent(`<body style="margin:0;background:#c9c4ba;width:832px;height:1216px;position:relative">
      <img src="${arquivo}" style="position:absolute;left:${416 - 1100 * 160 / 300 / 2}px;top:70px;height:1100px;width:${1100 * 160 / 300}px"></body>`);
    await p.waitForTimeout(300);
    await p.screenshot({ path: `fotos/esbocos/personagens/${id}.png` });
  }
  await b.close();
  console.log(IDS.length, "esboços de personagem");
})();
