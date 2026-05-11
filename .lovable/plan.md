## Escopo

Implementar 3 frentes conectadas: (1) refinar envio de WhatsApp (grupos múltiplos, "todos", contatos individuais), (2) criar geração de **calendário editorial** pelos agentes com tarefas internas, (3) fluxo de **aprovação obrigatória** antes de qualquer item criado por agente aparecer no portal do cliente, com nova aba "Calendário" e resumo no dashboard do portal.

## Estado atual (já existe)

A aba CRM → WhatsApp em `ClientWorkspace.tsx` já possui:
- Tabs Grupos / Contatos
- Botão "Selecionar todos" para grupos
- Multi-seleção de contatos individuais
- Edge function `agent-broadcast` que envia mensagens via Z-API

→ Vou **reorganizar** essa UI em vez de duplicá-la (3º modo "Individual" mais explícito + reuso do envio existente).

## 1. Banco de dados (migration)

Nova tabela `agent_proposals`:
- `client_id`, `user_id` (dono/agência), `kind` (`post` | `whatsapp` | `email` | `task` | `campaign`), `title`, `payload` jsonb (conteúdo, plataforma, data agendada, destinatários etc.), `scheduled_for` timestamptz, `status` (`pending` | `approved` | `rejected`), `agent_name`, `created_at`, `reviewed_at`, `reviewer_notes`.
- RLS: dono (agência) vê/edita tudo seu. Membros do cliente (`client_members.accepted=true`) com role `cliente` veem apenas onde `status='approved'` para o seu `client_id`.

Tabela `client_calendar_events` (somente itens **aprovados** que viram calendário oficial):
- `client_id`, `user_id`, `source_proposal_id`, `kind`, `title`, `description`, `event_date` date, `event_time` time, `payload` jsonb, `status` (`scheduled`|`done`|`cancelled`).
- RLS: dono CRUD, cliente apenas SELECT do seu `client_id`.

## 2. WhatsApp – 3 modos

Em `ClientWorkspace.tsx`, substituir o seletor de tabs Grupos/Contatos por **3 modos**:
- **Grupos selecionados** (multi-check, como hoje)
- **Todos os grupos** (botão único, marca todos automaticamente, aviso "vai enviar para N grupos")
- **Individual** (lista de contatos do CRM com checkbox; envia 1 a 1 com pequeno delay)

Reuso do `agent-broadcast` (já aceita `groups[]`); para individual estender o body para aceitar `contacts: [{phone, name}]`. Atualizar a edge function correspondente.

## 3. Agentes geram calendário editorial

- Estender a edge function `aria-orchestrate` (ou criar `agent-editorial`) para receber prompt + período → produzir lista de propostas (posts, ads, broadcasts, tasks) com data sugerida.
- Cada item gerado é gravado em `agent_proposals` com `status='pending'`.
- Botão "Gerar calendário" na aba **Calendário Editorial** do workspace (componente `CalendarioEditorialTab.tsx`) chama essa função.

## 4. Fila de aprovação no workspace

Nova sub-view dentro do CRM (já existe enum `crmView` que inclui `"approvals"`): listar `agent_proposals` pendentes com:
- Card por proposta (tipo, data, título, preview do conteúdo).
- Botões **Aprovar** / **Rejeitar** / **Editar antes de aprovar**.
- Aprovar copia para `client_calendar_events` e (quando aplicável) cria registro em `scheduled_posts` ou dispara o envio.

## 5. Portal do cliente (`ClientPortal.tsx`)

- **Dashboard inicial**: card "Próximos do calendário" (próximos 5 eventos aprovados) + contadores por tipo.
- **Nova aba "Calendário"**: visão mensal/lista de `client_calendar_events` filtrada por `client_id`, somente aprovados. Cliente apenas visualiza.
- Garantir RLS impede o cliente de ver `pending`/`rejected`.

## Detalhes técnicos

- Tabelas com triggers `update_updated_at_column`.
- `agent-broadcast` ganha branch `mode: 'individual'` que itera sobre `contacts[]` chamando `/send-text` com `phone` direto (sem ID de grupo).
- O passo de aprovação da proposta cria automaticamente o `scheduled_posts` (para post) ou `client_calendar_events` (para tarefa/broadcast já enviado).
- Itens enviados ao vivo (broadcast manual feito pelo dono) **não passam por aprovação** — só os criados por agentes.

## Fora de escopo

- Edição visual completa da grade do calendário no portal (vai começar como lista cronológica + filtro por mês).
- Notificações push para o cliente (fica para depois).