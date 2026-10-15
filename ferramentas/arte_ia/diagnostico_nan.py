"""Diagnóstico da "imagem preta" (NaN) da GTX 16xx em fp16: roda poucos passos
e diz se o NaN nasce no U-Net ou no decodificador (VAE), com e sem atenção em
precisão completa. Uso: python ferramentas/arte_ia/diagnostico_nan.py
"""

import sys
from pathlib import Path

import torch

sys.path.insert(0, str(Path(__file__).parent))
import gerar  # noqa: E402
from diffusers import EulerDiscreteScheduler, StableDiffusionXLImg2ImgPipeline  # noqa: E402
from PIL import Image  # noqa: E402
from transformers import CLIPTokenizer  # noqa: E402


def main() -> None:
    pedido = {k: t.to("cuda", torch.float16) for k, t in torch.load("fotos/ia/_pedido.pt").items()}
    unet = gerar.unet_na_gpu()
    pipe = StableDiffusionXLImg2ImgPipeline(
        vae=gerar.vae(),
        text_encoder=None,
        text_encoder_2=None,
        tokenizer=CLIPTokenizer.from_pretrained(gerar.REPO, subfolder="tokenizer"),
        tokenizer_2=CLIPTokenizer.from_pretrained(gerar.REPO, subfolder="tokenizer_2"),
        unet=unet,
        scheduler=EulerDiscreteScheduler.from_pretrained(gerar.REPO, subfolder="scheduler"),
    )
    pipe.vae.enable_tiling()
    inicial = Image.open("fotos/esbocos/quarto.png").convert("RGB").resize((gerar.LARGURA, gerar.ALTURA))

    def rodar(rotulo: str) -> None:  # noqa: F841 (variantes já testadas)
        with torch.no_grad():
            latentes = pipe(**pedido, image=inicial, strength=0.6, num_inference_steps=6, output_type="latent").images
        print(rotulo, "latentes com NaN:", bool(torch.isnan(latentes).any()), flush=True)
        if not torch.isnan(latentes).any():
            with torch.no_grad():
                imagem = pipe.vae.decode(latentes / pipe.vae.config.scaling_factor).sample
            print(rotulo, "imagem com NaN:", bool(torch.isnan(imagem).any()), flush=True)

    gerar.calcular_em_fp32(pipe.unet)
    gerar.calcular_em_fp32(pipe.vae)
    pipe.enable_attention_slicing()
    pedido32 = {k: t.float() for k, t in pedido.items()}
    with torch.no_grad():
        latentes = pipe(**pedido32, image=inicial, strength=0.6, num_inference_steps=6, output_type="latent").images
    print("calculando em fp32: latentes com NaN:", bool(torch.isnan(latentes).any()), "| pico de VRAM GB:", round(torch.cuda.max_memory_allocated() / 1e9, 2), flush=True)


if __name__ == "__main__":
    main()
