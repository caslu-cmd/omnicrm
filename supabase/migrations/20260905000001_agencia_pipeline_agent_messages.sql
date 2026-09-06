-- Pipeline de agência (agencia-pipeline): runs ganham configuração, contexto e
-- etapa atual; tasks ganham etapa/agente; e nasce a conversa entre agentes
-- (handoffs, feedback da revisão, aprovações).
--
-- Já aplicada em produção via MCP em 2026-09-05 (nome:
-- agencia_pipeline_mensagens_entre_agentes). Idempotente.

alter table public.orchestration_runs
  add column if not exists pipeline text not null default 'classico',
  add column if not exists config jsonb,
  add column if not exists contexto jsonb,
  add column if not exists etapa_atual text;

alter table public.orchestration_tasks
  add column if not exists etapa text,
  add column if not exists agente text;

create index if not exists orchestration_tasks_run_etapa_idx
  on public.orchestration_tasks (run_id, etapa);

create table if not exists public.agent_messages (
  id         uuid primary key default gen_random_uuid(),
  run_id     uuid not null references public.orchestration_runs (id) on delete cascade,
  client_id  text,
  etapa      text,
  de         text not null,
  para       text not null,
  tipo       text not null default 'handoff',
  conteudo   text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_messages_run_idx
  on public.agent_messages (run_id, created_at);

alter table public.agent_messages enable row level security;

drop policy if exists "dono do run le as mensagens" on public.agent_messages;
create policy "dono do run le as mensagens"
  on public.agent_messages for select to authenticated
  using (exists (
    select 1 from public.orchestration_runs r
    where r.id = agent_messages.run_id and r.user_id = auth.uid()
  ));

comment on table public.agent_messages is
  'Conversa entre os agentes durante uma producao (agencia-pipeline): quem passou o que para quem, feedback da revisao, aprovacoes.';
