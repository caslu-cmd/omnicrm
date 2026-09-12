-- Remove os objetos dos agentes descontinuados (fora do segmento de marca da
-- Calu): Fisco (contábil) e Ana (triagem SEFAZ). Rico rodava em backend externo
-- (Railway), sem objetos neste banco. Ambas as tabelas estavam VAZIAS (0 linhas)
-- no momento da remoção, então nenhum dado é perdido. Idempotente.

drop table if exists public.triagem_sefaz_leads cascade;
drop table if exists public.fisco_clientes cascade;
drop function if exists public.registrar_acesso_fisco cascade;
