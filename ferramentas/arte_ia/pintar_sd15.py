"""Pinta a arte do jogo com o DreamShaper 8 (Stable Diffusion 1.5), a partir dos SVGs.

É o mesmo processo de gerar.py (imagem a partir de imagem, com o SVG como
esboço), num modelo que cabe na GTX 1660 Super: o SDXL tem 5 GB só de pesos e,
como a placa não faz conta em fp16 sem dar NaN, precisava converter camada por
camada para fp32 e transbordava para a memória do sistema (4 min por passo,
1 h por imagem, em 16/10/2026). O SD 1.5 inteiro em fp32 ocupa uns 4,2 GB e
cabe na placa: nada de conversão, nada de transbordar.

As cenas saem em 1024×576 e são ampliadas para 1280×720; os personagens, em
512×768 (o tamanho natural do SD 1.5 em retrato).

Uso (as descrições das cenas e dos personagens são as de gerar.py):
  python ferramentas/arte_ia/pintar_sd15.py --cenas parque palacio --forca 0.65 --sementes 1 2
  python ferramentas/arte_ia/pintar_sd15.py --personagens tal ozols --forca 0.65 --sementes 1
  (esboços em fotos/esbocos/; saídas em fotos/ia/sd15/)
"""

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import gerar  # noqa: E402  (descrições, leitor de pesos e HF_HOME)

import torch  # noqa: E402
from accelerate import init_empty_weights  # noqa: E402
from diffusers import AutoencoderKL, DPMSolverMultistepScheduler, StableDiffusionImg2ImgPipeline, UNet2DConditionModel  # noqa: E402
from PIL import Image  # noqa: E402
from transformers import CLIPTextConfig, CLIPTextModel, CLIPTokenizer  # noqa: E402

REPO = "Lykon/dreamshaper-8"
CENA = (1024, 576)
CENA_FINAL = (1280, 720)
PERSONAGEM = (512, 768)
# o DreamShaper responde bem a "oil painting"; o resto do estilo é o mesmo do SDXL
ESTILO = "oil painting, painterly, visible brushwork, highly detailed, warm cinematic light, depth, 1950s"


def carregar() -> StableDiffusionImg2ImgPipeline:
    """Os três modelos direto na GPU, em fp32 (pesos fp16 do arquivo, convertidos uma vez só)."""
    with init_empty_weights():
        unet = UNet2DConditionModel.from_config(UNet2DConditionModel.load_config(REPO, subfolder="unet"))
        vae = AutoencoderKL.from_config(AutoencoderKL.load_config(REPO, subfolder="vae"))
        texto = CLIPTextModel(CLIPTextConfig.from_pretrained(REPO, subfolder="text_encoder"))
    unet = gerar.montar(unet, REPO, "unet/diffusion_pytorch_model.fp16.safetensors", "cuda", torch.float32)
    vae = gerar.montar(vae, REPO, "vae/diffusion_pytorch_model.fp16.safetensors", "cuda", torch.float32)
    texto = gerar.montar(texto, REPO, "text_encoder/model.fp16.safetensors", "cuda", torch.float32)
    pintor = StableDiffusionImg2ImgPipeline(
        vae=vae,
        text_encoder=texto,
        tokenizer=CLIPTokenizer.from_pretrained(REPO, subfolder="tokenizer"),
        unet=unet,
        scheduler=DPMSolverMultistepScheduler.from_pretrained(
            REPO, subfolder="scheduler", algorithm_type="dpmsolver++", solver_type="midpoint", use_karras_sigmas=True
        ),  # DPM++ 2M Karras (o arquivo do modelo pede "deis", que esta versão do diffusers recusa)
        safety_checker=None,
        feature_extractor=None,
        requires_safety_checker=False,
    )
    # os buffers que não vêm do arquivo (ex.: position_ids do texto) nasceram na CPU
    pintor.to("cuda")
    pintor.vae.enable_tiling()
    return pintor


def trabalhos(args) -> list[dict]:
    lista = []
    for nome in args.cenas:
        lista.append({
            "nome": nome,
            "esboco": f"fotos/esbocos/{nome}.png",
            "prompt": f"{ESTILO}, {gerar.CENAS[nome]}",
            "evitar": f"{gerar.NEGATIVO}, {args.evitar}" if args.evitar else gerar.NEGATIVO,
            "tamanho": CENA,
            "final": CENA_FINAL,
            "recortar_borda": True,
        })
    for nome in args.personagens:
        lista.append({
            "nome": f"personagem-{nome}",
            "esboco": f"fotos/esbocos/personagens/{nome}.png",
            "prompt": f"{ESTILO}, {gerar.PERSONAGENS[nome]}, {gerar.FUNDO_DO_PERSONAGEM}",
            "evitar": f"{gerar.NEGATIVO}, multiple people, cropped, cut off feet, busy background",
            "tamanho": PERSONAGEM,
            "final": PERSONAGEM,
            "recortar_borda": False,
        })
    return lista


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cenas", nargs="*", default=[], choices=sorted(gerar.CENAS))
    parser.add_argument("--personagens", nargs="*", default=[], choices=sorted(gerar.PERSONAGENS))
    parser.add_argument("--forca", type=float, default=0.65, help="0 = igual ao esboço; 1 = ignora o esboço")
    parser.add_argument("--sementes", type=int, nargs="+", default=[1])
    parser.add_argument("--passos", type=int, default=30)
    parser.add_argument("--guia", type=float, default=7.0)
    parser.add_argument("--evitar", default="", help="acrescenta ao que evitar nas cenas")
    args = parser.parse_args()
    lista = trabalhos(args)
    for trabalho in lista:
        if not Path(trabalho["esboco"]).exists():
            sys.exit(f"Falta o esboço {trabalho['esboco']}.")

    pasta = Path("fotos/ia/sd15")
    pasta.mkdir(parents=True, exist_ok=True)
    inicio = time.perf_counter()
    pintor = carregar()
    print(f"modelo carregado em {time.perf_counter() - inicio:.0f} s", flush=True)

    for trabalho in lista:
        largura, altura = trabalho["tamanho"]
        inicial = Image.open(trabalho["esboco"]).convert("RGB").resize((largura, altura), Image.LANCZOS)
        for semente in args.sementes:
            comeco = time.perf_counter()
            with torch.no_grad():
                imagem = pintor(
                    prompt=trabalho["prompt"],
                    negative_prompt=trabalho["evitar"],
                    image=inicial,
                    strength=args.forca,
                    num_inference_steps=args.passos,
                    guidance_scale=args.guia,
                    generator=torch.Generator("cpu").manual_seed(semente),
                ).images[0]
            if trabalho["recortar_borda"]:
                mx, my = int(largura * 0.012), int(altura * 0.012)
                imagem = imagem.crop((mx, my, largura - mx, altura - my))
            destino = pasta / f"{trabalho['nome']}-f{args.forca}-s{semente}.png"
            imagem.resize(trabalho["final"], Image.LANCZOS).save(destino)
            pico = torch.cuda.max_memory_allocated() / 1e9
            print(f"{destino}  {time.perf_counter() - comeco:.0f} s  (pico de VRAM {pico:.1f} GB)", flush=True)


if __name__ == "__main__":
    main()
