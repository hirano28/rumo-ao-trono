// Gera a referência que prova a codificação do Maia no navegador: o próprio
// lc0, com os pesos oficiais, diz a probabilidade (política) de cada lance
// legal em posições escolhidas — começo, pretas, roque, histórico longo,
// repetição, promoção (com e sem captura), regra dos 50 lances. O teste
// testes/maia.test.ts roda o .onnx convertido e compara lance a lance.
//
// Uso: node ferramentas/referencia_maia.mjs [pasta-do-lc0]
// Saída: testes/referencia_maia.json
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const pasta = process.argv[2] ?? "C:/edson/ferramentas/lc0";
const NIVEIS = [1100, 1900];

/** `fen` vazio = posição inicial; `lances` em UCI, jogados a partir dela. */
const POSICOES = [
  { nome: "inicial", fen: "", lances: [] },
  { nome: "depois de 1.e4 (pretas)", fen: "", lances: ["e2e4"] },
  { nome: "espanhola, brancas rocaram (pretas)", fen: "", lances: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6", "e1g1"] },
  {
    nome: "nimzo, histórico longo (pretas)",
    fen: "",
    lances: ["d2d4", "g8f6", "c2c4", "e7e6", "b1c3", "f8b4", "e2e3", "e8g8", "f1d3", "d7d5", "g1f3", "c7c5", "e1g1"],
  },
  { nome: "repetição de posição", fen: "", lances: ["g1f3", "g8f6", "f3g1", "f6g8", "g1f3", "g8f6"] },
  { nome: "promoção das brancas, com e sem captura", fen: "1n5k/P7/8/8/8/8/8/6K1 w - - 0 1", lances: [] },
  { nome: "promoção das pretas", fen: "6k1/8/8/8/8/8/p7/1N5K b - - 0 1", lances: [] },
  { nome: "roques parciais e 50 lances", fen: "r3k2r/pppq1ppp/2n2n2/3pp3/3PP3/2N2N2/PPPQ1PPP/R3K2R w Kq - 30 40", lances: [] },
];

// política crua: temperatura 1 (o padrão do lc0 é 1,359) e histórico sem
// preenchimento, como nas partidas do jogo, que sempre começam do início
const OPCOES = ["VerboseMoveStats value true", "PolicyTemperature value 1.0", "HistoryFill value no", "Threads value 1"];

const POLITICA = /info string ([a-h][1-8][a-h][1-8][qrbn]?)\s.*?\(P:\s*([\d.]+)%\)/;

function consultar(nivel, posicao) {
  return new Promise((resolver, rejeitar) => {
    const lc0 = spawn(`${pasta}/lc0.exe`, []);
    let saida = "";
    let pediu = false;
    const prazo = setTimeout(() => {
      lc0.kill();
      rejeitar(new Error(`lc0 sem resposta: ${posicao.nome}`));
    }, 60_000);
    const mandar = (linha) => lc0.stdin.write(linha + "\n");
    lc0.stdout.on("data", (pedaco) => {
      saida += pedaco;
      if (!pediu && saida.includes("readyok")) {
        pediu = true;
        const base = posicao.fen ? `position fen ${posicao.fen}` : "position startpos";
        mandar(posicao.lances.length ? `${base} moves ${posicao.lances.join(" ")}` : base);
        mandar("go nodes 1");
      }
      if (saida.includes("bestmove")) {
        clearTimeout(prazo);
        mandar("quit");
      }
    });
    lc0.on("close", () => {
      const politica = {};
      for (const linha of saida.split(/\r?\n/)) {
        const achado = POLITICA.exec(linha);
        if (achado) politica[achado[1]] = Number(achado[2]) / 100;
      }
      if (Object.keys(politica).length === 0) console.error(saida.slice(-1500));
      resolver(politica);
    });
    mandar("uci");
    mandar(`setoption name WeightsFile value ${pasta}/maia-${nivel}.pb.gz`);
    for (const opcao of OPCOES) mandar(`setoption name ${opcao}`);
    mandar("isready");
  });
}

const referencia = [];
for (const nivel of NIVEIS) {
  for (const posicao of POSICOES) {
    const politica = await consultar(nivel, posicao);
    referencia.push({ nivel, ...posicao, politica });
    console.log(nivel, posicao.nome, Object.keys(politica).length, "lances");
  }
}
writeFileSync("testes/referencia_maia.json", JSON.stringify(referencia, null, 1) + "\n");
