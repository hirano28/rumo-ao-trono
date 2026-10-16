// Percurso do capítulo 6 (a final da URSS, Moscou 1957): entra no palco, vê o
// resumo das três primeiras rodadas (simuladas), abre o quadro de 22, conversa
// com o Misha, joga a partida da rodada 4 contra Spassky (abandono), vê o
// resumo seguinte; depois, por atalho, completa as partidas ao vivo e confere
// a tela de resultado com a tabela grande.
// Uso: node ferramentas/telas/capitulo6.cjs <url> <pasta-de-fotos>
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
    versao: 1, idioma: "pt-BR", modo: "carreira", capitulo: "cap6", forca: 2000,
    resultados: {}, forcas: {}, concluidos: ["cap1", "cap2", "cap3", "cap4", "cap5"], vistos: [], semente: "teste",
  });
  await continuar();
  await foto("160-palco-resumo-1-3");
  saida.resumo13 = await textoNaTela();
  await clicar(640, 620, 600); // fechar o resumo
  await foto("161-palco");
  await clicar(212, 375, 800); // quadro
  await foto("162-quadro-22");
  await clicar(640, 620, 500);
  await clicar(300, 545, 700); // Misha
  await clicar(532, 662, 500); // como passou em Tbilisi (1ª de 2: "jogar" não aparece fora da rodada dele)
  await foto("163-tal");
  await clicar(720, 662, 500); // até a rodada (a única opção que sobra)

  // rodada 4, Spassky: joga e abandona
  await clicar(455, 545, 700);
  await clicar(397, 662, 500); // vamos jogar (1ª de 3)
  await esperarCena("Partida");
  await espera(2500);
  await foto("164-partida-spassky");
  await clicar(1000, 630, 400);
  await clicar(520, 410, 800);
  await clicar(640, 432, 300); // levantar da mesa
  await esperarCena("Local");
  await espera(1800);
  await foto("165-resumo-5-7");
  saida.resumo57 = await textoNaTela();
  await clicar(640, 620, 600);
  await foto("166-palco-rodada-8");
  saida.placar = await pagina.evaluate(() =>
    window.jogo.scene.getScene("Local").children.list.filter((o) => o.type === "Text" && o.text.startsWith("Rodada")).map((o) => o.text),
  );

  // atalho: o resto ao vivo, e a classificação final
  const q = await progresso();
  Object.assign(q.resultados, { petrosian57: 0.5, keres57: 0, tal57: 1, bronstein57: 0.5 });
  await gravar(q);
  await continuar();
  await clicar(640, 620, 600); // fechar o resumo final
  await clicar(640, 670, 300); // ver a classificação final
  await esperarCena("Resultado");
  await espera(1500);
  await foto("167-resultado");
  saida.forcasGravadas = Object.keys((await progresso()).forcas).length;

  console.log(JSON.stringify({ ...saida, erros }, null, 2));
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
