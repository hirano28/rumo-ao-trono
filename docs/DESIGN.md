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
| 2 | 1951 | Palácio dos Pioneiros | Torneio interno; entrar na turma do treinador |
| 3 | 1952–53 | Clube de Riga | Torneio de clube; 3ª → 2ª categoria |
| 4 | 1954–55 | Campeonato de Riga / da Letônia | 1ª categoria, candidato a mestre |
| 5 | 1956–57 | Semifinal e final do campeonato da URSS | Mestre do esporte |
| 6 | 1958 | Interzonal de Portorož | Vaga no Candidatos |
| 7 | 1959 | Candidatos (Iugoslávia) | Direito de desafiar o campeão |
| 8 | 1960 | Match em Moscou | O título |

Os anos e lugares serão ajustados pela ficha de fatos
(`docs/pesquisa/fatos_1950_1960.md`).

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

Cada desafio define o **relógio da história** (ex.: 2h por 40 lances) e o
**relógio real** (ex.: 10 min + 5 s). A tela mostra o relógio da história,
convertido em escala. Partidas longas podem ter **adiamento** com lance
secreto (a partir do capítulo de clube).

Na praça, as partidas são sem relógio, como eram de fato.

## 7. Apresentação

- 2D ilustrado, estilo dos anos 50 (papel, tinta, tons sépia e verde-oliva).
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
