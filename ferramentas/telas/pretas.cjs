// Partida de pretas contra o Grigori (tabuleiro virado, adversário abre) e a
// escolha de promoção. Uso: node pretas.cjs <url> <pasta-de-fotos>
const { chromium } = require("C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright");

const [url, pasta] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

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
  await pagina.goto(url);
  await pagina.evaluate(() =>
    localStorage.setItem(
      "rumo-ao-trono:progresso",
      JSON.stringify({ versao: 1, idioma: "pt-BR", modo: "carreira", capitulo: "cap1", resultados: {}, forcas: {}, concluidos: [], vistos: [] }),
    ),
  );
  await pagina.reload();
  await esperarCena("Titulo");
  await espera(600);
  await pagina.mouse.click(640, 335); // Continuar
  await esperarCena("Local");
  await espera(900);
  await pagina.mouse.click(640, 455); // Grigori
  await espera(600);
  await pagina.mouse.click(640, 662); // "Que história é essa da guerra?" (2ª de 3)
  await espera(500);
  await pagina.screenshot({ path: `${pasta}/30-grisha-guerra.png` });
  await pagina.mouse.click(452, 662); // Vamos jogar (1ª de 2)
  await esperarCena("Partida");
  // espera o primeiro lance das brancas (adversário)
  for (let i = 0; i < 50; i++) {
    const n = await pagina.evaluate(() => window.jogo.scene.getScene("Partida").partida.history().length);
    if (n > 0) break;
    await espera(200);
  }
  await espera(400);
  await pagina.screenshot({ path: `${pasta}/31-pretas-primeiro-lance.png` });

  // promoção: põe uma posição com peão preto em b2 e clica b2 → b1
  await pagina.evaluate(() => {
    const p = window.jogo.scene.getScene("Partida");
    p.partida.load("8/8/8/8/8/2k5/1p6/4K3 b - - 0 60");
    p.tabuleiro.liberar(true);
  });
  const casa = (nome) => {
    const c = "abcdefgh".indexOf(nome[0]);
    const f = Number(nome[1]);
    return [92 + (7 - c) * 72 + 36, 72 + (f - 1) * 72 + 36];
  };
  await pagina.mouse.click(...casa("b2"));
  await espera(200);
  await pagina.mouse.click(...casa("b1"));
  await espera(400);
  await pagina.screenshot({ path: `${pasta}/32-promocao.png` });
  await pagina.mouse.click(400, 108); // a dama, primeira da escolha
  await espera(1500);
  const promovido = await pagina.evaluate(() => {
    const p = window.jogo.scene.getScene("Partida");
    return { aberta: Boolean(p.tabuleiro.escolhaDePromocao), historico: p.partida.history() };
  });
  console.log(JSON.stringify({ promovido, erros }, null, 2));
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
