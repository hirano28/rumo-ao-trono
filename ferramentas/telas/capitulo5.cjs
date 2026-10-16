// Percurso do capítulo 5 (o match de mestre): entra na sala, conversa com o
// Misha, abre o placar, joga a partida 1 (abandono), vê o resumo das partidas
// 2 e 3 (simuladas), pede a seguinte ao examinador e confere a cor da partida
// 4 (as cores se alternam); depois, por atalho, completa as partidas ao vivo e
// confere o resultado com o título de mestre.
// Uso: node ferramentas/telas/capitulo5.cjs <url> <pasta-de-fotos>
const { chromium } = require("C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright");

const [url, pasta] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
  // sem a pergunta do apelido (a conta tem o seu próprio percurso, conta.cjs)
  await pagina.addInitScript(() => localStorage.setItem("rumo-ao-trono:sem-conta", "1"));
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(String(e)));
  pagina.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  const foto = (nome) => pagina.screenshot({ path: `${pasta}/${nome}.png` });
  const cena = () => pagina.evaluate(() => window.jogo.scene.getScenes(true).map((s) => s.scene.key).join(","));
  const clicar = async (x, y, pausa = 400) => {
    await pagina.mouse.click(x, y);
    await espera(pausa);
  };
  const esperarCena = async (nome) => {
    for (let i = 0; i < 100; i++) {
      if ((await cena()) === nome) return;
      await espera(200);
    }
    throw new Error(`cena ${nome} não chegou; está em ${await cena()}`);
  };
  const progresso = () => pagina.evaluate(() => JSON.parse(localStorage.getItem("rumo-ao-trono:progresso")));
  const gravar = (p) => pagina.evaluate((v) => localStorage.setItem("rumo-ao-trono:progresso", JSON.stringify(v)), p);
  const textoSobre = () =>
    pagina.evaluate(() =>
      window.jogo.scene
        .getScene("Local")
        .children.list.filter((o) => o.type === "Text" && o.depth >= 100)
        .map((o) => o.text)
        .join(" | "),
    );
  const placar = () =>
    pagina.evaluate(() =>
      window.jogo.scene.getScene("Local").children.list.filter((o) => o.type === "Text" && o.text.startsWith("Match")).map((o) => o.text),
    );
  const continuar = async () => {
    await pagina.reload();
    await esperarCena("Titulo");
    await espera(700);
    await clicar(640, 335); // Continuar
    await esperarCena("Local");
    await espera(1800);
  };
  const abandonar = async () => {
    await clicar(1000, 630, 400);
    await clicar(520, 410, 800);
    await clicar(640, 432, 300); // levantar da mesa
    await esperarCena("Local");
    await espera(1800);
  };
  const saida = {};

  await pagina.goto(url);
  await gravar({
    versao: 1, idioma: "pt-BR", modo: "carreira", capitulo: "cap5", forca: 1750,
    resultados: {}, forcas: {}, concluidos: ["cap1", "cap2", "cap3", "cap4"], vistos: [], semente: "teste",
  });
  await continuar();
  await foto("150-sala-do-match");
  saida.placarInicio = await placar();
  await clicar(610, 540, 700); // Misha
  await clicar(397, 662, 500); // como está o seu match
  await foto("151-tal-saigin");
  await clicar(908, 662, 500);
  await clicar(660, 180, 800); // placar do match
  await foto("152-placar-vazio");
  await clicar(640, 620, 500);

  // partida 1
  await clicar(820, 540, 700);
  await foto("153-kalvaitis");
  await clicar(397, 662, 500); // partida de hoje (1ª de 3)
  await esperarCena("Partida");
  await espera(2500);
  saida.cor1 = await pagina.evaluate(() => window.jogo.scene.getScene("Partida").ladoDoJogador);
  await abandonar();
  await foto("154-resumo-2-3");
  saida.resumo23 = await textoSobre();
  await clicar(640, 620, 600);
  saida.placarDepois = await placar();

  // o examinador oferece a partida seguinte depois da anterior
  await clicar(820, 540, 700);
  await foto("155-kalvaitis-depois");
  await clicar(532, 662, 500); // vamos à próxima partida (1ª de 2)
  await esperarCena("Partida");
  await espera(2000);
  saida.partida4 = await pagina.evaluate(() => {
    const s = window.jogo.scene.getScene("Partida");
    return { id: s.idAdversario, cor: s.ladoDoJogador };
  });
  await foto("156-partida-4");
  await abandonar();
  await clicar(640, 620, 600); // fecha o resumo 5–7

  // atalho: as outras ao vivo vencidas, e o resultado
  const p = await progresso();
  Object.assign(p.resultados, { "kalvaitis@8": 1, "kalvaitis@11": 1, "kalvaitis@14": 1 });
  await gravar(p);
  await continuar();
  await clicar(640, 620, 600); // fecha o resumo
  await clicar(640, 670, 300); // ver o resultado do match
  await esperarCena("Resultado");
  await espera(1500);
  await foto("157-resultado");
  saida.textos = await pagina.evaluate(() =>
    window.jogo.scene.getScene("Resultado").children.list.filter((o) => o.type === "Text").map((o) => o.text).filter((t) => /Você|mestre|×/.test(t)).slice(0, 6),
  );

  console.log(JSON.stringify({ ...saida, erros }, null, 2));
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
