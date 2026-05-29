create table if not exists triagem_sefaz_leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text not null,
  posto_fiscal text,
  periodo_inicio text,
  periodo_fim text,
  anos_lotacao numeric,
  codigo_156 text,
  valor_estimado_min numeric,
  valor_estimado_max numeric,
  canal text default 'triagem-gptmaker',
  status text default 'novo',
  observacoes text,
  created_at timestamptz default now()
);

alter table triagem_sefaz_leads enable row level security;

create policy "service role full access" on triagem_sefaz_leads
  using (true)
  with check (true);
