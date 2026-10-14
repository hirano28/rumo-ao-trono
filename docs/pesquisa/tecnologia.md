# Pesquisa de tecnologia — Rumo ao Trono

Verificado em **14/10/2026** (Windows 11, Node 22.17.0, npm 11.19). Versões e datas vêm do
registro npm (`npm view <pacote> version time --json`); licenças, do `package.json` do pacote e
da API do GitHub/Hugging Face. Os trechos de uso foram **executados** numa pasta temporária fora
do projeto (já apagada), com Vite 8.3.4 + TypeScript + Phaser 4.2.1, e o resultado dos testes está
marcado como "testado". O que não deu para confirmar está dito como tal.

## Tabela-resumo

| Pacote | Versão | Data | Licença | Observação |
|---|---|---|---|---|
| phaser | 4.2.1 (`latest`) | 09/07/2026 | MIT | 4.0.0 saiu em 10/04/2026 e é a tag `latest`. Última 3.x: 3.90.0 (23/05/2025). Pacote grande no disco (112 MB), bundle pequeno (ver §1) |
| @phaserjs/create-game | 1.3.2 | 21/04/2026 | MIT | CLI oficial de projeto. O template `phaserjs/template-vite-ts` fixa phaser 4.0.0, Vite ^6.3.1, TS ~5.7.2 (defasado) |
| chess.js | 1.4.0 | 14/06/2025 | BSD-2-Clause | ESM (`module`: `dist/esm/chess.js`) + CJS + tipos. Sem dependências |
| inkjs | 2.4.0 | 17/02/2026 | MIT | Runtime + compilador embutido (`inkjs/compiler/Compiler`, `inkjs/full`) + CLI `inkjs-compiler`. ESM nativo |
| stockfish (nmrugg) | 19.0.1 (`latest`) | 10/10/2026 | **GPL-3.0** | Build `lite-single`: 1,85 MB de wasm + 28 KB de js, **sem SharedArrayBuffer**. O projeto hoje usa 18.0.8 |
| onnxruntime-web | 1.30.0 | 14/09/2026 | MIT | Entrada `onnxruntime-web/wasm` (CPU). wasm: 14,2 MB (3,7 MB gzip) |
| Maia-1 ONNX (1100–1900) | pesos de 2020; conversões em 2026 | — | **GPL-3.0** (repo CSSLab/maia-chess) | 3,3 MB por modelo. Conversão pronta no HF: `cstr/maia-chess-onnx-opset15` (usar os `maia-<elo>.onnx`, não os `-opset15`). Entrada 112×8×8, saída política 1858 + WDL. Testado |
| Maia-2 (rapid) ONNX | `cemoss17/maia2-onnx` (28/01/2026) | — | código MIT; pesos sem licença declarada | 81 MB. Sem documentação de entrada/saída encontrada |
| Maia-3 ONNX (5M/23M/79M) | repo CSSLab/maia3 (mai/2026) | — | **AGPL-3.0** | 5M = 10–21 MB. Conversões de terceiros no HF. Sucessor recomendado pelos autores |
| vitest | 5.0.4 (`latest`) | 12/10/2026 | MIT | Exige Node ^22.12 e Vite ≥ 6.4 (ok com Node 22.17). Testado |
| vite | 8.3.4 | 08/10/2026 | MIT | Node ^20.19 ou ≥22.12. Bundler é Rolldown (aviso de chunk > 500 kB com o Phaser) |
| typescript | 7.0.2 (`latest`) / 5.9.3 | 08/07/2026 / 30/09/2025 | Apache-2.0 | `tsc --noEmit` passou com 5.9.3 e com 7.0.2 no projeto de teste |

---

## 1. Phaser

- **Versão estável:** a 4.x é estável pelo critério objetivo do registro: `dist-tags.latest = 4.2.1`
  (as tags `alpha` e `beta` ficam para pré-lançamentos). O artigo oficial de migração diz que a 4
  foi lançada em abril/2026; ele **não** usa a palavra "estável", então a conclusão vem da tag `latest`.
- **Motivo para preferir a 3?** Só em casos específicos: pipelines WebGL customizados e shaders (viram
  *render nodes*), efeitos removidos (Bloom, Shine, Circle FX, BitmapMask, `setTintFill`, `Geom.Point`,
  Mesh/Plane), ou plugins de terceiros que ainda não migraram. Um jogo narrativo 2D com sprites, texto,
  tweens e áudio não tem nenhum desses; a estimativa oficial é "poucas horas" de migração para jogos
  comuns. **Recomendação: Phaser 4.2.1** (o `package.json` do projeto já usa essa versão).
  Guia: `https://unpkg.com/phaser@4.2.1/changelog/v4/4.0/MIGRATION-GUIDE.md`.
- **Template oficial Vite+TS:** `phaserjs/template-vite-ts` (MIT, último push 21/04/2026) ou, pelo CLI,
  `npm create @phaserjs/game@latest`. Estrutura: `index.html`, `public/assets`, `src/main.ts`,
  `src/game/main.ts`, `src/game/scenes/*`, `vite/config.dev.mjs` e `vite/config.prod.mjs`.
  **Atenção:** os scripts `dev`/`build` do template rodam `node log.js`, que faz um GET para
  `gryzor.co/v/{evento}/{versão do phaser}/{nome do projeto}` (telemetria anônima). Existem
  `dev-nolog`/`build-nolog` sem isso. O projeto atual já não usa o template, então não é problema.
  O template está defasado: Phaser 4.0.0, Vite 6, TS 5.7 (o `description` do package ainda diz "Phaser 3").
- **Bundle (testado):** Phaser 4.2.1 + chess.js + inkjs com `vite build` = **1,54 MB (401 KB gzip)**.
  Dá o aviso de chunk grande; ignorável ou resolvido com `build.chunkSizeWarningLimit`.

```ts
// src/main.ts  (testado: abre canvas 960x540 em WebGL, console mostra "Phaser v4.2.1 (WebGL | Web Audio)")
import Phaser from "phaser";

class Cena extends Phaser.Scene {
  create() { this.add.text(20, 20, "Rumo ao Trono", { fontFamily: "serif" }); }
}
new Phaser.Game({ type: Phaser.AUTO, width: 960, height: 540, parent: "game", scene: Cena });
```

```ts
// vite.config.ts — base relativa é essencial para o itch.io (o jogo roda em subcaminho/iframe)
import { defineConfig } from "vite";
export default defineConfig({ base: "./" });
```

## 2. chess.js

- **1.4.0**, BSD-2-Clause, sem dependências. `package.json`: `main: dist/cjs/chess.js`,
  `module: dist/esm/chess.js`, `types: dist/types/chess.d.ts` — ou seja, **é ESM** (e também CJS).
- API confirmada por execução:

```ts
import { Chess } from "chess.js";

const g = new Chess();                       // posição inicial; new Chess(fen) aceita FEN
const m = g.move("e4");                      // SAN; também g.move({ from: "g1", to: "f3", promotion: "q" })
                                             // lance ilegal LANÇA exceção: "Invalid move: a3"
g.moves();                                   // ["a3","a4",...] em SAN
g.moves({ verbose: true });                  // [{ color, from, to, piece, captured, promotion, flags, san, lan, before, after }]
g.moves({ square: "e2", verbose: true });    // só as peças de uma casa
g.fen(); g.turn();                           // "w" | "b"
g.isGameOver();                              // mate, afogamento, material insuficiente, 3x repetição, 50 lances
g.isCheckmate(); g.isStalemate(); g.isDraw();// isDraw cobre afogamento/material/3x/50 lances
g.isInsufficientMaterial(); g.isThreefoldRepetition(); g.inCheck();
g.history(); g.pgn(); g.undo(); g.get("e4"); g.board();
```

- Testado: mate do pastor → `isCheckmate()` true; `7k/5Q2/6K1/8/8/8/8/8 b` → `isStalemate()`,
  `isDraw()` e `isGameOver()` true.
- Dica de integração: `move()` lança exceção em lance inválido; para o clique do jogador, filtre por
  `moves({ square, verbose: true })` em vez de tentar e capturar.

## 3. inkjs

- **2.4.0** (17/02/2026), MIT. `exports`: `"."` (só runtime, `dist/ink.mjs`, 128 KB), `"./full"` (runtime +
  compilador, `dist/ink-full.mjs`, 248 KB), `"./compiler/*"`, `"./engine/*"`, `"./types"`.
  Tabela de compatibilidade do README: inklecate 1.2.0 ↔ JSON versão 21.
- **Compilar .ink → .json no build: sim, há compilador embutido, de duas formas** (ambas testadas):

```bash
# 1) CLI (vem com o pacote; saída é o JSON de runtime)
npx inkjs-compiler -o conteudo/historia_pt.json conteudo/historia_pt.ink
# flags: -o <saida>  -c (conta visitas de tudo)  -s (estatísticas/contagem de palavras)  -p (modo jogar)
```

```ts
// 2) Compilador em código (script de build ou até no navegador, usando "inkjs/full")
import { Compiler } from "inkjs/compiler/Compiler";
import fs from "node:fs";
const story = new Compiler(fs.readFileSync("a.ink", "utf8")).Compile();
fs.writeFileSync("a.json", story.ToJson());
```

  Pegadinha: ao ler o `.json` com `fs`, tire o BOM (`.replace(/^﻿/, "")`) antes do `new Story(...)`.
  Sugestão: um `ferramentas/compilar_ink.mjs` rodando no `predev`/`prebuild`, como o `copiar_motor.mjs` que já existe.

- **Runtime com variáveis, tags, escolhas e funções externas (testado):**

```ts
import { Story } from "inkjs";
const story = new Story(jsonString);

story.BindExternalFunction("tocarSom", (nome: string) => audio.play(nome), true); // EXTERNAL tocarSom(nome) no .ink
story.ObserveVariable("confianca", (nome, valor) => hud.set(valor));              // reage a VAR do ink

while (story.canContinue) {
  const linha = story.Continue();           // texto da linha
  const tags = story.currentTags ?? [];     // ["cena: salao", "personagem: mestre"]  (# cena: salao no .ink)
}
story.currentChoices.map(c => c.text);      // ["Abrir com e4", "Abrir com d4"]
story.ChooseChoiceIndex(0);
story.variablesState["confianca"] = 5;      // ler e escrever variáveis (jogo -> ink: ex. resultado da partida)
const salvo = story.state.toJson();         // salvar; story.state.LoadJson(salvo) restaura
```

- **Dois idiomas (pt-BR e en) — abordagem recomendada:** um arquivo `.ink` por idioma
  (`historia_pt.ink`, `historia_en.ink`) com **estrutura idêntica** (mesmos knots, stitches, nomes de
  variáveis e de tags; só o texto muda), compilados para dois `.json` e carregados conforme o idioma.
  O ink não tem sistema de localização nativo. Testado: um estado salvo (`toJson`) do story em português
  carregou (`LoadJson`) no story em inglês, manteve a posição e a variável, e a continuação saiu em
  inglês. Ressalva: as **escolhas já pendentes** continuam com o texto do idioma antigo até a próxima
  linha, e o salvamento só é seguro se a estrutura dos dois arquivos continuar idêntica — vale um teste
  automatizado (Vitest) que compare knots/variáveis dos dois JSON. A alternativa (IDs por linha em tags +
  tabela de strings) dobra o trabalho de autoria e quebra a leitura do roteiro; não compensa para dois idiomas.
- Textos de interface (menus, HUD) ficam fora do ink, num `i18n.ts` simples.

## 4. Stockfish no navegador

- **Pacote `stockfish` (nmrugg/stockfish.js): 19.0.1**, publicado em 10/10/2026 (19.0.0 em 15/09/2026),
  licença **GPL-3.0** (motor) — combina com o projeto GPL-3.0. O README diz que o código que não é do
  motor é MIT. O pacote tem 205 MB no disco porque traz as cinco builds; o jogo só copia uma.
- **Builds (tamanhos medidos no pacote):**

| Arquivo | Tamanho | Threads | Precisa de COOP/COEP |
|---|---|---|---|
| `stockfish-19-lite-single.js` + `.wasm` | 28 KB + **1,85 MB** | não | **não** |
| `stockfish-19-lite.js` + `.wasm` | 33 KB + 1,70 MB | sim | sim |
| `stockfish-19-single.js` + `.wasm` | 28 KB + 99 MB | não | não |
| `stockfish-19.js` + `.wasm` | 33 KB + 99 MB | sim | sim |
| `stockfish-19-asm.js` | 3,2 MB | não | não (lento e fraco, último recurso) |

  O README recomenda justamente a **lite single-threaded** ("funciona em qualquer host estático, sem
  configuração"): rede NNUE pequena, ainda muito acima de qualquer humano. Para um jogo cujo adversário
  é enfraquecido de propósito, é a escolha óbvia.
- **Carregar no Worker com Vite (testado em navegador real, `vite build` + `vite preview`):** copiar
  `stockfish-19-lite-single.js` e `.wasm` para `public/engine/` (o `.js` procura o `.wasm` ao lado e os
  dois precisam sair com MIME `text/javascript` e `application/wasm`). Nada de `import` do pacote no
  código do jogo. O script `ferramentas/copiar_motor.mjs` do projeto já faz esse papel; só precisa
  trocar os nomes de `18` para `19` ao atualizar. Copie também o `Copying.txt` (GPL) para junto.

```ts
const motor = new Worker(`${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`);
motor.onmessage = (e: MessageEvent<string>) => { /* linhas UCI: "bestmove e2e4 ponder e7e5" */ };
motor.postMessage("uci");
motor.postMessage("setoption name UCI_LimitStrength value true");
motor.postMessage("setoption name UCI_Elo value 1500");
motor.postMessage("isready");
motor.postMessage("position startpos moves e2e4");   // ou "position fen <FEN> moves ..."
motor.postMessage("go movetime 500");                 // ou "go depth 8" / "go nodes 20000"
```

  Resultado do teste no navegador: `crossOriginIsolated = false`, `SharedArrayBuffer` indefinido, e mesmo
  assim o motor respondeu `uciok`.
- **Opções UCI desta build (saída real do `uci` da v19 lite):**

```
option name Threads type spin default 1 min 1 max 1            (sem efeito na versão single)
option name Hash type spin default 16 min 1 max 33554432
option name MultiPV type spin default 1 min 1 max 256
option name Skill Level type spin default 20 min 0 max 20
option name Move Overhead type spin default 10 min 0 max 5000
option name UCI_LimitStrength type check default false
option name UCI_Elo type spin default 1320 min 1320 max 3190
option name UCI_ShowWDL type check default false
```

  - **Elo mínimo de `UCI_Elo`: 1320** (só vale com `UCI_LimitStrength=true`). Abaixo disso é preciso
    `Skill Level` (0 a 20, sem relação documentada com Elo) e/ou limitar `go depth 1..4` / `go nodes N`.
  - `MultiPV 3` funciona (confirmado: devolve 3 linhas `multipv` por profundidade). Útil para escolher
    "o segundo melhor lance" de propósito ou para dar dicas.
  - Para adversários **abaixo de ~1300**, o caminho natural é a fase 2 (Maia-1100/1200/1300), que erra
    como humano; o Stockfish enfraquecido erra de forma artificial.
- **itch.io e SharedArrayBuffer (fonte: tópico oficial da equipe do itch, abr/2022, atualizado depois):**
  é **opcional**: marca-se "SharedArrayBuffer support" em *Embed options > Frame options* do projeto
  HTML5. Quando ligado, o itch serve `Cross-Origin-Opener-Policy: same-origin` e
  `Cross-Origin-Embedder-Policy: require-corp` no jogo; avisos oficiais: o `localStorage` muda de
  domínio (salvamentos de quem já jogou somem), requisições a outros domínios (CDNs, fontes do Google)
  passam a falhar sem CORP, iframes de terceiros quebram, e o Safari ainda precisa de um *popup* de
  fallback. **Conclusão: use a build single-threaded e deixe a opção desligada.** Zero risco, zero
  cabeçalho especial. O ganho do multi-thread não vale para o jogo contra um adversário fraco.

## 5. Maia (adversário "humano", fase 2)

### 5.1 Maia-1 (1100 a 1900) — ONNX pronto e testado

- **Origem:** `CSSLab/maia-chess` (GitHub), nove redes `maia-1100 … maia-1900.pb.gz` no formato Leela
  (1,2–1,3 MB cada), na pasta `maia_weights/`. O README manda rodar com `go nodes 1` (sem busca) e diz
  que a rede prevê "o lance médio de um jogador daquele rating". Treinadas com partidas do Lichess de
  2017–2019.
- **ONNX pronto:** não há ONNX oficial dos autores, mas existe conversão de terceiros:
  `huggingface.co/cstr/maia-chess-onnx-opset15` (criado 14/06/2026, atualizado 03/09/2026), com
  `maia-1100.onnx … maia-1900.onnx` (**3,3 MB cada**, nove níveis), gerados com
  `lc0 v0.32.1 leela2onnx --onnx-data-type=f32`. **Use os `maia-<elo>.onnx`; os `*-opset15.onnx` do mesmo
  repositório estão quebrados** (o README do próprio repo avisa). Também há `lczerolens/maia-1100`
  (`model.onnx`, 3,3 MB, só o 1100). Como são terceiros, vale guardar o hash e, se possível, regerar
  com o lc0 a partir do `.pb.gz` oficial:

```bash
lc0 leela2onnx --input=maia-1500.pb.gz --output=maia-1500.onnx --onnx-data-type=f32
```

- **Formato (confirmado ao carregar o modelo no onnxruntime-web):**
  - entrada `/input/planes`: `float32 [batch, 112, 8, 8]` (codificação clássica do lc0);
  - saída `/output/policy`: `float32 [batch, 1858]` (logits, na ordem do vocabulário de lances do lc0);
  - saída `/output/wdl`: `float32 [batch, 3]` (já em probabilidade; ordem vitória/empate/derrota para quem joga).
- **Os 112 planos (verificado por teste):** 8 posições de histórico × 13 planos (6 peças próprias P,N,B,R,Q,K;
  6 do adversário; 1 de repetição) = 104; depois 104 = roque grande próprio, 105 = roque pequeno próprio,
  106/107 = os do adversário, 108 = 1 se as pretas jogam, 109 = contagem de 50 lances, 110 = zeros, 111 = tudo 1.
  **O tabuleiro é visto da perspectiva de quem joga: com pretas, espelhe os ranks (flip vertical)** e
  espelhe também o lance de saída. Indexação: casa = `linha*8 + coluna`, `linha 0` = rank 1.
- **Mapa da política (reconstruído e validado):** 1858 = 1792 lances "base" + 66 subpromoções. Os 1792
  vêm de percorrer as casas de origem `a1,b1,…,h1,a2,…,h8` e, para cada uma, listar os destinos
  (movimento de dama ou de cavalo) em ordem crescente do índice da casa de destino. Os 66 finais são as
  subpromoções (r/b/n) por coluna e direção. **Dama = lance sem sufixo.** Validei os 1792 primeiros:
  na posição inicial, Maia-1500 deu `e4 65%, d4 23%, c4 3%` (bate com o README do repo conversor:
  e4 > d4 > c4); com pretas após 1.e4 deu `Nf6/Nc6/d6/d5`; `Rd8#` apareceu em primeiro numa posição de
  mate em 1. **Não validei a ordem exata das 66 subpromoções** (raras no jogo humano; conferir com a
  tabela `kIndexToMove` do código-fonte do lc0 antes de liberar promoções para torre/bispo/cavalo).
- **Armadilha encontrada:** **não replique a posição atual nos 8 slots de histórico.** Com histórico
  replicado, a posição inicial deu `d4 19%, e3 16%, Nf3, g3` (distorcido). Com **só o slot 0 preenchido
  e o resto zero** deu o resultado certo. Em partida real, preencha com as posições anteriores de verdade
  (até 8), que é como a rede foi treinada.
- **Uso (testado em Node; no navegador a API é a mesma):**

```ts
import * as ort from "onnxruntime-web/wasm";            // entrada só-CPU, sem WebGPU
ort.env.wasm.numThreads = 1;                              // sem SharedArrayBuffer
ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}ort/`;  // copie dist/ort-wasm-simd-threaded.{mjs,wasm} para public/ort/
const sessao = await ort.InferenceSession.create(`${import.meta.env.BASE_URL}models/maia-1500.onnx`,
                                                 { executionProviders: ["wasm"] });
const saida = await sessao.run({ "/input/planes": new ort.Tensor("float32", planos112x64, [1, 112, 8, 8]) });
const politica = saida["/output/policy"].data as Float32Array;   // 1858 logits
// 1) para cada lance legal (chess.js), ache o índice no mapa; 2) softmax só entre os legais; 3) sorteie
//    pela probabilidade (opcional: temperatura) em vez de escolher o melhor.
```

- **Licença dos pesos:** o repositório `CSSLab/maia-chess` é **GPL-3.0** (confirmado na API do GitHub) e o
  README diz "available under the GPL License"; ele não tem uma licença separada só para os pesos. As
  conversões ONNX não relicenciam (o repo conversor declara GPL-3.0-or-later). Compatível com o projeto GPL-3.0,
  desde que o código-fonte e o aviso de licença/origem dos modelos vão junto.

### 5.2 Maia-2 e Maia-3

- **Maia-2** (`CSSLab/maia2`, código **MIT**): um único modelo condicionado por Elo próprio e do
  adversário (não são 9 arquivos). Conversão de terceiros: `cemoss17/maia2-onnx` → `maia2_rapid.onnx`
  (**81 MB**, sem README, sem licença declarada nos metadados). Não achei documentação de entrada/saída;
  teria que ser inferida do código `maia2` (a API recebe FEN, `elo_self`, `elo_oppo`). Se for por aí,
  o caminho de conversão é `torch.onnx.export` do modelo carregado com
  `model.from_pretrained(type="rapid")`. Custo-benefício ruim para um jogo de navegador (81 MB).
- **Maia-3** (`CSSLab/maia3`, **AGPL-3.0**; paper ICLR 2026; pesos em `UofTCSSLab/Maia3-79M` etc.): é o
  que os autores recomendam para projetos novos. Há ONNX de terceiros: `bqrio/maia3-onnx` (AGPL-3.0) com
  `maia3-5m.fp16.onnx` (**10,3 MB**), `5m.fp32` (20 MB), `23m.fp16` (43,7 MB), `79m.fp16` (149 MB);
  entrada `tokens float32 [batch,64,12]`, `elo_self`, `elo_oppo`, saídas `logits_move [batch,4352]` e
  `logits_value [batch,3]` (esse repo; **não testei** estes modelos). A AGPL é compatível com GPL-3.0 para
  combinar, mas traz a cláusula de uso em rede; para um jogo 100% no cliente não há "uso em rede", e
  mesmo assim convém registrar. O Maia-3 5M é tentador porque aceita **qualquer Elo (0–5000)** como entrada,
  ao contrário dos 9 degraus do Maia-1.
- **Recomendação:** começar a fase 2 com o **Maia-1** (3,3 MB por nível, licença GPL-3.0 simples,
  formato verificado). Avaliar o **Maia-3 5M** depois, se os 9 degraus de Elo não bastarem.

### 5.3 onnxruntime-web

- **1.30.0** (14/09/2026), MIT. Entrada `onnxruntime-web/wasm` (CPU). Arquivos relevantes:
  `ort-wasm-simd-threaded.wasm` **14,2 MB (3,7 MB gzip)** e `ort-wasm-simd-threaded.mjs` (24 KB). Os
  `.jsep.wasm` (28 MB) e `.asyncify.wasm` (27 MB) são para WebGPU e **não** devem ser publicados.
  Para modelos de 3 MB basta CPU. Peso total da fase 2 num `.zip` do itch: ~14 MB (wasm) + 3,3 MB por modelo.

## 6. Vitest

- **5.0.4** (12/10/2026), MIT. Exige Node `^22.12 || ^24 || >=26` e Vite `^6.4 || ^7 || ^8`; no ambiente
  (Node 22.17) funciona. `npm view vitest dist-tags`: `latest` 5.0.4, `V4` 4.1.11, `V3` 3.2.7. O
  `package.json` do projeto usa 5.0.2.

```ts
// src/regras.test.ts  (testado: 1 passed)
import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
describe("regras", () => {
  it("mate do pastor", () => {
    const c = new Chess();
    ["e4","e5","Bc4","Nc6","Qh5","Nf6","Qxf7#"].forEach(m => c.move(m));
    expect(c.isCheckmate()).toBe(true);
  });
});
```

  Comando: `npx vitest run`. Para lógica pura (regras, ink, mapa de política do Maia, i18n) o ambiente `node`
  padrão basta; não precisa de jsdom.

## 7. Áudio ambiente, efeitos e fontes

### Sons CC0 (Freesound; licença conferida na página de cada som)

Filtro útil na busca: `https://freesound.org/search/?q=<termo>&f=license%3A%22Creative+Commons+0%22`.
CC0 dispensa atribuição e é compatível com GPL-3.0 (ainda assim vale listar os autores no `CREDITS`).

| Uso | Som | Autor / ID | Conferido |
|---|---|---|---|
| Peça colocada | "Piece Placement.mp3" (0,11 s, estalo leve em tabuleiro de madeira) | el_boss — `freesound.org/s/546119/` (pacote "Chess Puzzle Blitz SFX"; do mesmo autor: "Board Start", 546121) | CC0 na página |
| Peça movida (perto/longe) | "Chess Pieces Move (Close/Far)" | JJTaynos — 733927 / 733932 | CC0 pelo filtro de busca |
| Peça/xadrez | "chess_move_on_alabaster.wav" (72 ms, mono, 8 kHz, só 1,4 KB) | mh2o — 351518 | CC0 na página; qualidade baixa (8 kHz) |
| Ambiente | "Ambience-cafe001.wav" (6 min 20 s, 48 kHz 16-bit estéreo, 69,6 MB WAV) | samyi — 382314 | CC0 na página. **Cuidado:** é uma Starbucks em Pequim com música ao fundo; serve como textura, não como "salão dos anos 50". Converter para OGG/MP3 em loop |
| Ambiente (relógio de sala) | "small clock in room" | Yuval — 211192 | CC0 pelo filtro de busca |

Outras fontes CC0 com licença verificada: **Kenney** (`kenney.nl`, CC0 declarado no site, sem atribuição
obrigatória, uso comercial liberado) e OpenGameArt (cada item tem a licença na página; filtrar por CC0).
Para música dos anos 50 (jazz, rádio), procurar por "public domain" no Internet Archive com cuidado: gravação
e composição têm direitos separados; não verifiquei nenhuma faixa. Os resultados de busca do Freesound têm
durações em formato inconsistente; confira a duração na página antes de baixar.

### Fontes (Google Fonts, licença conferida no `METADATA.pb` do repositório `google/fonts`)

| Fonte | Licença | Estilo / uso sugerido |
|---|---|---|
| **Abril Fatface** | OFL | didone gordo de cartaz dos anos 50 — títulos |
| **Bevan** | OFL | slab serifado pesado, jornal/cartaz — títulos |
| **Limelight** | OFL | art déco, marquise de cinema — logotipo/capítulos |
| **Old Standard TT** | OFL | texto corrido de livro antigo — legibilidade em diálogos |
| **Playfair Display** | OFL | serifa de revista — subtítulos |
| **Courier Prime** / **Cutive Mono** | OFL | máquina de escrever — cartas, notas, telegramas |
| **Pacifico** | OFL | script de letreiro dos anos 50 (usar com moderação) |
| ~~Special Elite~~, ~~Yellowtail~~ | **Apache-2.0**, não OFL | evitar se a exigência for OFL |

Combinação sugerida: Abril Fatface (títulos) + Old Standard TT (texto) + Courier Prime (documentos).
Importante por causa do itch.io: **hospede as fontes no próprio jogo** (baixar o `.woff2` para
`public/fonts/` com `@font-face`) em vez de usar o CDN do Google. Isso evita requisição a outro domínio
(quebra se a opção de SharedArrayBuffer for ligada), dispensa conexão externa e respeita privacidade.
A OFL permite redistribuir a fonte junto do jogo, desde que o arquivo de licença acompanhe.
Importante para o Phaser: a fonte precisa estar carregada antes do primeiro `add.text` (ex.: `document.fonts.load("1em 'Abril Fatface'")` no `preload`).

---

## Riscos técnicos

1. **Maia-1 sem ONNX oficial e com mapa de política não documentado.** A conversão pronta é de um terceiro
   (um repo irmão tem arquivos reconhecidamente quebrados), e a tabela de 1858 lances e a codificação dos
   112 planos precisam ser reimplementadas por nós. Já reconstruí e validei a parte principal (1792 lances,
   espelhamento das pretas, histórico zerado), mas a ordem das 66 subpromoções não foi conferida e um
   erro de histórico/espelho "funciona" mas joga mal em silêncio. Mitigação: regerar os `.onnx` do `.pb.gz`
   oficial com `lc0 leela2onnx`, e testes Vitest com posições de referência (inicial, após 1.e4, mate em 1).
2. **Peso e carga inicial no itch.io.** Phaser+chess.js+ink = 1,5 MB, Stockfish lite = 1,9 MB, mas o
   onnxruntime-web traz 14 MB de wasm (3,7 MB gzip) mais os modelos; o itch limita o `.zip` e a carga em
   celular é lenta. Mitigação: carregar Stockfish e Maia sob demanda (só ao entrar na partida), só a entrada
   `onnxruntime-web/wasm`, e não publicar os wasm de WebGPU/asyncify. E não ligar a opção de
   SharedArrayBuffer do itch (ela quebra `localStorage` existente, CDNs e iframes de terceiros).
3. **Versões muito novas e movimentando-se rápido; licenças copyleft.** Phaser 4 tem 3 meses de vida (o
   template oficial ainda aponta 4.0.0/Vite 6), Vite 8 usa bundler novo (Rolldown), TypeScript 7 é o
   compilador nativo e o Stockfish 19 saiu há um mês (o projeto está no 18.0.8, com nomes de arquivo
   diferentes). Testei o conjunto Phaser 4.2.1 + Vite 8.3.4 + TS 5.9.3/7.0.2 + Vitest 5.0.4 e passou,
   mas convém fixar versões exatas e commitar o `package-lock.json`. Do lado legal: Stockfish e Maia-1 são
   GPL-3.0 (ok com o projeto), mas o Maia-3 é AGPL-3.0 e os pesos de terceiros do Maia-2/3 no Hugging Face
   têm licenças declaradas inconsistentes; registrar a origem de cada arquivo em um `CREDITS`/`LICENSES`
   e distribuir o código-fonte junto com o jogo.
