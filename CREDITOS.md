# Créditos e licenças de terceiros

| O quê | Origem | Licença |
|---|---|---|
| Maia (pesos 1100–1900) | CSSLab, Universidade de Toronto (github.com/CSSLab/maia-chess), convertidos para ONNX com o `lc0 leela2onnx` (`ferramentas/converter_maia.mjs`) | GPL-3.0 |
| onnxruntime-web | pacote npm `onnxruntime-web` (Microsoft) | MIT |
| Stockfish.js 18 (lite, single-threaded) | pacote npm `stockfish` (Chess.com / nmrugg), copiado para `public/motor/` no build | GPL-3.0 |
| Peças "cburnett" (provisórias) | Colin M.L. Burnett, extraídas de `chessground@9.2.1`; ver `public/pecas/LEIAME.md` | GPLv2+ |
| Phaser 4 | pacote npm `phaser` | MIT |
| chess.js | pacote npm `chess.js` | BSD-2-Clause |
| Playfair Display, Lora | Google Fonts | OFL 1.1 |
| Special Elite | Google Fonts (Astigmatic) | Apache-2.0 |
| Courier Prime | Google Fonts (Quote-Unquote Apps) | OFL 1.1 |

## Arte

Cenários e personagens (`public/arte/`) são originais deste projeto,
desenhados em SVG (GPL-3.0). Os personagens saem de
`ferramentas/gerar_personagens.mjs`.

As versões pintadas (`public/arte/pintado/`) foram geradas com o Stable
Diffusion XL 1.0 (Stability AI, licença CreativeML Open RAIL++-M) e o VAE
`madebyollin/sdxl-vae-fp16-fix`, a partir dos SVGs do projeto. Se o jogo for
vendido, a arte gerada por IA precisa ser declarada (Steam, por exemplo).

## Conteúdo histórico

Os textos das notícias e conversas são nossos, escritos a partir de fatos.
Nenhum texto ou foto de jornal da época foi copiado. A fonte de cada fato está
em `conteudo/epocas/<época>/noticias.json` e na ficha
`docs/pesquisa/fatos_1950_1960.md` (e nas fichas de 1951 e de 1952–1953).

Personagens do parque (Pēteris, Grigori Lvovich, senhor Ozols, dona Marta), da
turma do Palácio (Valdis, Ilze, Boris) e do torneio de adultos (Arvīds
Kalniņš, major Sokolov, Zenta Liepiņa, o árbitro) são fictícios. Mikhail Tal,
Jānis Krūzkops, Aivars Gipslis, Israel Zilber, Aleksandrs Koblencs, Jānis
Kļaviņš e os outros finalistas do campeonato da Letônia de 1953 existiram; as cenas e falas deles são ficção,
escrita a partir do que eles próprios contaram ou do que as fontes da ficha
registram (por exemplo, Tal chegando ao Palácio atrás do grupo de teatro).
