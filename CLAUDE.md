# Rumo ao Trono — instruções para agentes

Responda em português do Brasil. O que o jogo é e por quê: `docs/DESIGN.md`.
Como rodar e onde mora cada coisa: `README.md`.

## Regras

1. **Fato histórico só com fonte.** Toda notícia de `noticias.json` leva
   `fonte` e `confianca` (alta ou média; baixa não entra). Antes de escrever
   fala ou notícia nova, confira na ficha `docs/pesquisa/fatos_1950_1960.md`;
   o que não estiver lá, pesquise e acrescente à ficha com a URL. Use só a
   precisão de data que a fonte sustenta (`"1950"`, `"1950-05"`).
2. **Nenhum texto visível no código.** Todo texto vai por chave em
   `conteudo/**/textos.<idioma>.json`, nos dois idiomas, com as mesmas chaves.
   O teste `testes/conteudo.test.ts` acusa a falta.
3. **O código não sabe a época.** Lugar, ano, personagem e adversário moram em
   `conteudo/epocas/<época>/`; a cena só lê.
4. **A fonte de máquina de escrever (Special Elite) desenha mal o travessão.**
   Não use "—" em texto mostrado nela (abertura, datas, "próximo capítulo").
5. **Versões exatas** no `package.json`, de pacote publicado há pelo menos duas
   semanas.

## Arte

Vetorial, em `public/arte/` (estilo em `docs/DESIGN.md` §7). Personagem novo:
acrescente a ficha em `ferramentas/gerar_personagens.mjs`, rode o script e
ponha o id em `PERSONAGENS` de `src/ui/arte.ts` (o teste de conteúdo acusa a
falta). Na cena, `y` do personagem é o chão (os pés). Os pontos clicáveis dos
cenários (objetos do quarto, quadro e vitrine do Palácio) têm de bater com o
desenho: mudou a arte, confira as posições e fotografe.

## Arte pintada (Stable Diffusion XL, no PC do dono)

Desde 15/10/2026 os cenários passam a ser pintados pelo SDXL a partir dos SVGs
(img2img: o SVG segura a composição e os pontos clicáveis). Ambiente fora do
repo: `C:/edson/ferramentas/sdxl/` (venv com torch CUDA, modelos em `hf/`).
Fluxo: `node ferramentas/arte_ia/esbocos.cjs` (SVG → esboço PNG) →
`ferramentas/arte_ia/gerar.py` (lote; saídas em `fotos/ia/`) → escolher a
melhor → `ferramentas/arte_ia/finalizar.py` (para `public/arte/pintado/`) →
pôr o nome em `PINTADOS` (`src/ui/arte.ts`) e acertar os pontos clicáveis.
Armadilhas da GTX 1660 Super (6 GB) com 16 GB de RAM, todas já contornadas no
`gerar.py`: NaN em fp16 (pesos em fp16, conta em fp32 por camada), o
`safetensors` novo quebra lendo por mapeamento de memória (leitor próprio),
U-Net direto para a GPU, textos num processo separado. Cada imagem leva ~6 min
com o PC livre; com pouca memória livre fica muitas vezes mais lento — o dono
prefere rodar de madrugada (`ferramentas/arte_ia/noturno.cmd`).

## Servidor

Supabase, projeto `pwmtabunzjcjnnhfewno` (só deste jogo; NÃO é o do
xadrez-treinamento). Tabelas, segurança e consultas em `docs/SERVIDOR.md`;
migrações em `supabase/migracoes/` (aplicar pelo MCP do Supabase e guardar o
SQL ali). O jogo nunca espera o servidor: o progresso vale no navegador, o
servidor guarda cópia e histórico. Teste de conta: `ferramentas/telas/conta.cjs`
(cria conta de teste: apague depois pelo SQL).

## Verificação

- `npm run check` (tsc + Vitest) antes de todo commit.
- Tela de verdade: o painel do navegador escondido congela o
  `requestAnimationFrame`, e o jogo para. Use Playwright headless (há um em
  `C:/edson/projetos/chess-ai-pipeline/frontend/node_modules/playwright`). A
  instância do jogo fica em `window.jogo`; a cena da partida expõe `partida`
  (chess.js) e `tabuleiro`.
- Percursos prontos em `ferramentas/telas/` (com `npm run dev` no ar):
  `node ferramentas/telas/percurso.cjs <url> <pasta> [en]` joga o capítulo 1
  inteiro e fotografa; `resultado.cjs` confere a tela de resultado;
  `pretas.cjs`, o tabuleiro virado e a promoção; `capitulo2.cjs`, a passagem
  de capítulo, o Palácio, o torneio, o relógio e a bandeira; `sem_motor.cjs`,
  a partida seguindo sem motor; `capitulos.cjs`, a tela de capítulos (entrar
  direto no 2, rejogar o 1 na força histórica). Fotos vão para `fotos/`
  (fora do git).
- O adversário humano é o Maia em ONNX (`public/maia/`). Para regerar:
  `node ferramentas/converter_maia.mjs` (precisa do lc0 e dos pesos oficiais
  em `C:/edson/ferramentas/lc0/`). Mexeu na codificação? Regere a referência
  com `node ferramentas/referencia_maia.mjs`; `testes/maia.test.ts` compara a
  rede no onnxruntime com o lc0, lance a lance. Para ler partidas inteiras
  entre adversários: `MEDIR=1 npx vitest run testes/medicao_adversarios`.
- Coordenadas da tela: 1280×720; o tabuleiro começa em (92, 72), com 72 px por
  casa.
