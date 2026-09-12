# calu-api — API de automação da Calu Agência

Um único endpoint autenticado por **chave** para operar o CRM por fora da
interface: clientes, agentes autônomos, rotinas, entregas do portal e a fila de
aprovação. Feita para automação (Claude, scripts, integrações) — não depende de
login de navegador.

## Segurança

- Toda chamada exige `Authorization: Bearer <CALU_API_KEY>`.
- A API age **sempre como a dona da agência** (`CALU_API_OWNER_ID`), usando a
  service role, e filtra tudo por `user_id = owner`. Nunca enxerga dados de
  outro usuário.
- Sem os secrets configurados, a função responde **503** com instrução de setup
  em vez de abrir sem proteção.

## Setup (uma vez)

Defina dois secrets no projeto Supabase:

```bash
supabase secrets set CALU_API_KEY="<gere-uma-chave-forte>"
supabase secrets set CALU_API_OWNER_ID="<auth-uid-da-dona>"   # ex.: da tabela auth.users
supabase functions deploy calu-api
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem no ambiente das funções.

## Protocolo

`POST` com JSON `{ "action": "...", ...params }`.
Respostas: `{ "ok": true, ... }` ou `{ "ok": false, "error": "..." }`.
`GET` na URL devolve o manifesto de ações (descoberta, sem tocar em dados e sem
exigir chave).

Base: `https://<project-ref>.supabase.co/functions/v1/calu-api`

## Ações

| action | params | o que faz |
| --- | --- | --- |
| `health` | — | checagem: versão + owner |
| `clients.list` | `limit?` | lista os clientes da agência |
| `clients.get` | `workspace_id` | um cliente |
| `clients.upsert` | `workspace_id, name, segment?, status?` | cria/garante a linha do cliente |
| `agents.activate` | `workspace_id` **ou** `all:true` (`name?`,`segment?`) | liga as rotinas padrão (modo fila de aprovação) |
| `routines.list` | `workspace_id` | rotinas do cliente |
| `routines.set` | `workspace_id, rotina, dias_semana, hora, ativo` | liga/ajusta uma rotina |
| `routine.run` | `workspace_id?, rotina?, forcar?` | dispara o motor `rotina-agentes` agora |
| `deliverables.list` | `workspace_id, limit?` | entregas do portal |
| `deliverables.create` | `workspace_id, category, title, description, visible_to_client?` | publica uma entrega no portal |
| `proposals.list` | `workspace_id?, status?` | fila de aprovação (default `pending`) |
| `proposals.decide` | `id, decision:'approved'\|'rejected'` | aprova/recusa uma proposta |

### Rotinas padrão de `agents.activate`

Espelham `src/lib/activateAgents.ts` — **modo fila de aprovação** (sem
`auto_aprovar`, nada vai ao ar sem um OK):

- `pauta` — seg 09:00
- `calendario` — seg 09:30 (cai em `agent_proposals`)
- `carrossel` — qua 10:00
- `relatorio` — sex 17:00

Não sobrescreve rotinas que já existam para o cliente.

## Exemplos

```bash
API=https://<project-ref>.supabase.co/functions/v1/calu-api
KEY=<CALU_API_KEY>

# descobrir as ações
curl -s $API

# checagem
curl -s $API -H "Authorization: Bearer $KEY" \
  -H 'Content-Type: application/json' -d '{"action":"health"}'

# listar clientes
curl -s $API -H "Authorization: Bearer $KEY" \
  -H 'Content-Type: application/json' -d '{"action":"clients.list"}'

# ligar os agentes de todos os clientes
curl -s $API -H "Authorization: Bearer $KEY" \
  -H 'Content-Type: application/json' -d '{"action":"agents.activate","all":true}'

# disparar o motor autônomo agora (teste), forçando dia/hora
curl -s $API -H "Authorization: Bearer $KEY" \
  -H 'Content-Type: application/json' \
  -d '{"action":"routine.run","workspace_id":"tech-solutions","rotina":"pauta","forcar":true}'

# aprovar uma proposta
curl -s $API -H "Authorization: Bearer $KEY" \
  -H 'Content-Type: application/json' \
  -d '{"action":"proposals.decide","id":"<uuid>","decision":"approved"}'
```
