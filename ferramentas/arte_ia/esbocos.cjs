// Renderiza os SVGs de public/arte/ em PNG de 1344×768 (fotos/esbocos/), para
// servirem de esboço ao SDXL. Uso (com o servidor do jogo no ar):
//   node ferramentas/arte_ia/esbocos.cjs http://localhost:5180/ [cena ...]
const { chromium } = require("C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright");
const fs = require("fs");
const url = process.argv[2] ?? "http://localhost:5180/";
const CENAS = process.argv.slice(3).length ? process.argv.slice(3) : ["titulo", "quarto", "parque", "palacio", "clube", "mesa-parque", "mesa-palacio"];
(async () => {
  fs.mkdirSync("fotos/esbocos", { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1344, height: 768 } });
  for (const c of CENAS) {
    await p.setContent(`<body style="margin:0"><img src="${url}arte/${c}.svg" style="width:1344px;height:768px;display:block"></body>`);
    await p.waitForTimeout(500);
    await p.screenshot({ path: `fotos/esbocos/${c}.png` });
  }
  await b.close();
  console.log(CENAS.length, "esboços");
})();
