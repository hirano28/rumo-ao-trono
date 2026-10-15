// Percurso do capítulo 3: entra no salão do torneio, conversa, abre o quadro e
// o regulamento, e testa a partida adiada nos dois sentidos:
// (a) contra Kalniņš (você de brancas): a partida é levada por atalho até o
//     40º lance das pretas; você sela o lance, vai para casa, analisa, recarrega
//     a página (o envelope sobrevive) e retoma de manhã;
// (b) contra Sokolov (você de pretas): ele sela, você analisa sem saber o lance,
//     e o envelope é aberto na retomada.
// Uso: node ferramentas/telas/capitulo3.cjs <url> <pasta-de-fotos>
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
  /** Leva a partida em curso até o 40º lance das pretas, com lances ao acaso que não a terminam. */
  const levarAoLance40 = () =>
    pagina.evaluate(() => {
      const s = window.jogo.scene.getScene("Partida");
      s.numero++; // descarta um lance do adversário que esteja a caminho
      const p = s.partida;
      let semente = 11;
      const sorteio = (n) => {
        semente = (semente * 1103515245 + 12345) % 2 ** 31;
        return semente % n;
      };
      while (p.history().length < 80) {
        const legais = p.moves();
        p.move(legais[sorteio(legais.length)]);
        if (p.isGameOver()) p.undo();
      }
      s.tabuleiro.desenhar();
      s.proximaVez();
      return p.history().length;
    });
  const saida = {};

  // carreira no capítulo 3, com os dois primeiros vencidos
  await pagina.goto(url);
  await pagina.evaluate(() =>
    localStorage.setItem(
      "rumo-ao-trono:progresso",
      JSON.stringify({
        versao: 1, idioma: "pt-BR", modo: "carreira", capitulo: "cap3", forca: 1450,
        resultados: {}, forcas: {}, concluidos: ["cap1", "cap2"], vistos: [], semente: "teste",
      }),
    ),
  );
  await pagina.reload();
  await esperarCena("Titulo");
  await espera(700);
  await clicar(640, 335); // Continuar
  await esperarCena("Local");
  await espera(1500);
  await foto("100-clube");
  await clicar(1120, 540, 700); // árbitro
  await foto("101-arbitro");
  // botões da caixa de diálogo: com 3 opções em x 397, 720 e 1043; com 2, em 532 e 908
  await clicar(397, 662, 500); // como funciona o lance secreto
  await foto("102-arbitro-envelope");
  await clicar(908, 662, 500); // até logo
  await clicar(395, 540, 700); // Misha
  await clicar(397, 662, 500); // partida adiada?
  await foto("103-tal-adiada");
  await clicar(908, 662, 500); // até logo
  await clicar(660, 180, 800); // quadro
  await foto("104-quadro");
  await clicar(640, 620, 500);
  await clicar(815, 214, 800); // regulamento
  await foto("105-regulamento");
  await clicar(640, 620, 500);
  await clicar(146, 546, 800); // jornal na cadeira
  await foto("106-jornal-cadeira");
  await clicar(640, 620, 500);

  // (a) Kalniņš: você sela
  await clicar(540, 540, 700);
  await foto("107-kalnins");
  await clicar(532, 662, 500); // vamos jogar a nossa rodada
  await esperarCena("Partida");
  await espera(2500);
  saida.lancesA = await levarAoLance40();
  await espera(600);
  await foto("108-selar-sua-vez");
  saida.selou = await pagina.evaluate(() => {
    const s = window.jogo.scene.getScene("Partida");
    const lance = s.partida.moves({ verbose: true })[0];
    s.jogar({ from: lance.from, to: lance.to, promotion: lance.promotion });
    return lance.san;
  });
  await espera(800);
  await foto("109-envelope-seu");
  saida.adiadaA = (await progresso()).adiada;
  await clicar(640, 505, 300); // ir para casa
  await esperarCena("Adiamento");
  await espera(1200);
  await foto("110-noite-seu");
  await pagina.evaluate(() => {
    const s = window.jogo.scene.getScene("Adiamento");
    const lance = s.analise.moves({ verbose: true })[0];
    s.mexer({ from: lance.from, to: lance.to, promotion: lance.promotion });
  });
  await espera(500);
  await foto("111-noite-analise");
  // recarregar no meio da noite: o envelope continua guardado
  await pagina.reload();
  await esperarCena("Titulo");
  await espera(700);
  await clicar(640, 335); // Continuar
  await esperarCena("Local");
  await espera(1200);
  await foto("112-clube-retomar");
  await clicar(490, 670, 300); // retomar a partida adiada
  await esperarCena("Partida");
  await espera(800);
  await foto("113-abrindo-envelope");
  await espera(2600);
  await foto("114-envelope-aberto");
  saida.retomadaA = await pagina.evaluate(() => {
    const s = window.jogo.scene.getScene("Partida");
    return { lances: s.partida.history().length, ultimo: s.partida.history().at(-1), vez: s.partida.turn() };
  });
  // o envelope só sai do progresso com o resultado
  saida.envelopeAindaGuardado = Boolean((await progresso()).adiada);
  await espera(5000); // o adversário responde
  saida.respostaA = await pagina.evaluate(() => window.jogo.scene.getScene("Partida").partida.history().length);
  await foto("115-depois-da-resposta");
  // abandona para seguir para a rodada 2
  await clicar(1000, 630, 400);
  await clicar(520, 410, 800);
  await clicar(640, 432, 300); // levantar da mesa
  await esperarCena("Local");
  await espera(1200);
  saida.envelopeDepoisDoResultado = (await progresso()).adiada ?? null;

  // (b) Sokolov: ele sela
  await clicar(685, 540, 700);
  await clicar(397, 662, 500); // vamos jogar (1ª de 3)
  await esperarCena("Partida");
  await espera(2500);
  saida.lancesB = await levarAoLance40();
  await espera(600);
  await foto("116-selar-dele");
  for (let i = 0; i < 40 && !(await progresso()).adiada; i++) await espera(250);
  await espera(400);
  await foto("117-envelope-dele");
  saida.adiadaB = (await progresso()).adiada;
  await clicar(640, 505, 300); // ir para casa
  await esperarCena("Adiamento");
  await espera(1200);
  await foto("118-noite-dele");
  await clicar(990, 640, 300); // dormir e voltar ao clube
  await esperarCena("Partida");
  await espera(3600);
  await foto("119-retomada-dele");
  saida.retomadaB = await pagina.evaluate(() => {
    const s = window.jogo.scene.getScene("Partida");
    return { lances: s.partida.history().length, ultimo: s.partida.history().at(-1), vez: s.partida.turn() };
  });

  console.log(JSON.stringify({ ...saida, erros }, null, 2));
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
