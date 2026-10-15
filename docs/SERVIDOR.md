# O servidor do jogo (Supabase)

Criado em 15/10/2026, a pedido do dono, para guardar o histórico de quem joga.

- **Projeto:** "Rumo ao Trono", `pwmtabunzjcjnnhfewno`, região `sa-east-1`
  (São Paulo), plano gratuito (US$ 0/mês). Separado do projeto do
  xadrez-treinamento.
- **Painel:** https://supabase.com/dashboard/project/pwmtabunzjcjnnhfewno

## Como o jogador entra

Na primeira vez, o jogo pergunta o apelido e cria uma **conta anônima** no
Supabase Auth (sem e-mail, sem senha). A sessão fica no navegador
(`rumo-ao-trono:sessao`). Quem prefere, joga sem conta: o progresso continua
só no navegador, e o título mostra "Salvar meu histórico".

Precisa do login anônimo ligado em Authentication → Sign In / Providers →
"Allow anonymous sign-ins". Sem ele, a criação da conta falha e o jogo segue
sem histórico.

Limite do Supabase: 30 contas anônimas novas por hora por IP.

## O que fica guardado

| Tabela | O quê |
|---|---|
| `jogadores` | id da conta, apelido, data |
| `progressos` | cópia do progresso do jogo (`dados`, o mesmo JSON do navegador), uma linha por jogador, atualizada alguns segundos depois de cada mudança |
| `partidas` | cada partida: capítulo, adversário, cor, modo, força do adversário, resultado, motivo do fim, número de lances e o **PGN completo** |
| `desafios` | cada desafio terminado: capítulo, pontos, aprovado ou não, força calculada, categoria |

O navegador continua sendo a fonte do progresso; o servidor é cópia e
histórico. Partidas e desafios que não chegam (sem internet) esperam numa
fila no navegador (`rumo-ao-trono:pendentes`) e vão na próxima vez.

## Segurança

Segurança por linha (RLS) em todas as tabelas: cada jogador só lê e grava as
próprias linhas; ninguém altera nem apaga partidas e desafios pelo jogo; sem
conta (papel `anon`), nada. A chave do jogo é a **publicável** (feita para o
navegador). O dono lê tudo pelo painel. A migração está em
`supabase/migracoes/`.

## Consultas úteis (SQL Editor do painel)

```sql
-- quem joga e até onde chegou
select j.apelido, p.dados->>'capitulo' as capitulo, p.dados->>'forca' as forca,
       p.dados->'concluidos' as concluidos, p.atualizado_em
from jogadores j left join progressos p on p.jogador_id = j.id
order by p.atualizado_em desc nulls last;

-- as últimas partidas, com o PGN
select j.apelido, pa.capitulo, pa.adversario, pa.resultado, pa.motivo, pa.lances, pa.jogada_em, pa.pgn
from partidas pa join jogadores j on j.id = pa.jogador_id
order by pa.jogada_em desc limit 50;

-- placar de cada um contra cada adversário (calibra a força dos adversários)
select pa.adversario, count(*) as partidas, avg(pa.resultado) as pontos_do_jogador
from partidas pa group by pa.adversario order by pa.adversario;
```

## Pendências conhecidas

- Continuar em outro aparelho: a conta anônima vive no navegador. A segunda
  etapa é ligar a conta a um e-mail (o e-mail embutido do Supabase manda
  poucos por hora; precisa de SMTP próprio).
- Limpeza de contas anônimas sem apelido: hoje só por SQL, se um dia
  precisar.
