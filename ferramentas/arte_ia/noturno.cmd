@echo off
rem Lote noturno da arte pintada, com o DreamShaper 8 (SD 1.5): cerca de 1,5 min por
rem cena e 1 min por personagem na GTX 1660 Super (o SDXL levava 1 h por imagem).
rem Agendado no Windows ("Rumo ao Trono - arte noturna"); o registro vai para
rem fotos\ia\noturno.log e as imagens para fotos\ia\sd15\.
cd /d C:\edson\projetos\rumo-ao-trono
set HF_HUB_DISABLE_PROGRESS_BARS=1
set HF_HUB_OFFLINE=1
set PY=C:\edson\ferramentas\sdxl\.venv\Scripts\python.exe
if not exist fotos\ia mkdir fotos\ia
echo ===== inicio %date% %time% >> fotos\ia\noturno.log 2>&1
rem cenas: força 0,6 (0,55 nas que têm muito ponto clicável), três sementes cada
%PY% ferramentas\arte_ia\pintar_sd15.py --cenas titulo parque palacio mesa-parque mesa-palacio --forca 0.6 --sementes 5 6 7 --evitar "television, tv screen, bed, naive art, people, person, umbrella, religious painting, landscape painting" >> fotos\ia\noturno.log 2>&1
%PY% ferramentas\arte_ia\pintar_sd15.py --cenas quarto clube --forca 0.55 --sementes 5 6 7 --evitar "television, tv screen, bed, naive art, people, person, umbrella, religious painting, landscape painting" >> fotos\ia\noturno.log 2>&1
echo ===== cenarios terminados %date% %time% >> fotos\ia\noturno.log 2>&1
%PY% ferramentas\arte_ia\pintar_sd15.py --personagens peteris grisha ozols marta kruzkops tal valdis ilze boris gipslis --forca 0.65 --sementes 1 2 3 >> fotos\ia\noturno.log 2>&1
%PY% ferramentas\arte_ia\pintar_sd15.py --personagens arbitro kalnins sokolov zenta zilber koblencs klavins kalvaitis --forca 0.65 --sementes 1 2 3 >> fotos\ia\noturno.log 2>&1
echo ===== fim %date% %time% >> fotos\ia\noturno.log 2>&1
