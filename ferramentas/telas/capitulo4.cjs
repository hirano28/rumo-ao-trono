// Percurso do capítulo 4 (a final da Letônia, torneio grande): entra no
// salão, vê o resumo das duas primeiras rodadas (simuladas), abre o quadro de
// vinte, joga a partida da rodada 3 até o fim (abandono), vê o resumo das
// rodadas 4 a 6; depois, por atalho, completa as partidas ao vivo e confere o
// resumo com o luto de março, e a tela de resultado com a tabela grande.
// Uso: node ferramentas/telas/capitulo4.cjs <url> <pasta-de-fotos>
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
  const textoNaTela = () =>
    pagina.evaluate(() =>
      window.jogo.scene
        .getScene("Local")
        .children.list.filter((o) => o.type === "Text" && o.depth >= 100)
        .map((o) => o.text)
        .join(" | "),
    );
  const continuar = async () => {
    await pagina.reload();
    await esperarCena("Titulo");
    await espera(700);
    await clicar(640, 335); // Continuar
    await esperarCena("Local");
    await espera(1800);
  };
  const saida = {};

  await pagina.goto(url);
  await gravar({
    versao: 1, idioma: "pt-BR", modo: "carreira", capitulo: "cap4", forca: 1600,
    resultados: {}, forcas: {}, concluidos: ["cap1", "cap2", "cap3"], vistos: [], semente: "teste",
  });
  await continuar();
  await foto("130-salao-resumo-1-2");
  saida.resumo12 = await textoNaTela();
  await clicar(640, 620, 600); // fechar o resumo
  await foto("131-salao");
  await clicar(660, 180, 800); // quadro
  await foto("132-quadro-vinte");
  await clicar(640, 620, 500);
  await clicar(240, 540, 700); // Krūzkops
  await clicar(397, 662, 500); // quem são os mais fortes
  await foto("133-kruzkops");
  await clicar(908, 662, 500);

  // rodada 3, Zilber: joga e abandona
  await clicar(520, 540, 700);
  await clicar(532, 662, 500); // vamos jogar (1ª de 2)
  await esperarCena("Partida");
  await espera(2500);
  await foto("134-partida-zilber");
  await clicar(1000, 630, 400);
  await clicar(520, 410, 800);
  await clicar(640, 432, 300); // levantar da mesa
  await esperarCena("Local");
  await espera(1800);
  await foto("135-resumo-4-6");
  saida.resumo46 = await textoNaTela();
  await clicar(640, 620, 600);

  // atalho: Gipslis e Kļaviņš jogados, para passar pelo luto (depois da rodada 9)
  const p = await progresso();
  p.resultados.gipslis53 = 0.5;
  p.resultados.klavins = 1;
  await gravar(p);
  await continuar();
  await foto("136-resumo-7-14-luto");
  saida.resumoLuto = await textoNaTela();
  await clicar(640, 620, 600);
  await foto("137-salao-rodada-15");
  saida.placar = await pagina.evaluate(() =>
    window.jogo.scene.getScene("Local").children.list.filter((o) => o.type === "Text" && o.text.startsWith("Rodada")).map((o) => o.text),
  );

  // atalho: o resto ao vivo, e a classificação final
  const q = await progresso();
  q.resultados.koblencs = 0;
  q.resultados.tal53 = 1;
  await gravar(q);
  await continuar();
  await clicar(640, 620, 600); // fechar o resumo final
  await clicar(640, 670, 300); // ver a classificação final
  await esperarCena("Resultado");
  await espera(1500);
  await foto("138-resultado");
  saida.forcasGravadas = Object.keys((await progresso()).forcas).length;

  console.log(JSON.stringify({ ...saida, erros }, null, 2));
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
