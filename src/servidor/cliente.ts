// O cliente do Supabase do jogo (projeto "Rumo ao Trono", em São Paulo).
// A chave publicável foi feita para ficar no navegador: quem protege os
// dados é a segurança por linha (RLS) — cada jogador só lê e grava o que é
// dele. Ver docs/SERVIDOR.md.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const URL_DO_SERVIDOR = "https://pwmtabunzjcjnnhfewno.supabase.co";
export const CHAVE_PUBLICAVEL = "sb_publishable_oG1k1BZGlIe4J3h4n1GPfw_8UX-cRrg";

/**
 * Liga a conta por apelido e o histórico. Depende do login anônimo ligado no
 * painel do Supabase (ligado pelo dono em 15/10/2026); sem ele, o jogador veria
 * um erro ao escolher o apelido. Ver docs/SERVIDOR.md.
 */
export const HISTORICO_LIGADO = true;

let cliente: SupabaseClient | undefined;

export function servidor(): SupabaseClient {
  cliente ??= createClient(URL_DO_SERVIDOR, CHAVE_PUBLICAVEL, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "rumo-ao-trono:sessao" },
  });
  return cliente;
}
