@echo off
rem Lote noturno da arte pintada (SDXL): cenarios e personagens. Agendado no
rem Windows ("Rumo ao Trono - arte noturna"); o registro vai para fotos\ia\noturno.log.
cd /d C:\edson\projetos\rumo-ao-trono
set HF_HUB_DISABLE_PROGRESS_BARS=1
set PY=C:\edson\ferramentas\sdxl\.venv\Scripts\python.exe
if not exist fotos\ia mkdir fotos\ia
echo ===== inicio %date% %time% >> fotos\ia\noturno.log
%PY% ferramentas\arte_ia\gerar.py --cenas parque palacio titulo mesa-parque mesa-palacio --forca 0.55 --sementes 5 6 --evitar "television, tv screen, bed, naive art" >> fotos\ia\noturno.log 2>&1
echo ===== cenarios terminados %date% %time% >> fotos\ia\noturno.log
%PY% ferramentas\arte_ia\gerar.py --personagens peteris grisha ozols marta kruzkops tal valdis ilze boris gipslis --forca 0.65 --sementes 1 2 >> fotos\ia\noturno.log 2>&1
%PY% ferramentas\arte_ia\gerar.py --cenas clube --forca 0.55 --sementes 5 6 --evitar "television, tv screen, bed, naive art, mountains" >> fotos\ia\noturno.log 2>&1
%PY% ferramentas\arte_ia\gerar.py --personagens arbitro kalnins sokolov zenta zilber koblencs klavins --forca 0.65 --sementes 1 2 >> fotos\ia\noturno.log 2>&1
echo ===== fim %date% %time% >> fotos\ia\noturno.log
