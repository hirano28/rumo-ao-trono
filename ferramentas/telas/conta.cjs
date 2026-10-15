// A conta do jogador: a pergunta do apelido na primeira vez, a criação da
// conta anônima no servidor e o registro de uma partida (abandonada logo, só
// para chegar ao histórico). Com o login anônimo desligado no Supabase, mostra
// o caminho de falha: mensagem, "jogar sem salvar" e o botão no título.
// Uso: node ferramentas/telas/conta.cjs <url> <pasta-de-fotos> <apelido-de-teste>
const { chromium } = require("C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright");

const [url, pasta, apelido = "teste-claude"] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
  const erros = [];
  const avisos = [];
  pagina.on("pageerror", (e) => erros.push(String(e)));
  pagina.on("console", (m) => (m.type() === "error" ? erros : m.type() === "warning" ? avisos : []).push(m.text()));
  const cena = () => pagina.evaluate(() => window.jogo.scene.getScenes(true).map((s) => s.scene.key).join(","));
  const esperarCena = async (nome) => {
    for (let i = 0; i < 80; i++) {
      if ((await cena()) === nome) return;
      await espera(200);
    }
    throw new Error(`cena ${nome} não chegou; está em ${await cena()}`);
  };

  await pagina.goto(url);
  await pagina.evaluate(() => localStorage.clear());
  await pagina.reload();
  await esperarCena("Titulo");
  await pagina.waitForSelector("#apelido:not([hidden])", { timeout: 15000 });
  await espera(400);
  await pagina.screenshot({ path: `${pasta}/90-apelido.png` });
  await pagina.click("#apelido [data-entrar]"); // vazio: pede um apelido
  await espera(300);
  const erroVazio = await pagina.textContent("#apelido [data-erro]");
  await pagina.fill("#apelido input", apelido);
  await pagina.click("#apelido [data-entrar]");
  // ou fecha (conta criada) ou mostra a falha
  for (let i = 0; i < 40; i++) {
    const aberta = await pagina.isVisible("#apelido");
    const erro = await pagina.textContent("#apelido [data-erro]");
    if (!aberta || (erro && erro !== erroVazio)) break;
    await espera(250);
  }
  const contaCriada = !(await pagina.isVisible("#apelido"));
  const saida = { erroVazio, contaCriada };
  if (!contaCriada) {
    saida.mensagemDeFalha = await pagina.textContent("#apelido [data-erro]");
    await pagina.screenshot({ path: `${pasta}/91-apelido-falhou.png` });
    await pagina.click("#apelido [data-pular]");
    await espera(600);
    await pagina.screenshot({ path: `${pasta}/92-titulo-sem-conta.png` });
    // ao recarregar, não pergunta de novo
    await pagina.reload();
    await esperarCena("Titulo");
    await espera(2500);
    saida.perguntouDeNovo = await pagina.isVisible("#apelido");
  } else {
    await espera(600);
    await pagina.screenshot({ path: `${pasta}/91-titulo-com-conta.png` });
    // joga uma partida curta (abandona) para chegar ao histórico
    await pagina.mouse.click(640, 345); // Novo jogo (sem salvo)
    await esperarCena("Abertura");
    for (let i = 0; i < 10 && (await cena()) === "Abertura"; i++) {
      await pagina.mouse.click(640, 500);
      await espera(300);
    }
    await esperarCena("Quarto");
    await espera(800);
    await pagina.mouse.click(110, 430);
    await esperarCena("Local");
    await espera(900);
    await pagina.mouse.click(372, 500);
    await espera(700);
    await pagina.mouse.click(532, 662);
    await esperarCena("Partida");
    await espera(1500);
    await pagina.mouse.click(1000, 630);
    await espera(400);
    await pagina.mouse.click(520, 410);
    await espera(4000); // o registro e a cópia do progresso (2 s de espera) chegam ao servidor
    saida.sessao = await pagina.evaluate(() => Boolean(localStorage.getItem("rumo-ao-trono:sessao")));
    saida.pendentes = await pagina.evaluate(() => localStorage.getItem("rumo-ao-trono:pendentes"));
  }
  console.log(JSON.stringify({ ...saida, avisos, erros }, null, 2));
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
