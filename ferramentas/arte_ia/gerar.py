"""Pinta a arte do jogo com o Stable Diffusion XL, a partir dos desenhos SVG.

A técnica é imagem a partir de imagem (img2img): o SVG atual (public/arte/)
entra como esboço da composição, e o SDXL pinta por cima, no estilo do guia
(ESTILO). Assim cada coisa fica no lugar do ponto clicável do jogo.

Roda fora do jogo, no PC do dono (GTX 1660 Super com 6 GB; 16 GB de RAM com
pouca folga):
  ambiente  C:/edson/ferramentas/sdxl/.venv   (torch CUDA + diffusers)
  modelos   C:/edson/ferramentas/sdxl/hf      (cache do Hugging Face)

Duas armadilhas deste PC, já contornadas aqui:
- o `safetensors` novo lê por mapeamento de memória e quebra (violação de
  acesso) com pouca memória livre: os pesos são lidos por `ler_safetensors`,
  tensor por tensor, com leitura comum de arquivo;
- o U-Net (5 GB) não cabe na RAM livre: vai direto para a GPU. Os
  codificadores de texto ficam na CPU só para preparar o pedido e saem antes
  da pintura; o U-Net sai antes de decodificar a imagem.

Uso (um lote carrega o modelo uma vez):
  python ferramentas/arte_ia/gerar.py --cenas quarto parque --forca 0.55 --sementes 1 2
  python ferramentas/arte_ia/gerar.py --personagens ozols tal --forca 0.65 --sementes 1 2
  (esboços em fotos/esbocos/; saídas em fotos/ia/)
"""

import argparse
import json
import os
import struct
import subprocess
import sys
from pathlib import Path

os.environ.setdefault("HF_HOME", "C:/edson/ferramentas/sdxl/hf")

import torch  # noqa: E402
from accelerate import init_empty_weights  # noqa: E402
from accelerate.utils import set_module_tensor_to_device  # noqa: E402
from diffusers import (  # noqa: E402
    AutoencoderKL,
    EulerDiscreteScheduler,
    StableDiffusionXLImg2ImgPipeline,
    UNet2DConditionModel,
)
from huggingface_hub import hf_hub_download  # noqa: E402
from PIL import Image  # noqa: E402
from transformers import CLIPTextConfig, CLIPTextModel, CLIPTextModelWithProjection, CLIPTokenizer  # noqa: E402

REPO = "stabilityai/stable-diffusion-xl-base-1.0"
REPO_VAE = "madebyollin/sdxl-vae-fp16-fix"  # a GTX 16xx dá imagem preta com o VAE original em fp16

# 1344×768 é o tamanho nativo do SDXL mais próximo de 16:9; depois vira 1280×720.
LARGURA, ALTURA = 1344, 768

# O codificador de texto lê só 77 pedaços de texto: o estilo vai primeiro, e a
# cena diz só o essencial (a composição já vem do esboço).
ESTILO = "realistic oil painting, highly detailed, volumetric light, depth, warm cinematic lighting, 1950s"
NEGATIVO = "text, watermark, signature, frame, border, cartoon, flat colors, vector art, lowres, blurry, deformed, modern objects"

CENAS = {
    "quarto": (
        "boy's study room in Riga at night, writing desk with green desk lamp, chessboard, newspaper, "
        "window with old town rooftops and church spire, red curtains, wall bookshelf full of old books, "
        "1940s wooden valve radio, wooden door"
    ),
    "parque": (
        "Riga city park in golden autumn, art nouveau facades, red tram, orange trees, fallen leaves, "
        "gravel path, round stone chess tables, bench, gas lamp, green newspaper kiosk"
    ),
    "palacio": (
        "chess club hall in an old castle, deep arched windows, tournament crosstable chart on the wall, "
        "glass trophy cabinet, long table with chessboards, demonstration board on an easel, red carpet"
    ),
    "clube": (
        "smoky chess tournament hall at dusk, men at wooden tables with chessboards and clocks, hanging metal lamps, "
        "green painted wall panels, tall windows with red curtains, large tournament crosstable on wall, arbiter desk"
    ),
    "titulo": "Riga old town skyline at night across the Daugava river, church spires, lit windows, moon, reflections",
    "mesa-parque": "top-down view of a weathered granite table with fallen autumn leaves",
    "mesa-palacio": "top-down view of an old polished wooden table, chess scoresheet and pencil, lamplight",
}

# Personagens: o desenho SVG atual dá a roupa e a pose; o texto diz quem é.
FUNDO_DO_PERSONAGEM = "standing, full body, facing viewer, feet visible, plain light grey studio background"
PERSONAGENS = {
    "peteris": "11 year old Latvian boy in 1950, flat cap, short blue-grey wool jacket, red scarf, dark trousers",
    "grisha": "old Soviet railway worker, dark blue railway uniform with brass buttons, peaked cap, grey mustache, pipe",
    "ozols": "elderly watchmaker, long grey wool overcoat, black bowler hat, round spectacles, white mustache",
    "marta": "middle-aged newspaper kiosk woman, red patterned headscarf, green cardigan, purple dress, white apron",
    "kruzkops": "chess teacher about 40 years old, dark blue suit, red tie, round glasses, combed brown hair",
    "tal": "14 year old boy with dark curly hair and intense dark eyes, burgundy wool sweater, white shirt collar",
    "valdis": "13 year old blond boy, blue sweater vest, white shirt, red pioneer neckerchief, nervous smile",
    "ilze": "14 year old girl, auburn braids with white ribbons, brown school uniform dress, black apron, notebook",
    "boris": "15 year old confident boy, dark hair, olive green jacket, white collar, dark trousers",
    "gipslis": "14 year old thoughtful boy, light brown hair, brown wool sweater, white collar, navy trousers",
    "arbitro": "elderly chess arbiter, bald, grey mustache, round glasses, grey suit, dark tie, serious",
    "kalnins": "Latvian engineer about 35, blond combed hair, glasses, brown jacket, white shirt collar",
    "sokolov": "retired Soviet army major about 50, grey short hair, grey mustache, olive military tunic without medals",
    "zenta": "20 year old woman mathematics student, auburn hair in a bun, navy dress, grey cardigan, notebook",
    "zilber": "19 year old young man, dark combed hair, dark grey jacket, white shirt collar, confident",
    "koblencs": "Latvian chess master about 36, dark combed hair, dark navy suit, dark red tie, calm gaze",
    "klavins": "21 year old Latvian physics student, light brown short hair, round glasses, green wool sweater",
    "kalvaitis": "Lithuanian chess master in his forties, short greying hair, grey mustache, brown suit, dark tie, reserved",
}

TIPOS = {"F16": torch.float16, "F32": torch.float32, "BF16": torch.bfloat16, "I64": torch.int64}


def ler_safetensors(caminho: str):
    """Lê um .safetensors tensor por tensor, sem mapeamento de memória."""
    with open(caminho, "rb") as arquivo:
        tamanho = struct.unpack("<Q", arquivo.read(8))[0]
        cabecalho = json.loads(arquivo.read(tamanho))
        inicio = 8 + tamanho
        for nome, info in cabecalho.items():
            if nome == "__metadata__":
                continue
            de, ate = info["data_offsets"]
            arquivo.seek(inicio + de)
            dados = bytearray(arquivo.read(ate - de))
            yield nome, torch.frombuffer(dados, dtype=TIPOS[info["dtype"]]).reshape(info["shape"])


def montar(modelo, repo: str, arquivo: str, dispositivo: str, tipo: torch.dtype):
    """Preenche um modelo criado vazio (sem memória) com os pesos lidos do arquivo."""
    nomes = set(modelo.state_dict().keys())
    for nome, tensor in ler_safetensors(hf_hub_download(repo, arquivo)):
        # a transformers 5 tirou o prefixo "text_model." do CLIPTextModel (o arquivo ainda o tem)
        if nome not in nomes and nome.startswith("text_model.") and nome.removeprefix("text_model.") in nomes:
            nome = nome.removeprefix("text_model.")
        set_module_tensor_to_device(modelo, nome, dispositivo, value=tensor, dtype=tipo)
    return modelo.eval()


def codificadores_de_texto():
    tok1 = CLIPTokenizer.from_pretrained(REPO, subfolder="tokenizer")
    tok2 = CLIPTokenizer.from_pretrained(REPO, subfolder="tokenizer_2")
    with init_empty_weights():
        te1 = CLIPTextModel(CLIPTextConfig.from_pretrained(REPO, subfolder="text_encoder"))
        te2 = CLIPTextModelWithProjection(CLIPTextConfig.from_pretrained(REPO, subfolder="text_encoder_2"))
    # na CPU, em fp32 (a CPU não se dá bem com fp16)
    te1 = montar(te1, REPO, "text_encoder/model.fp16.safetensors", "cpu", torch.float32)
    te2 = montar(te2, REPO, "text_encoder_2/model.fp16.safetensors", "cpu", torch.float32)
    return tok1, tok2, te1, te2


def unet_na_gpu():
    with init_empty_weights():
        unet = UNet2DConditionModel.from_config(UNet2DConditionModel.load_config(REPO, subfolder="unet"))
    return montar(unet, REPO, "unet/diffusion_pytorch_model.fp16.safetensors", "cuda", torch.float16)


def vae():
    with init_empty_weights():
        modelo = AutoencoderKL.from_config(AutoencoderKL.load_config(REPO_VAE))
    return montar(modelo, REPO_VAE, "diffusion_pytorch_model.safetensors", "cuda", torch.float16)


def codificar_lote(arquivo: str) -> None:
    """Modo do processo separado: codifica os textos do lote e grava os pedidos."""
    tok1, tok2, te1, te2 = codificadores_de_texto()
    pipe = StableDiffusionXLImg2ImgPipeline(
        vae=None, text_encoder=te1, text_encoder_2=te2, tokenizer=tok1, tokenizer_2=tok2, unet=None,
        scheduler=EulerDiscreteScheduler.from_pretrained(REPO, subfolder="scheduler"),
    )
    pedidos = []
    for item in json.loads(Path(arquivo).read_text(encoding="utf8")):
        with torch.no_grad():
            emb, emb_neg, pooled, pooled_neg = pipe.encode_prompt(
                prompt=item["prompt"], negative_prompt=item["evitar"], device="cpu", do_classifier_free_guidance=True
            )
        pedidos.append({
            "prompt_embeds": emb,
            "negative_prompt_embeds": emb_neg,
            "pooled_prompt_embeds": pooled,
            "negative_pooled_prompt_embeds": pooled_neg,
        })
    torch.save(pedidos, Path(arquivo).with_suffix(".pt"))


def calcular_em_fp32(modelo: torch.nn.Module) -> None:
    """
    A GTX 16xx faz conta errada (NaN) em fp16 no U-Net do SDXL. Os pesos ficam
    guardados em fp16 (cabem na placa), mas cada camada vira fp32 só na hora
    de calcular e volta depois; as contas intermediárias ficam todas em fp32.
    """

    def em_fp32(valor):
        return valor.float() if torch.is_tensor(valor) and valor.is_floating_point() else valor

    def subir(modulo, argumentos, nomeados):
        for parametro in modulo.parameters(recurse=False):
            parametro.data = parametro.data.float()
        return tuple(em_fp32(a) for a in argumentos), {k: em_fp32(v) for k, v in nomeados.items()}

    def descer(modulo, _entrada, _saida):
        for parametro in modulo.parameters(recurse=False):
            parametro.data = parametro.data.half()

    for modulo in modelo.modules():
        if any(True for _ in modulo.parameters(recurse=False)):
            modulo.register_forward_pre_hook(subir, with_kwargs=True)
            modulo.register_forward_hook(descer)


def trabalhos(args) -> list[dict]:
    """Cada trabalho: esboço, texto, o que evitar, liberdade, sementes, tamanho e nome de saída."""
    lista = []
    for nome in args.cenas:
        lista.append({
            "nome": nome,
            "esboco": f"fotos/esbocos/{nome}.png",
            "prompt": f"{ESTILO}, {CENAS[nome]}{', ' + args.prompt if args.prompt else ''}",
            "evitar": f"{NEGATIVO}, {args.evitar}" if args.evitar else NEGATIVO,
            "tamanho": (LARGURA, ALTURA),
            "final": (1280, 720),
            "recortar_borda": True,
        })
    for nome in args.personagens:
        lista.append({
            "nome": f"personagem-{nome}",
            "esboco": f"fotos/esbocos/personagens/{nome}.png",
            "prompt": f"{ESTILO}, {PERSONAGENS[nome]}, {FUNDO_DO_PERSONAGEM}",
            "evitar": f"{NEGATIVO}, multiple people, cropped, cut off feet, busy background",
            "tamanho": (832, 1216),
            "final": (832, 1216),
            "recortar_borda": False,
        })
    return lista


def main() -> None:
    if len(sys.argv) == 3 and sys.argv[1] == "--codificar-lote":
        return codificar_lote(sys.argv[2])
    parser = argparse.ArgumentParser()
    parser.add_argument("--cenas", nargs="*", default=[], choices=sorted(CENAS))
    parser.add_argument("--personagens", nargs="*", default=[], choices=sorted(PERSONAGENS))
    parser.add_argument("--forca", type=float, default=0.55, help="0 = igual ao esboço; 1 = ignora o esboço")
    parser.add_argument("--sementes", type=int, nargs="+", default=[1])
    parser.add_argument("--passos", type=int, default=30)
    parser.add_argument("--guia", type=float, default=7.5)
    parser.add_argument("--prompt", default="", help="acrescenta ao texto das cenas")
    parser.add_argument("--evitar", default="", help="acrescenta ao que evitar nas cenas")
    args = parser.parse_args()
    lista = trabalhos(args)
    for trabalho in lista:
        if not Path(trabalho["esboco"]).exists():
            sys.exit(f"Falta o esboço {trabalho['esboco']}.")

    # 1. todos os textos, num processo separado: ao terminar, ele devolve a RAM
    #    dos codificadores antes de o U-Net entrar
    pasta = Path("fotos/ia")
    pasta.mkdir(parents=True, exist_ok=True)
    lote = pasta / "_lote.json"
    lote.write_text(json.dumps([{"prompt": t["prompt"], "evitar": t["evitar"]} for t in lista]), encoding="utf8")
    subprocess.run([sys.executable, __file__, "--codificar-lote", str(lote)], check=True)
    pedidos = torch.load(pasta / "_lote.pt")

    # 2. a pintura, na GPU, com o U-Net carregado uma vez
    tok1 = CLIPTokenizer.from_pretrained(REPO, subfolder="tokenizer")
    tok2 = CLIPTokenizer.from_pretrained(REPO, subfolder="tokenizer_2")
    agendador = EulerDiscreteScheduler.from_pretrained(REPO, subfolder="scheduler")
    unet = unet_na_gpu()  # o maior primeiro, enquanto a memória está mais folgada
    pintor = StableDiffusionXLImg2ImgPipeline(
        vae=vae(), text_encoder=None, text_encoder_2=None, tokenizer=tok1, tokenizer_2=tok2, unet=unet, scheduler=agendador
    )
    calcular_em_fp32(pintor.unet)
    calcular_em_fp32(pintor.vae)
    pintor.enable_attention_slicing()
    pintor.vae.enable_tiling()

    for trabalho, pedido in zip(lista, pedidos):
        largura, altura = trabalho["tamanho"]
        inicial = Image.open(trabalho["esboco"]).convert("RGB").resize((largura, altura), Image.LANCZOS)
        pedido = {nome: t.to("cuda", torch.float32) for nome, t in pedido.items()}
        for semente in args.sementes:
            with torch.no_grad():
                imagem = pintor(
                    **pedido,
                    image=inicial,
                    strength=args.forca,
                    num_inference_steps=args.passos,
                    guidance_scale=args.guia,
                    generator=torch.Generator("cpu").manual_seed(semente),
                ).images[0]
            if trabalho["recortar_borda"]:
                # a borda clara que o modelo às vezes pinta (moldura)
                mx, my = int(largura * 0.012), int(altura * 0.012)
                imagem = imagem.crop((mx, my, largura - mx, altura - my))
            destino = pasta / f"{trabalho['nome']}-f{args.forca}-s{semente}.png"
            imagem.resize(trabalho["final"], Image.LANCZOS).save(destino)
            print(destino, flush=True)


if __name__ == "__main__":
    main()
