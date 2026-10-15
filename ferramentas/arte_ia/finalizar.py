"""Leva as imagens escolhidas (de fotos/ia/) para o jogo (public/arte/pintado/).

- cenário: vira JPEG 1280×720 (leve para o navegador);
- personagem: o fundo cinza sai (rembg), a imagem é aparada até a silhueta e
  fica com 560 px de altura, em PNG com transparência (pés na base).

Uso:
  python ferramentas/arte_ia/finalizar.py cenario quarto fotos/ia/quarto-f0.55-s5.png
  python ferramentas/arte_ia/finalizar.py personagem ozols fotos/ia/personagem-ozols-f0.65-s1.png
"""

import sys
from pathlib import Path

from PIL import Image

DESTINO = Path("public/arte/pintado")
ALTURA_DO_PERSONAGEM = 560


def cenario(nome: str, origem: str) -> Path:
    destino = DESTINO / f"{nome}.jpg"
    destino.parent.mkdir(parents=True, exist_ok=True)
    Image.open(origem).convert("RGB").resize((1280, 720), Image.LANCZOS).save(destino, quality=86, optimize=True)
    return destino


def personagem(nome: str, origem: str) -> Path:
    from rembg import new_session, remove

    sessao = new_session("isnet-general-use")
    recortado = remove(Image.open(origem).convert("RGB"), session=sessao, post_process_mask=True)
    # tira o resto de fundo quase transparente e apara até a silhueta
    alfa = recortado.getchannel("A").point(lambda a: 0 if a < 24 else a)
    recortado.putalpha(alfa)
    caixa = alfa.getbbox()
    if not caixa:
        sys.exit(f"Nada sobrou de {origem} depois do recorte.")
    recortado = recortado.crop(caixa)
    largura = round(recortado.width * ALTURA_DO_PERSONAGEM / recortado.height)
    destino = DESTINO / "personagens" / f"{nome}.png"
    destino.parent.mkdir(parents=True, exist_ok=True)
    recortado.resize((largura, ALTURA_DO_PERSONAGEM), Image.LANCZOS).save(destino, optimize=True)
    return destino


if __name__ == "__main__":
    if len(sys.argv) != 4 or sys.argv[1] not in ("cenario", "personagem"):
        sys.exit(__doc__)
    tipo, nome, origem = sys.argv[1:]
    print(cenario(nome, origem) if tipo == "cenario" else personagem(nome, origem))
