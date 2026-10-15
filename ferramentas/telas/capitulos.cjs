// A tela de capítulos: (a) sem jogo salvo, o capítulo 2 está trancado e o
// clique não faz nada; (b) com a carreira no capítulo 2, rejoga o capítulo 1
// e o parque continua na força histórica (calibração).
// Uso: node ferramentas/telas/capitulos.cjs <url> <pasta-de-fotos>
const { chromium } = require("C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright");

const [url, pasta] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(String(e)));
  pagina.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  const cena = () => pagina.evaluate(() => window.jogo.scene.getScenes(true).map((s) => s.scene.key).join(","));
  const clicar = async (x, y, pausa = 400) => {
    await pagina.mouse.click(x, y);
    await espera(pausa);
  };
  const esperarCena = async (nome) => {
    for (let i = 0; i < 80; i++) {
      if ((await cena()) === nome) return;
      await espera(200);
    }
    throw new Error(`cena ${nome} não chegou; está em ${await cena()}`);
  };
  const pularAbertura = async () => {
    await esperarCena("Abertura");
    for (let i = 0; i < 10 && (await cena()) === "Abertura"; i++) await clicar(640, 500, 300);
  };
  const forcaNaPartida = () => pagina.evaluate(() => window.jogo.scene.getScene("Partida").forcaDoAdversario);
  const saida = {};

  // (a) sem jogo salvo: título → Capítulos → capítulo 2
  await pagina.goto(url);
  await pagina.evaluate(() => localStorage.clear());
  await pagina.reload();
  await esperarCena("Titulo");
  await espera(700);
  await pagina.screenshot({ path: `${pasta}/80-titulo-sem-salvo.png` });
  await clicar(640, 409); // Capítulos (Novo jogo em 345, Capítulos em 409)
  await esperarCena("Capitulos");
  await espera(500);
  await pagina.screenshot({ path: `${pasta}/81-capitulos-vazio.png` });
  await clicar(970, 330, 1000); // onde estaria o botão do capítulo 2, trancado
  saida.cap2Trancado = (await cena()) === "Capitulos";
  await clicar(130, 670); // voltar

  // (b) carreira no capítulo 2, com o 1 concluído: rejoga o capítulo 1
  await pagina.evaluate(() =>
    localStorage.setItem(
      "rumo-ao-trono:progresso",
      JSON.stringify({
        versao: 1, idioma: "pt-BR", modo: "carreira", capitulo: "cap2", forca: 1350,
        resultados: { valdis: 1 }, forcas: { valdis: 1250 }, concluidos: ["cap1"], vistos: [], semente: "s",
      }),
    ),
  );
  await pagina.reload();
  await esperarCena("Titulo");
  await espera(700);
  await pagina.screenshot({ path: `${pasta}/82-titulo-com-salvo.png` });
  await clicar(640, 463); // Capítulos (Continuar 335, Novo jogo 399, Capítulos 463)
  await esperarCena("Capitulos");
  await espera(500);
  await pagina.screenshot({ path: `${pasta}/83-capitulos-carreira.png` });
  await clicar(970, 190, 600); // Jogar de novo o capítulo 1
  await pularAbertura();
  await esperarCena("Quarto");
  await espera(800);
  await clicar(110, 430);
  await esperarCena("Local");
  await espera(900);
  await clicar(372, 500, 700); // Pēteris
  await clicar(532, 662, 500);
  await esperarCena("Partida");
  saida.peterisRejogado = await forcaNaPartida();
  saida.progresso = await pagina.evaluate(() => JSON.parse(localStorage.getItem("rumo-ao-trono:progresso")));

  console.log(JSON.stringify({ ...saida, erros }, null, 2));
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
