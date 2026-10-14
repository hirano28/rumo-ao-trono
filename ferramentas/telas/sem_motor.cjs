// Motor que não carrega (arquivo bloqueado): a partida tem de seguir, com o
// adversário jogando um lance legal ao acaso. Uso: node sem_motor.cjs <url>
const { chromium } = require("C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const erros = [];
  p.on("pageerror", (e) => erros.push(String(e)));
  await p.route("**/motor/stockfish*", (rota) => rota.abort());
  await p.goto(process.argv[2]);
  await p.evaluate(() => localStorage.setItem("rumo-ao-trono:progresso", JSON.stringify({ versao: 1, idioma: "pt-BR", modo: "carreira", capitulo: "cap1", resultados: {}, forcas: {}, concluidos: [], vistos: [] })));
  await p.reload();
  await espera(1500);
  await p.mouse.click(640, 360); // Continuar
  await espera(1500);
  await p.mouse.click(640, 455); // Grigori, que abre de brancas
  await espera(700);
  await p.mouse.click(267, 662); // Vamos jogar
  let historico = [];
  for (let i = 0; i < 60 && historico.length === 0; i++) {
    await espera(250);
    historico = await p.evaluate(() => window.jogo.scene.getScene("Partida").partida?.history() ?? []);
  }
  const cena = await p.evaluate(() => window.jogo.scene.getScenes(true).map((c) => c.scene.key).join(","));
  await p.screenshot({ path: "fotos/pt/50-sem-motor.png" });
  console.log(JSON.stringify({ cena, historico, erros }));
  await b.close();
})();
