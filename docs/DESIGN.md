# Rumo ao Trono — documento de design

> Nome provisório. Versão 0.1 (14/10/2026). Este documento descreve **o que** o
> jogo é e **por que**; o estado do código mora no `git log` e no `README.md`.

## 1. Em uma frase

Você vive a carreira de um enxadrista numa época real — da praça do bairro ao
match pelo título mundial — cercado pelas notícias, pelos lugares e pelos
jogadores que de fato existiram.

## 2. Para quem

Enxadristas que já sabem jogar (o jogo não ensina as regras). O primeiro público
são os amigos enxadristas do autor; o objetivo é um jogo que circule por link,
de graça, e dê reputação ao autor. Venda fica para depois, se fizer sentido.

## 3. Pilares (o que não se negocia)

1. **A época é verdadeira.** Todo fato histórico mostrado tem fonte registrada
   (seção 9). Notícia sem fonte não entra no jogo — o teste automático barra.
2. **O xadrez é de verdade.** Partidas inteiras, regras completas, adversários
   que erram como gente do nível deles, não como motor capado.
3. **A carreira se sente.** O que emociona é o caminho: a primeira vitória na
   praça, o silêncio do clube, a conversa antes da rodada, o lance secreto no
   envelope. O texto e o som carregam isso mais que o gráfico.
4. **O tempo do jogador é respeitado.** Ninguém joga 24 partidas de 5 horas:
   ritmo comprimido, partidas decisivas jogadas, o resto simulado.

## 4. Estrutura

**Época = um ciclo do campeonato mundial**, vivido desde a infância do
personagem. A primeira época é **Riga, 1950–1960**: o jogador é um menino de
Riga (Letônia soviética) que cresce no mesmo meio que Mikhail Tal e termina
desafiando-o pelo título.

A nacionalidade do personagem é a que mais faz sentido para cada época.

Cada época é dividida em **capítulos**. Entre capítulos, o tempo salta (meses
ou anos), com uma montagem de notícias da época.

### 4.1 O ciclo de um capítulo

1. **Contexto** — texto de abertura (ano, lugar, o que acontece no mundo).
2. **Exploração** — um ou mais lugares (o quarto, a praça, o clube) com objetos
   e pessoas para interagir. Objetos mostram notícias, livros, revistas reais
   da época; pessoas conversam (fofoca de clube, notícias, dicas).
3. **Desafio** — uma série de partidas contra adversários de força conhecida,
   com uma pontuação mínima para avançar.
4. **Resultado** — nova categoria/rating, uma cena de consequência, o salto no
   tempo para o próximo capítulo.

Perder um desafio **não trava o jogo**: há uma cena de derrota (que faz parte
de qualquer carreira real) e o jogador pode tentar de novo.

### 4.2 Capítulos da época 1 (rascunho)

| # | Ano | Lugar | Desafio |
|---|-----|-------|---------|
| 1 | 1950 | Quarto e praça do bairro | 3 partidas contra iniciantes (800/900/1050) |
| 2 | 1951 | Palácio dos Pioneiros (Castelo de Riga) | Torneio interno da turma de Jānis Krūzkops, com relógio |
| 3 | 1952 | Torneio de adultos de Riga | Primeiro torneio de adultos, com partida adiada |
| 4 | 1953 | Final do campeonato da Letônia | Candidato a mestre |
| 5 | 1954 | Match pelo título de mestre | Mestre do esporte |
| 6 | 1957 | Final do campeonato da URSS | Entre os melhores do país |
| 7 | 1958 | Interzonal de Portorož | Vaga no Candidatos |
| 8 | 1959 | Candidatos (Iugoslávia) | Direito de desafiar o campeão |
| 9 | 1960 | Match em Moscou | O título |

Os anos e lugares seguem as fichas de fatos (`docs/pesquisa/fatos_1950_1960.md`
e `docs/pesquisa/fatos_1951_cap2.md`). A ficha do capítulo 2 corrigiu o
roteiro: quem dava aula de xadrez no Palácio era Jānis Krūzkops (1946–1960),
não Koblencs; em 1951 Koblencs é mestre e adversário de Tal, não treinador.

Capítulos 1 e 2 no ar (14/10/2026); capítulos 3 (o torneio dos adultos, com
partida adiada) e 4 (a final da Letônia de 1953, torneio grande) em
15/10/2026, com a ficha `docs/pesquisa/fatos_1952_1953.md`; capítulo 5 (o
match de mestre de 1954) e 6 (a final da URSS de 1957) em 16/10/2026, com as
fichas `docs/pesquisa/fatos_1954.md` e `docs/pesquisa/fatos_1955_1957.md`.

### 4.2.3 Match

Um desafio pode ser um match contra um só adversário (`desafio.match`), como o
match pelo título de mestre. Cada partida tem id próprio, `adversario@n`, e as
cores se alternam (a da ficha nas ímpares). Só as partidas decisivas
(`desafio.adversarios`) são jogadas; as outras são simuladas pela força dos
dois, com a semente do progresso, e uma folha no salão conta as que passaram.
O quadro mostra o placar partida a partida. A aprovação conta o match inteiro.
O desafio pode dar um título (`desafio.conquista`, ex.: mestre do esporte).
O título vale dali em diante: a tela de resultado mostra o maior título dos
capítulos vencidos até o atual, e a força calculada não o rebaixa (rejogar um
capítulo anterior não mostra o título que veio depois).

### 4.2.2 O arco da história (rascunho de 15/10/2026)

A linha que amarra os capítulos é **você e o Misha**: dois garotos do mesmo
Palácio, um ano de diferença, que crescem um à sombra do outro. O Tal
histórico anda sempre meio passo à frente (as fichas dizem onde ele estava em
cada ano); a pergunta do jogo é se você o alcança. Cada capítulo também
apresenta uma prática de torneio da época, de modo que a mecânica nova é ela
mesma um pedaço da história.

| # | Quando | Você | O Tal histórico | Mecânica nova |
|---|---|---|---|---|
| 1 | out 1950 | 13 anos, o parque | campeão juvenil da Letônia | partidas livres, calibração |
| 2 | mai 1951 | 14, o Palácio | já joga torneios de adultos | relógio, torneio em turno único |
| 3 | out 1952 | 15, primeiro torneio de adultos | 7º no campeonato letão; perde para Zilber | **partida adiada**, lance secreto, análise em casa |
| 4 | 1953 | 16, final do campeonato da Letônia | campeão letão aos 16 | **rodadas decisivas jogadas, as outras simuladas** (torneio de 20) |
| 5 | 1954 | 17, o match pelo título de mestre | match com Saigin, +4 −2 =8 | **match** (série contra um só adversário) |
| 6 | 1957 | 20, final do campeonato da URSS, Moscou | campeão da URSS aos 20 | os gigantes: Keres, Bronstein, Spassky, Petrosian |
| 7 | 1958 | 21, Interzonal de Portorož | 1º; Fischer, 15 anos, se classifica | o mundo de fora: viagem, imprensa estrangeira |
| 8 | 1959 | 22, Candidatos (Bled, Zagreb, Belgrado) | 1º; 4 a 0 em Fischer | você e o Misha disputando a mesma vaga |
| 9 | 1960 | 23, o match em Moscou | campeão do mundo | o match pelo título |

A partir do capítulo 4 a história alternativa (§4.3) passa a valer de fato:
se você termina à frente do Tal, as notícias seguintes dizem isso. **Decisão
em aberto (do dono):** quem senta do outro lado no match final — Botvinnik
(você tomou a vaga do Tal no Candidatos) ou o próprio Tal (campeão em 1960,
você o desafia depois). O capítulo 9 só precisa dela quando chegar a vez dele.

### 4.2.1 Torneios

Um desafio pode ser um torneio em turno único. O jogador enfrenta os
adversários na ordem das rodadas (só o da rodada oferece partida); os jogos
entre os outros são simulados pela expectativa do Elo, com chance de empate
que cai com a diferença de força, e um resultado fixo por jogo salvo (semente
no progresso). A tabela fica num quadro na parede e só mostra as rodadas já
jogadas; a rodada de folga do jogador entra na classificação final.

**Torneio grande** (desde o capítulo 4): ninguém joga dezenove partidas. O
conteúdo dá a ordem dos rivais do jogador, rodada a rodada (`torneio.ordem`);
o calendário dos outros sai do método do círculo (tabelas de Berger,
`src/logica/calendario.ts`). Só as partidas decisivas (`desafio.adversarios`)
são jogadas; as outras do jogador são simuladas como as dos outros, com a
força dele no começo do capítulo. Ao voltar ao salão, uma folha conta as
rodadas que passaram (os resultados simulados e os acontecimentos entre as
rodadas, `torneio.eventos`). A aprovação conta os pontos do torneio inteiro; a
força calculada no fim conta só as partidas jogadas. Quem termina em primeiro
lê o fechamento de campeão: é ali que a história alternativa (§4.3) começa.

### 4.3 História alternativa

A história segue o que de fato aconteceu **até o jogador interferir**. Quando
ele toma uma vaga real (por exemplo, no Candidatos), as notícias passam a
refletir o desempenho dele. Fatos de fora do mundo do personagem continuam
reais.

## 5. Força, rating e dificuldade

### 5.1 Força escondida, categoria na tela

Em 1950 não existia rating Elo (a federação americana o adotou em 1960; a FIDE,
em 1970). O jogo calcula uma **força** interna em escala Elo, mas mostra ao
jogador o que um enxadrista soviético da época conhecia: a **categoria**
(3ª, 2ª, 1ª, candidato a mestre, mestre do esporte) e, depois, os títulos.

### 5.2 Calibração por desafio

O jogador começa sem força definida. Cada desafio tem adversários de força
conhecida; ao fim, a força do jogador passa a ser a **performance** no desafio:

```
performance = média da força dos adversários + 400 × (vitórias − derrotas) / partidas
```

limitada a ±400 da média, e nunca abaixo da força anterior menos 100 (um
desafio ruim não apaga a carreira). Avançar exige a pontuação mínima do
desafio (ex.: 2 de 3 pontos; empate vale meio).

### 5.3 Dois modos

- **Carreira (padrão).** O rating mostrado na história é o real da época (Tal
  tem força de campeão do mundo), mas a **força no tabuleiro** de cada
  adversário é calculada a partir da força do jogador:
  `força_bot = força_jogador + degrau_do_adversário`. O degrau sobe ao longo da
  época (na praça, de −200 a +50; no match final, +150). Assim um jogador de
  1600 termina o jogo, e ele sempre enfrenta alguém um pouco acima dele.
- **Realista (opcional).** A força no tabuleiro é a força histórica estimada
  do adversário. Para quem quer saber se ganharia do Tal de verdade.

### 5.4 Adversários que jogam como gente

- **Até a força 2000: Maia** (rede treinada em milhões de partidas humanas,
  níveis 1100 a 1900), rodando no navegador em ONNX. O adversário sorteia o
  lance pela probabilidade humana, cortando a cauda de lances que quase
  ninguém jogaria (núcleo de 97%). Abaixo de 1100, a rede de 1100 com a
  política "esquentada". Assim ele abre, desenvolve e erra como gente.
  A conversão é conferida lance a lance contra o lc0 oficial.
- **Acima de 2000: Stockfish** no navegador com sorteio entre os melhores
  lances (MultiPV) ponderado pela força, mais erros ocasionais.
- **Histórico:** a primeira versão do capítulo 1 usava o Stockfish em todos os
  níveis; os erros saíam absurdos (1...h5, Na3), não humanos. O dono apontou
  em 14/10/2026, e o Maia entrou antes do capítulo 2.
- **Estilo dos jogadores reais:** livro de aberturas tirado das partidas reais
  do jogador naquele período, mais ajustes de estilo (o Tal aceita mais
  complicação).

## 6. Tempo

Cada desafio define o **relógio da história** (ex.: 2 horas por jogador) e o
**relógio real** (ex.: 15 min). A tela mostra um relógio mecânico com
ponteiros, no tempo da história: a bandeira cai às 6:00. Sem incremento,
porque relógio de 1951 não tinha (o incremento faria o tempo passar de 2h00).

**Adiamento** (desde o capítulo 3, 15/10/2026): nos torneios de adultos, a
partida que chega ao 40º lance das pretas é adiada. Quem tem a vez escreve o
lance secreto (o jogador faz o lance, que vai para o envelope e não para o
tabuleiro; o adversário escolhe o dele sem mostrar). À noite, em casa, a
posição fica montada no tabuleiro do avô para analisar, mexendo os dois lados;
quem selou analisa depois do próprio lance. Na retomada o árbitro abre o
envelope, faz o lance, e cada um ganha mais uma hora da história. O envelope
fica guardado no progresso: dá para fechar o jogo e voltar de manhã.

Na praça, as partidas são sem relógio, como eram de fato.

## 7. Apresentação

- 2D ilustrado, estilo dos anos 50 (papel, tinta, tons sépia e verde-oliva).
  Desde 15/10/2026 a arte é vetorial (SVG, em `public/arte/`): traço escuro,
  cores chapadas com sombra lateral, luz quente, textura de papel e vinheta.
  Cenários: título (Riga do outro lado do Daugava), quarto, parque (fachadas
  Art Nouveau, bonde, banca), Palácio (paredes grossas do castelo, tabuleiro
  mural no cavalete, quadro do torneio, vitrine) e as duas mesas de partida.
  Personagens gerados por `ferramentas/gerar_personagens.mjs` a partir de uma
  ficha (idade, cabelo, roupa de época, acessórios), em dois quadros (olhos
  abertos e fechados): respiram e piscam na cena, e o retrato de quem fala
  aparece na caixa de diálogo. Tal, Krūzkops e Gipslis são estilizados, sem
  pretensão de retrato fiel. Vida no cenário: poeira na luz, folhas caindo.
  O dono achou o SVG "desenho de paint" (15/10/2026) e aprovou a direção
  **pintada**: os cenários e personagens passam a ser pintados pelo Stable
  Diffusion XL no PC dele, a partir dos SVGs (que seguram a composição). O
  quarto já está pintado; o resto sai do lote noturno.
- Texto no lugar de dublagem; muito som de ambiente (relógio mecânico, peças
  batendo na madeira, conversa ao fundo, rua de Riga).
- Tabuleiro de madeira com peças Staunton desenhadas no próprio jogo.

## 8. Idiomas

Português do Brasil e inglês desde o primeiro dia. Todo texto visível mora em
arquivos por idioma, com as mesmas chaves; o teste automático acusa chave que
existe num idioma e falta no outro. Os personagens "falam" o idioma do jogador,
com poucas palavras russas ou letãs para dar sabor.

## 9. Conteúdo como dados

O código não sabe que é 1950. Cada época é uma pasta de dados:

```
conteudo/epocas/riga-1950/
  epoca.json         nome, anos, capítulos
  capitulos/*.json   lugares, objetos, conversas, desafio
  adversarios.json   força, degrau, estilo, aberturas
  noticias.json      cada notícia com data, texto (chaves) e FONTE
  textos.pt-BR.json  textos por chave
  textos.en.json
```

**Regra das fontes:** toda notícia e todo fato histórico citado em conversa
carrega `fonte` (URL ou referência bibliográfica) e `confianca`. O teste
automático falha se faltar. Nenhum texto ou foto de jornal da época é copiado:
os textos são nossos, escritos a partir dos fatos.

## 10. Tecnologia

TypeScript + Vite, Phaser 4 para cenas, chess.js para as regras, Stockfish
WebAssembly num Web Worker, Vitest para a lógica. Os diálogos do protótipo são
árvores simples em JSON (`dialogos.json`); o ink (inkjs) fica para quando o
roteiro precisar de variáveis e ramos mais ricos. Detalhes, versões e licenças
em `docs/pesquisa/tecnologia.md`. Código aberto sob GPL-3.0 (compatível com
Stockfish e Maia). Distribuição: link no itch.io.

## 11. Fatia vertical (MVP do protótipo)

O protótipo prova a sensação e a tecnologia, não o conteúdo:

1. Tela de título e escolha de idioma.
2. Texto de abertura: Riga, outono de 1950.
3. **O quarto**: jornal, revista, livro e tabuleiro clicáveis, com notícias
   reais de 1950.
4. **A praça**: conversar com os frequentadores e jogar o desafio de 3
   partidas (800/900/1050) contra o adversário da fase 1.
5. **Resultado**: força calculada, categoria mostrada, gancho para o capítulo 2.

Fora do protótipo: arte final, som final, Maia, capítulos 2–8, adiamento.
