// Percurso completo do capítulo 1 num Chromium headless: título, abertura,
// quarto (jornal), parque, conversa e uma partida inteira contra o Pēteris.
// Uso: node percurso.cjs <url> <pasta-de-fotos> [idioma]
const { chromium } = require("C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright");

const [url, pasta, idioma = "pt-BR"] = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
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
    for (let i = 0; i < 60; i++) {
      if ((await cena()) === nome) return;
      await espera(200);
    }
    throw new Error(`cena ${nome} não chegou; está em ${await cena()}`);
  };

  await pagina.goto(url);
  await pagina.evaluate(() => localStorage.clear());
  await pagina.reload();
  await esperarCena("Titulo");
  await espera(800);
  if (idioma === "en") await clicar(1200, 676);
  await foto("01-titulo");
  await clicar(640, 360); // Novo jogo
  await esperarCena("Abertura");
  await espera(1500);
  await foto("02-abertura");
  for (let i = 0; i < 10 && (await cena()) === "Abertura"; i++) await clicar(640, 500, 300);
  await esperarCena("Quarto");
  await espera(1000);
  await pagina.mouse.move(760, 448);
  await espera(300);
  await foto("03-quarto");
  await clicar(760, 448, 800); // jornal
  await foto("04-jornal");
  await clicar(640, 620, 600); // fechar
  await clicar(930, 446, 800); // revista
  await foto("05-revista");
  await clicar(640, 620, 600);
  await clicar(110, 430); // porta
  await esperarCena("Praca");
  await espera(1000);
  await foto("06-parque");
  await clicar(1150, 430, 700); // Marta
  await foto("07-marta");
  await clicar(220, 662, 500); // novidades (1ª de 4)
  await foto("08-marta-novidades");
  await clicar(828, 662, 500); // até logo (2ª de 2)
  await clicar(330, 470, 700); // Pēteris
  await foto("09-peteris");
  await clicar(452, 662, 500); // "Vamos jogar." (1ª de 2)
  await esperarCena("Partida");
  await espera(1200);
  await foto("10-partida-inicio");

  // Joga a partida inteira: mate em 1 se houver, senão a captura mais valiosa, senão ao acaso.
  const tempos = [];
  for (let lance = 0; lance < 160; lance++) {
    const estado = await pagina.evaluate(() => {
      const p = window.jogo.scene.getScene("Partida");
      return { fim: p.terminada, vez: p.partida.turn(), lado: p.ladoDoJogador, fen: p.partida.fen() };
    });
    if (estado.fim) break;
    if (estado.vez !== estado.lado) {
      const inicio = Date.now();
      for (let i = 0; i < 150; i++) {
        await espera(100);
        const vez = await pagina.evaluate(() => {
          const p = window.jogo.scene.getScene("Partida");
          return p.terminada ? "fim" : p.partida.turn();
        });
        if (vez !== estado.vez) break;
      }
      tempos.push(Date.now() - inicio);
      continue;
    }
    const escolha = await pagina.evaluate(() => {
      const p = window.jogo.scene.getScene("Partida");
      const valor = { p: 1, n: 3, b: 3, r: 5, q: 9 };
      const lances = p.partida.moves({ verbose: true });
      const mate = lances.find((m) => m.san.endsWith("#"));
      if (mate) return mate;
      const capturas = lances.filter((m) => m.captured).sort((a, b) => valor[b.captured] - valor[a.captured]);
      if (capturas.length && Math.random() < 0.8) return capturas[0];
      return lances[Math.floor(Math.random() * lances.length)];
    });
    const casa = (nome) => {
      const c = "abcdefgh".indexOf(nome[0]);
      const f = Number(nome[1]);
      const col = estado.lado === "w" ? c : 7 - c;
      const lin = estado.lado === "w" ? 8 - f : f - 1;
      return [92 + col * 72 + 36, 72 + lin * 72 + 36];
    };
    await clicar(...casa(escolha.from), 120);
    if (lance === 0) await foto("11-lances-legais");
    await clicar(...casa(escolha.to), 250);
    if (escolha.promotion) {
      // a escolha de promoção abre sobre a casa de destino; a dama é a primeira
      const [x, y] = casa(escolha.to);
      const cx = Math.min(Math.max(x - 92, 72 * 2.2), 72 * 8 - 72 * 2.2) + 92;
      await clicar(cx - 1.5 * 72 * 1.05, y, 400);
    }
  }
  // sem fim no limite de lances: abandona (testa o botão e a confirmação)
  const aberta = await pagina.evaluate(() => !window.jogo.scene.getScene("Partida").terminada);
  if (aberta) {
    await clicar(1000, 630, 400); // Abandonar
    await foto("12a-confirmar-abandono");
    await clicar(520, 410, 400); // confirmar
  }
  await espera(800);
  await foto("12-partida-fim");
  const resumo = await pagina.evaluate(() => {
    const p = window.jogo.scene.getScene("Partida");
    return { terminada: p.terminada, lances: p.partida.history().length, pgn: p.partida.pgn() };
  });

  await clicar(640, 360 + 72); // voltar ao parque
  await esperarCena("Praca");
  await espera(900);
  await foto("13-parque-depois");

  console.log(JSON.stringify({ resumo, temposDoAdversarioMs: tempos, erros }, null, 2));
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
