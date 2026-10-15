# Rumo ao Trono

Jogo narrativo de xadrez: você vive a carreira de um enxadrista numa época
real, da praça do bairro ao match pelo título mundial. Primeira época:
**Riga, 1950–1960**, crescendo no mesmo meio que Mikhail Tal.

> Protótipo. Hoje dá para jogar o **capítulo 1** (o parque do bairro, outono
> de 1950), o **capítulo 2** (o Palácio dos Pioneiros, 1951: o torneio
> interno da turma, com relógio mecânico e tabela na parede) e o
> **capítulo 3** (o primeiro torneio de adultos, 1952: partida adiada, lance
> secreto no envelope e a noite de análise em casa) e o **capítulo 4** (a
> final do campeonato da Letônia de 1953: vinte jogadores, dezenove rodadas, as
> partidas decisivas jogadas e o resto simulado).
> O que o jogo é e por quê: [`docs/DESIGN.md`](docs/DESIGN.md).

**Jogar agora:** https://hirano28.github.io/rumo-ao-trono/ (no computador, ou
no celular deitado).

## Rodar

Precisa de Node 22.12 ou mais novo.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. O `npm run dev` copia o Stockfish de
`node_modules` para `public/motor/` antes de subir.

## Verificar

```bash
npm run check
```

Roda o `tsc` e os testes (Vitest). Os testes conferem a lógica de força e
categoria, o sorteio de lances do adversário, a leitura do UCI, o salvamento e
**o conteúdo da época**: toda notícia precisa de fonte, nenhuma pode ter
confiança baixa, e todo texto precisa existir em português e em inglês.

## Publicar

```bash
npm run build
```

Todo push na `main` publica sozinho no GitHub Pages, depois de passar no `tsc`
e nos testes (`.github/workflows/publicar.yml`).

O `dist/` sai com caminhos relativos, pronto também para subir como jogo HTML no
itch.io (zipar o conteúdo de `dist/`). Não ligue a opção de SharedArrayBuffer
do itch.io: o Stockfish usado (lite, single-threaded) não precisa dela.

## Onde mora cada coisa

| Pasta | O quê |
|---|---|
| `conteudo/epocas/<época>/` | Tudo o que é da época: capítulos, adversários, diálogos, notícias (com fonte) e textos por idioma |
| `conteudo/interface/` | Textos de botões e telas, por idioma |
| `src/logica/` | Regras puras, testáveis: força, categoria, escolha de lance, UCI, progresso, conferência do conteúdo |
| `src/motor/` | O Stockfish no Web Worker e o lance do adversário |
| `src/cenas/` | As cenas do Phaser: Titulo, Abertura, Quarto, Praca, Partida, Resultado |
| `src/ui/` | Estilo, componentes, tabuleiro |
| `docs/pesquisa/` | A ficha de fatos históricos (com fontes) e a pesquisa de tecnologia |
| `testes/` | Testes do Vitest |

## Licença

GPL-3.0-or-later (ver `LICENSE`). Créditos de terceiros em
[`CREDITOS.md`](CREDITOS.md).
