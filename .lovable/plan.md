
# Diagnóstico — Integração de Redes Sociais

Tela: `/agency/clients/[slug]?tab=social` → componente `src/components/SocialMediaTab.tsx`.

## 1) Edge Functions / handlers OAuth existentes

Há **duas** edge functions de social media (redundantes):

- **`supabase/functions/smm/index.ts`** ← a que o frontend usa hoje (`supabase.functions.invoke("smm", …)`).
  Actions: `oauth-url`, `oauth-callback` (Meta), `linkedin-oauth-url`, `linkedin-oauth-callback`, `connections`, `disconnect`, `create-post`, `approve-post`, `reject-post`, `posts`, `delete-post`, `metrics`.
- **`supabase/functions/social-media/index.ts`** ← versão antiga, **não usada** pelo frontend. Pode ser removida.

Rota de callback no frontend: `OAuthCallbackPage.tsx` registrada em `App.tsx` para:
- `/oauth/meta` — Instagram + Facebook
- `/oauth/linkedin` — LinkedIn

A página apenas captura `code`/`state` e faz `postMessage` para a janela mãe, que então chama o `smm` com `oauth-callback`.

## 2) Secrets / credenciais

Já configurados (vistos via fetch_secrets):
- `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`

**Problema:** os redirect URIs no servidor têm fallback para `omnicrm.lovable.app`. O frontend já força `${window.location.origin}/oauth/meta` ao montar a URL OAuth, então o domínio efetivo é o que o usuário acessa (`www.caluagencia.com.br`, `caluagencia.lovable.app` ou o preview).

Para o OAuth funcionar, no painel **Meta Developers** (App `1480117656994046`) e no **LinkedIn Developers** os redirect URIs liberados devem incluir **todas** as origens em uso:
```
https://www.caluagencia.com.br/oauth/meta
https://caluagencia.com.br/oauth/meta
https://caluagencia.lovable.app/oauth/meta
https://id-preview--ddccdec1-0f36-4159-b242-2521c9f54551.lovable.app/oauth/meta
```
(idem para `/oauth/linkedin`)

E em **App Domains** (Meta) → adicionar os domínios sem o path.

## 3) Persistência de tokens

Tabela: **`social_connections`** (existe).
Colunas: `user_id`, `client_id`, `platform`, `account_id`, `account_name`, `account_username`, `followers_count`, `access_token` (ofuscado XOR+base64 com `INTEGRATION_ENCRYPTION_KEY` ou service role), `token_expires_at`, `connected`, `connected_at`.

RLS ativo: SELECT/INSERT/UPDATE/DELETE restritos a `auth.uid() = user_id` (authenticated). OK.

Posts: tabela `scheduled_posts` com mesmas regras.

## 4) O que falta para os botões "Conectar" funcionarem de fato

| Item | Status |
|------|--------|
| Backend `smm` com handlers Meta + LinkedIn | ✅ pronto |
| Tabela + RLS | ✅ pronto |
| Página de callback `/oauth/meta` e `/oauth/linkedin` | ✅ pronto |
| Secrets Meta e LinkedIn | ✅ presentes |
| **Redirect URIs liberados no Meta Developers** para `www.caluagencia.com.br` | ⚠️ depende de você confirmar no painel Meta |
| **Redirect URIs liberados no LinkedIn Developers** | ⚠️ idem |
| App Meta em modo **Live** (necessário p/ contas que não são admin/tester) | ⚠️ provavelmente em Development |
| Permissões `instagram_content_publish`, `pages_manage_posts` revisadas pela Meta | ⚠️ requer App Review p/ uso fora do círculo de testers |
| Conta IG da cliente ser **Profissional** vinculada a uma Página FB | ⚠️ pré-requisito do usuário final |
| LinkedIn: produto **Sign In with LinkedIn** + escopo `w_member_social` aprovado no app | ⚠️ verificar |

Resumo: **o código está completo**. O bloqueio atual é 100% de configuração nos painéis Meta/LinkedIn (redirect URIs + modo do app + scopes aprovados).

## 5) TikTok / YouTube

Atualmente **não existem** no projeto:
- Sem entrada no `PLATFORM_CFG` do `SocialMediaTab.tsx`
- Sem actions `tiktok-*` / `youtube-*` no `smm`
- Sem rotas `/oauth/tiktok` ou `/oauth/youtube`
- Tabela `social_connections.platform` é `text` livre — aceitaria os novos valores sem migração

Para adicionar cada um:

**TikTok (TikTok for Developers — Login Kit + Content Posting API):**
1. Criar app em developers.tiktok.com, habilitar Login Kit + Content Posting API
2. Secrets: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`
3. Rota frontend `/oauth/tiktok` (reaproveita `OAuthCallbackPage` com novo tipo de mensagem)
4. Actions no `smm`: `tiktok-oauth-url`, `tiktok-oauth-callback`, e branches em `create-post`/`metrics`
5. Card no `PLATFORM_CFG`
6. Aprovação de scopes (`video.publish`, `user.info.basic`) — requer App Review da TikTok

**YouTube (Google Cloud — YouTube Data API v3):**
1. Projeto no Google Cloud, habilitar YouTube Data API
2. OAuth 2.0 Client → Secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
3. Rota `/oauth/youtube`
4. Actions `youtube-oauth-url`, `youtube-oauth-callback`, upload via `videos.insert` (resumable upload — precisa hospedar o vídeo antes)
5. Card no `PLATFORM_CFG`
6. App Verification do Google (se for usar fora dos testers) para escopo `youtube.upload`

Estimativa: ~1 sessão de build por plataforma (sem contar o tempo de aprovação no painel oficial de cada uma).

## Recomendações imediatas

1. Você confirmar/atualizar os Redirect URIs no Meta + LinkedIn para `www.caluagencia.com.br` (e demais domínios em uso).
2. Decidir se quero **deletar** a função `social-media` (legacy) para evitar confusão.
3. Se quiser, próximo passo é adicionar **TikTok** e **YouTube** (me diga qual primeiro).
