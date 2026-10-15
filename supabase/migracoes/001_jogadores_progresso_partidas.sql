-- Aplicada em 15/10/2026 no projeto "Rumo ao Trono" (pwmtabunzjcjnnhfewno, sa-east-1).
-- Rumo ao Trono: jogadores (conta anônima + apelido), progresso salvo,
-- histórico de partidas e de desafios. Cada jogador só vê e escreve o que é
-- dele (RLS); o dono do jogo lê tudo pelo painel (papel de serviço).

create table public.jogadores (
  id uuid primary key references auth.users (id) on delete cascade,
  apelido text not null check (char_length(btrim(apelido)) between 1 and 30),
  criado_em timestamptz not null default now()
);

create table public.progressos (
  jogador_id uuid primary key references public.jogadores (id) on delete cascade,
  dados jsonb not null check (octet_length(dados::text) < 100000),
  atualizado_em timestamptz not null default now()
);

create table public.partidas (
  id bigint generated always as identity primary key,
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  capitulo text not null check (char_length(capitulo) <= 40),
  adversario text not null check (char_length(adversario) <= 40),
  cor text not null check (cor in ('w', 'b')),
  modo text not null check (modo in ('carreira', 'realista')),
  forca_adversario integer not null check (forca_adversario between 0 and 4000),
  resultado numeric(2, 1) not null check (resultado in (0, 0.5, 1)),
  motivo text not null check (char_length(motivo) <= 60),
  lances integer not null check (lances between 0 and 1000),
  pgn text not null check (char_length(pgn) <= 20000),
  jogada_em timestamptz not null default now()
);
create index partidas_jogador_idx on public.partidas (jogador_id, jogada_em desc);

create table public.desafios (
  id bigint generated always as identity primary key,
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  capitulo text not null check (char_length(capitulo) <= 40),
  pontos numeric(4, 1) not null check (pontos between 0 and 99),
  aprovado boolean not null,
  forca integer not null check (forca between 0 and 4000),
  categoria text not null check (char_length(categoria) <= 40),
  concluido_em timestamptz not null default now()
);
create index desafios_jogador_idx on public.desafios (jogador_id, concluido_em desc);

alter table public.jogadores enable row level security;
alter table public.progressos enable row level security;
alter table public.partidas enable row level security;
alter table public.desafios enable row level security;

create policy "jogador vê a própria conta" on public.jogadores
  for select to authenticated using ((select auth.uid()) = id);
create policy "jogador cria a própria conta" on public.jogadores
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "jogador muda o próprio apelido" on public.jogadores
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "jogador vê o próprio progresso" on public.progressos
  for select to authenticated using ((select auth.uid()) = jogador_id);
create policy "jogador grava o próprio progresso" on public.progressos
  for insert to authenticated with check ((select auth.uid()) = jogador_id);
create policy "jogador atualiza o próprio progresso" on public.progressos
  for update to authenticated using ((select auth.uid()) = jogador_id) with check ((select auth.uid()) = jogador_id);

create policy "jogador vê as próprias partidas" on public.partidas
  for select to authenticated using ((select auth.uid()) = jogador_id);
create policy "jogador registra as próprias partidas" on public.partidas
  for insert to authenticated with check ((select auth.uid()) = jogador_id);

create policy "jogador vê os próprios desafios" on public.desafios
  for select to authenticated using ((select auth.uid()) = jogador_id);
create policy "jogador registra os próprios desafios" on public.desafios
  for insert to authenticated with check ((select auth.uid()) = jogador_id);

-- quem não entrou (papel anon) não toca em nada
revoke all on public.jogadores, public.progressos, public.partidas, public.desafios from anon;
-- partidas e desafios são histórico: ninguém altera nem apaga pelo jogo
revoke update, delete on public.partidas, public.desafios from authenticated;
revoke delete on public.jogadores, public.progressos from authenticated;

-- o progresso registra a hora da última gravação
create function public.marcar_atualizacao() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;
create trigger progressos_atualizado before update on public.progressos
  for each row execute function public.marcar_atualizacao();
