// Percurso do capítulo 2: sai do resultado do capítulo 1 pelo "Seguir", passa
// pela abertura e pelo quarto de 1951, chega ao Palácio, conversa, abre o
// quadro do torneio, joga a rodada 1 inteira com relógio, faz a bandeira cair
// na rodada 2 e completa as rodadas 3 e 4 por atalho, até a classificação final.
// Uso: node ferramentas/telas/capitulo2.cjs <url> <pasta-de-fotos>
const { chromium } = require("C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright");

const [url, pasta] = process.argv.slice(2);
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
    for (let i = 0; i < 80; i++) {
      if ((await cena()) === nome) return;
      await espera(200);
    }
    throw new Error(`cena ${nome} não chegou; está em ${await cena()}`);
  };
  const progresso = () => pagina.evaluate(() => JSON.parse(localStorage.getItem("rumo-ao-trono:progresso")));

  // capítulo 1 concluído
  await pagina.goto(url);
  await pagina.evaluate(() =>
    localStorage.setItem(
      "rumo-ao-trono:progresso",
      JSON.stringify({
        versao: 1, idioma: "pt-BR", modo: "carreira", capitulo: "cap1", forca: 1183,
        resultados: { peteris: 1, grisha: 1, ozols: 0.5 }, forcas: { peteris: 800, grisha: 900, ozols: 1050 },
        concluidos: ["cap1"], vistos: [], semente: "teste",
      }),
    ),
  );
  await pagina.reload();
  await esperarCena("Titulo");
  await espera(700);
  await clicar(640, 335); // Continuar
  await esperarCena("Resultado");
  await espera(1000);
  await foto("60-resultado-cap1-seguir");
  await clicar(640, 650); // Seguir: capítulo 2
  await esperarCena("Abertura");
  await espera(1200);
  await foto("61-abertura-cap2");
  for (let i = 0; i < 10 && (await cena()) === "Abertura"; i++) await clicar(640, 500, 300);
  await esperarCena("Quarto");
  await espera(900);
  await clicar(760, 448, 800); // jornal
  await foto("62-jornal-1951");
  await clicar(640, 620, 500);
  await clicar(930, 446, 800); // revista
  await foto("63-revista-1951");
  await clicar(640, 620, 500);
  await clicar(110, 430); // porta
  await esperarCena("Local");
  await espera(1000);
  await foto("64-palacio");
  await clicar(230, 445, 700); // Krūzkops
  await foto("65-kruzkops");
  await clicar(267, 662, 500); // como funciona (1ª de 3)
  await foto("66-kruzkops-regras");
  await clicar(828, 662, 500); // estou pronto (2ª de 2)
  await clicar(420, 470, 700); // Tal
  await clicar(640, 662, 500); // "é verdade… Botvinnik?" (1ª de 3 fica em 267; a 2ª em 640)
  await foto("67-tal");
  await clicar(828, 662, 500); // até logo (2ª de 2)
  await clicar(640, 205, 800); // quadro
  await foto("68-quadro-vazio");
  await clicar(640, 620, 500);
  // Ilze (não é a rodada dela): não pode oferecer partida
  await clicar(890, 478, 700);
  const opcoesIlze = await pagina.evaluate(() => window.jogo.scene.getScene("Local").children.list.filter((o) => o.type === "Container").length);
  await foto("69-ilze-fora-da-rodada");
  await clicar(640, 662, 500); // a única opção, centralizada
  // Valdis: rodada 1
  await clicar(770, 480, 700);
  await clicar(452, 662, 500); // vamos jogar (1ª de 2)
  await esperarCena("Partida");
  await espera(2500);
  await foto("70-partida-com-relogio");

  // joga a partida da rodada 1 até o fim (mate em 1, captura valiosa, ou ao acaso)
  // conta só os lances do jogador; as esperas pelo adversário não contam
  for (let lance = 0, voltas = 0; lance < 120 && voltas < 6000; voltas++) {
    const estado = await pagina.evaluate(() => {
      const p = window.jogo.scene.getScene("Partida");
      return { fim: p.terminada, vez: p.partida.turn(), lado: p.ladoDoJogador };
    });
    if (estado.fim) break;
    if (estado.vez !== estado.lado) {
      await espera(150);
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
    lance++;
    await clicar(...casa(escolha.from), 80);
    await clicar(...casa(escolha.to), 200);
    if (escolha.promotion) await clicar(...casa(escolha.to), 300); // fora da escolha: desiste; tenta outro lance
  }
  const aberta = await pagina.evaluate(() => !window.jogo.scene.getScene("Partida").terminada);
  if (aberta) {
    await clicar(1000, 630, 400);
    await clicar(520, 410, 400);
  }
  await espera(800);
  await foto("71-partida-fim");
  await clicar(640, 432); // levantar da mesa
  await esperarCena("Local");
  await espera(900);
  await clicar(640, 205, 800); // quadro depois da rodada 1
  await foto("72-quadro-rodada1");
  await clicar(640, 620, 500);

  // rodada 2 (Ilze): o relógio do jogador quase no fim, para a bandeira cair
  await clicar(890, 478, 700);
  await clicar(452, 662, 500);
  await esperarCena("Partida");
  await espera(1500);
  await pagina.evaluate(() => {
    const p = window.jogo.scene.getScene("Partida");
    // a Ilze joga de brancas; espera a vez do jogador e deixa 1,5 s no relógio dele
    p.relogio.restante.b = 1500;
  });
  await espera(6000);
  await foto("73-bandeira-caiu");
  const rodada2 = await pagina.evaluate(() => window.jogo.scene.getScene("Partida").terminada);

  // rodadas 3 e 4 por atalho
  await pagina.evaluate(() => {
    const salvo = JSON.parse(localStorage.getItem("rumo-ao-trono:progresso"));
    salvo.resultados.boris = 1;
    salvo.resultados.gipslis = 1;
    salvo.forcas.boris = 1183;
    salvo.forcas.gipslis = 1258;
    localStorage.setItem("rumo-ao-trono:progresso", JSON.stringify(salvo));
  });
  await pagina.reload();
  await esperarCena("Titulo");
  await espera(700);
  await clicar(640, 335); // Continuar
  await esperarCena("Local");
  await espera(900);
  await foto("74-palacio-fim-do-torneio");
  await clicar(640, 670); // ver classificação final
  await esperarCena("Resultado");
  await espera(1200);
  await foto("75-resultado-cap2");

  console.log(JSON.stringify({ opcoesIlze, rodada2Terminou: rodada2, progresso: await progresso(), erros }, null, 2));
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
