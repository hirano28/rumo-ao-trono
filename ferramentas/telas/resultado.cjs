// Tela de resultado: aprovado (2½ de 3) e reprovado (1 de 3), a partir de um
// progresso salvo, entrando pelo "Continuar". Confere também que voltar ao
// resultado depois de aprovado não recalcula a força.
// Uso: node resultado.cjs <url> <pasta-de-fotos>
const { chromium } = require("C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright");

const [url, pasta] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function progresso(resultados) {
  return {
    versao: 1, idioma: "pt-BR", modo: "carreira", capitulo: "cap1",
    resultados, forcas: { peteris: 800, grisha: 900, ozols: 1050 }, concluidos: [], vistos: ["jornal"],
  };
}

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(String(e)));
  const cena = () => pagina.evaluate(() => window.jogo.scene.getScenes(true).map((s) => s.scene.key).join(","));
  const esperarCena = async (nome) => {
    for (let i = 0; i < 60; i++) {
      if ((await cena()) === nome) return;
      await espera(200);
    }
    throw new Error(`cena ${nome} não chegou; está em ${await cena()}`);
  };
  const salvo = () => pagina.evaluate(() => JSON.parse(localStorage.getItem("rumo-ao-trono:progresso")));
  const saida = {};

  for (const [nome, resultados] of [["aprovado", { peteris: 1, grisha: 1, ozols: 0.5 }], ["reprovado", { peteris: 1, grisha: 0, ozols: 0 }]]) {
    await pagina.goto(url);
    await pagina.evaluate((p) => localStorage.setItem("rumo-ao-trono:progresso", JSON.stringify(p)), progresso(resultados));
    await pagina.reload();
    await esperarCena("Titulo");
    await espera(600);
    await pagina.mouse.click(640, 360); // Continuar
    await esperarCena("Local");
    await espera(900);
    await pagina.screenshot({ path: `${pasta}/20-parque-${nome}.png` });
    await pagina.mouse.click(640, 670); // O dia acabou
    await esperarCena("Resultado");
    await espera(1200);
    await pagina.screenshot({ path: `${pasta}/21-resultado-${nome}.png` });
    saida[nome] = await salvo();
  }

  // aprovado de novo, para ver que "Continuar" volta ao resultado sem recalcular
  await pagina.evaluate((p) => localStorage.setItem("rumo-ao-trono:progresso", JSON.stringify(p)), saida.aprovado);
  await pagina.reload();
  await esperarCena("Titulo");
  await espera(600);
  await pagina.mouse.click(640, 360);
  await esperarCena("Resultado");
  saida.revisita = await salvo();

  console.log(JSON.stringify({ ...saida, erros }, null, 2));
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
