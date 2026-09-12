-- Etapa do funil por lead (ex.: inscritos de cursos)
alter table public.contacts add column if not exists funnel_stage text;

-- Colaboradores (client_members aceitos) podem ATUALIZAR contatos do seu cliente
-- (ex.: marcar em qual etapa do funil o lead está). Antes só o dono atualizava.
drop policy if exists team_member_update_contacts on public.contacts;
create policy team_member_update_contacts on public.contacts
  for update
  using (client_id in (select client_id from public.client_members
                       where member_user_id = auth.uid() and accepted = true))
  with check (client_id in (select client_id from public.client_members
                            where member_user_id = auth.uid() and accepted = true));

-- Tabelas/listas de CRM por cliente (ex.: "Inscritos - Curso X")
create table if not exists public.crm_lists (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  name text not null,
  user_id uuid,
  created_at timestamptz not null default now(),
  unique (client_id, name)
);
alter table public.crm_lists enable row level security;

drop policy if exists crm_lists_owner_all on public.crm_lists;
create policy crm_lists_owner_all on public.crm_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists crm_lists_team_select on public.crm_lists;
create policy crm_lists_team_select on public.crm_lists
  for select using (client_id in (select client_id from public.client_members
                                  where member_user_id = auth.uid() and accepted = true));

drop policy if exists crm_lists_team_insert on public.crm_lists;
create policy crm_lists_team_insert on public.crm_lists
  for insert with check (client_id in (select client_id from public.client_members
                                       where member_user_id = auth.uid() and accepted = true));
