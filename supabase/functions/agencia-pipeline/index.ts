/**
 * AGÊNCIA PIPELINE — o time inteiro produzindo o período de um cliente.
 *
 * Como funciona:
 *  - `start` abre um run, cria uma task por agente em cada etapa e dispara a
 *    primeira etapa.
 *  - `step` executa UMA etapa (um ou mais agentes em paralelo) e, ao terminar,
 *    chama a si mesma para a próxima. Cada etapa é uma invocação separada:
 *    assim o pipeline todo não depende de caber no teto de tempo de uma
 *    função só.
 *  - Os agentes conversam por `agent_messages`: cada um termina a entrega com
 *    uma "Nota para o time" (vira handoff para quem vem depois), a Vitória
 *    manda feedback nominal para quem precisa ajustar, e a Aira fecha a fila
 *    de aprovação e o relatório.
 *  - `status` devolve run + tasks + conversa para o painel acompanhar.
 *
 * Quem é cada agente, o que sabe e para quem entrega mora em
 * `_shared/agencia.ts` — o chat usa o mesmo registro.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  TIME, ETAPAS, ETAPAS_DE_PRODUCAO, agente, proximaEtapa, ID_NO_CATALOGO, SKILLS_DA_CASA, blocoDeSkills,
  type Etapa, type Agente,
} from "../_shared/agencia.ts";
import { blocoDeContexto, lerUrls } from "../_shared/documentos.ts";

type SB = ReturnType<typeof createClient>;
type Dict = Record<string, unknown>;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const SELF = `${SUPABASE_URL}/functions/v1/agencia-pipeline`;

const MODELO = "claude-opus-5";
/** Estratégia e revisão pensam mais; produção em volume pensa o suficiente. */
const ESFORCO: Record<string, string> = { queila: "high", vitoria: "high" };
// A Beatriz estourou 14k e o JSON final foi cortado — sem ele a fila de
// aprovação sai vazia. Teto maior para quem entrega em volume; e o prompt
// pede o JSON como entrega única, sem repetir tudo em prosa antes.
const MAX_TOKENS: Record<string, number> = { beatriz: 24000, marcela: 20000, teo: 20000, pedro: 12000, rafaela: 14000, bobby: 14000, aira: 12000 };
/** Quanto de cada entrega anterior entra no contexto do próximo agente. */
const LIMITE_HANDOFF = 16000;

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Cabeçalhos para chamar outras funções (e a si mesma) com a chave de serviço.
 * O gateway exige que uma chave `sb_secret_…` vá SÓ no `apikey`; a chave
 * legada (JWT) vai nos dois. Sem isso, a etapa seguinte nunca é acionada.
 */
function cabecalhosInternos(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (SERVICE_KEY.startsWith("sb_secret_")) h.apikey = SERVICE_KEY;
  else { h.Authorization = `Bearer ${SERVICE_KEY}`; h.apikey = SERVICE_KEY; }
  return h;
}

async function autenticar(req: Request, sb: SB): Promise<{ interno: boolean; userId: string | null }> {
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const apikey = (req.headers.get("apikey") ?? "").trim();
  // Chave secreta nova chega só no `apikey` (regra do gateway).
  if (!bearer && apikey.startsWith("sb_secret_")) {
    if (apikey === SERVICE_KEY) return { interno: true, userId: null };
    const probe = createClient(SUPABASE_URL, apikey);
    const { error } = await probe.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (!error) return { interno: true, userId: null };
  }
  if (!bearer) return { interno: false, userId: null };
  if (bearer === SERVICE_KEY || (CRON_SECRET && bearer === CRON_SECRET)) return { interno: true, userId: null };
  // Qualquer outra chave só é interna se conseguir uma operação administrativa
  // de verdade — token de usuário e chave anon falham aqui. Cobre o JWT
  // service_role legado (que o gateway aceita) e a chave secreta nova.
  if (bearer.startsWith("sb_secret_") || bearer.startsWith("eyJ")) {
    const probe = createClient(SUPABASE_URL, bearer);
    const { error } = await probe.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (!error) return { interno: true, userId: null };
  }
  const { data } = await sb.auth.getUser(bearer);
  return { interno: false, userId: data?.user?.id ?? null };
}

// ─── Datas (horário de Brasília) ──────────────────────────────────────────────

function hojeLocal(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
function datasDoPeriodo(inicio: string, dias: number): string[] {
  const out: string[] = [];
  const d = new Date(`${inicio}T12:00:00`);
  for (let i = 0; i < dias; i++) { out.push(iso(d)); d.setDate(d.getDate() + 1); }
  return out;
}

// ─── Contexto do cliente ──────────────────────────────────────────────────────

interface Contexto {
  slug: string;
  nome: string;
  segmento: string;
  nicho: string;
  plataformas: string[];
  site: string;
  notas: string;
  briefing_estruturado: Dict | null;
  marca: Dict | null;
  agentes_ativos: string[] | null;
  temas_ja_usados: string[];
  skills: Array<{ tipo: string; nome: string; resumo: string; instrucoes: string }>;
}

async function contextoDoCliente(sb: SB, slug: string, userId: string | null): Promise<Contexto> {
  // `.limit(1)` em tudo que é "por cliente": há clientes com mais de uma linha
  // de marca/agentes, e `maybeSingle()` com duas linhas devolve erro (e null).
  const { data: c } = await sb.from("clients")
    .select("id,name,segment,website,notes").eq("workspace_id", slug).limit(1).maybeSingle();
  const { data: perfil } = await sb.from("client_profiles")
    .select("name,industry,nicho,brand_color,platforms").eq("client_id", slug).limit(1).maybeSingle();
  const { data: brief } = c?.id
    ? await sb.from("client_briefings").select("*").eq("client_id", c.id)
        .order("updated_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const { data: marca } = await sb.from("client_marca")
    .select("cor,cor_2,fonte,travado,logo_url").eq("client_id", slug)
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const { data: ag } = await sb.from("client_agents").select("agent_ids").eq("client_id", slug)
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const { data: memoria } = await sb.from("carousel_memory").select("tema")
    .eq("client_id", slug).order("created_at", { ascending: false }).limit(15);
  const { data: skills } = await sb.from("content_skills")
    .select("tipo,nome,resumo,instrucoes,nativa")
    .or(`nativa.eq.true${userId ? `,user_id.eq.${userId}` : ""}`);

  const nome = (perfil?.name as string) || (c?.name as string) || slug;
  const segmento = (brief?.segment as string) || (c?.segment as string) || (perfil?.industry as string) || "";
  return {
    slug,
    nome,
    segmento,
    nicho: (perfil?.nicho as string) || segmento,
    plataformas: (brief?.active_platforms as string[]) ?? (perfil?.platforms as string[]) ?? ["instagram"],
    site: (brief?.website as string) || (c?.website as string) || "",
    notas: (c?.notes as string) || "",
    briefing_estruturado: (brief as Dict) ?? null,
    marca: (marca as Dict) ?? (perfil?.brand_color ? { cor: perfil.brand_color } : null),
    agentes_ativos: (ag?.agent_ids as string[]) ?? null,
    temas_ja_usados: (memoria ?? []).map((m: { tema: string }) => m.tema).filter(Boolean),
    skills: (skills ?? []) as Contexto["skills"],
  };
}

function textoDoContexto(ctx: Contexto): string {
  const b = ctx.briefing_estruturado ?? {};
  const lista = (v: unknown) => Array.isArray(v) && v.length ? v.join(", ") : null;
  const linhas = [
    `Nome: ${ctx.nome}`,
    `Segmento: ${ctx.segmento || "—"}`,
    ctx.nicho && ctx.nicho !== ctx.segmento ? `Nicho: ${ctx.nicho}` : null,
    `Plataformas ativas: ${ctx.plataformas.join(", ")}`,
    ctx.site ? `Site: ${ctx.site}` : null,
    ctx.notas ? `Notas internas: ${ctx.notas}` : null,
  ].filter(Boolean);

  const brief = [
    b.target_audience ? `- Público-alvo: ${b.target_audience}` : null,
    b.brand_voice ? `- Tom de voz: ${b.brand_voice}` : null,
    lista(b.goals) ? `- Objetivos: ${lista(b.goals)}` : null,
    lista(b.competitors) ? `- Concorrentes: ${lista(b.competitors)}` : null,
    b.differentials ? `- Diferenciais: ${b.differentials}` : null,
    b.restrictions ? `- Restrições: ${b.restrictions}` : null,
    b.post_frequency ? `- Frequência desejada: ${b.post_frequency}` : null,
    b.monthly_budget ? `- Verba mensal: R$ ${b.monthly_budget}` : null,
    b.notes ? `- Observações: ${b.notes}` : null,
  ].filter(Boolean);

  const m = ctx.marca ?? {};
  const marca = [
    m.cor ? `- Cor primária: ${m.cor}` : null,
    m.cor_2 ? `- Cor secundária: ${m.cor_2}` : null,
    m.fonte ? `- Fonte: ${m.fonte}` : null,
    m.travado ? `- MARCA TRAVADA: cor e fonte não mudam; só layout, fundo e acabamento variam.` : null,
    m.logo_url ? `- Logo: ${m.logo_url}` : null,
  ].filter(Boolean);

  return [
    linhas.join("\n"),
    brief.length ? `\n## Briefing estruturado do cliente\n${brief.join("\n")}` : "",
    marca.length ? `\n## Marca\n${marca.join("\n")}` : "",
    ctx.temas_ja_usados.length ? `\n## Temas já publicados (não repetir)\n${ctx.temas_ja_usados.map((t) => `- ${t}`).join("\n")}` : "",
  ].join("\n");
}

const ativo = (ctx: Contexto, id: string) => {
  const cat = ID_NO_CATALOGO[id];
  if (!cat || !ctx.agentes_ativos) return true; // Aira e Carolina sempre; sem linha = time inteiro
  return ctx.agentes_ativos.includes(cat);
};

// ─── Conversa entre agentes ───────────────────────────────────────────────────

async function msg(
  sb: SB, run: Dict, etapa: string, de: string, para: string, tipo: string, conteudo: string, payload?: Dict,
) {
  await sb.from("agent_messages").insert({
    run_id: run.id, client_id: run.client_id, etapa, de, para, tipo,
    conteudo: conteudo.slice(0, 4000), payload: payload ?? null,
  });
}

async function mensagensPara(sb: SB, runId: string, ids: string[]): Promise<string> {
  const { data } = await sb.from("agent_messages").select("de,para,tipo,conteudo")
    .eq("run_id", runId).neq("tipo", "sistema").order("created_at", { ascending: true }).limit(60);
  const minhas = (data ?? []).filter((m: Dict) =>
    ids.some((id) => String(m.para).split(",").includes(id)) || m.para === "time");
  if (!minhas.length) return "";
  return minhas.slice(-12).map((m: Dict) =>
    `- ${TIME[m.de as string]?.nome ?? m.de} → ${m.para === "time" ? "time" : ids.map((i) => TIME[i]?.nome ?? i).join("/")} (${m.tipo}): ${m.conteudo}`,
  ).join("\n");
}

// ─── Entregas anteriores (handoffs) ───────────────────────────────────────────

interface Entrega { etapa: string; agente: string; output: string; structured: Dict | null }

async function entregasAnteriores(sb: SB, runId: string, etapas: string[]): Promise<Entrega[]> {
  if (!etapas.length) return [];
  const { data } = await sb.from("orchestration_tasks")
    .select("etapa,agente,output,structured_output,completed_at")
    .eq("run_id", runId).eq("status", "done").in("etapa", etapas)
    .order("completed_at", { ascending: true });
  const todas = (data ?? []) as Array<Dict>;
  // Retrabalho substitui a entrega original do mesmo agente.
  const retrabalhados = new Set(todas.filter((t) => t.etapa === "retrabalho").map((t) => t.agente));
  return todas
    .filter((t) => !(ETAPAS_DE_PRODUCAO.includes(String(t.etapa)) && retrabalhados.has(t.agente)))
    .map((t) => ({
      etapa: t.etapa as string, agente: t.agente as string,
      output: (t.output as string) ?? "", structured: (t.structured_output as Dict) ?? null,
    }));
}

function textoDasEntregas(entregas: Entrega[]): string {
  if (!entregas.length) return "Você é o primeiro a trabalhar neste projeto.";
  return entregas.map((e) => {
    const a = TIME[e.agente];
    const et = ETAPAS.find((x) => x.id === e.etapa);
    const corpo = e.output.length > LIMITE_HANDOFF
      ? e.output.slice(0, LIMITE_HANDOFF) + "\n\n[…entrega continua; trecho cortado por tamanho]"
      : e.output;
    return `## ${a?.nome ?? e.agente} (${a?.papel ?? ""}) — ${et?.titulo ?? e.etapa}\n${corpo}`;
  }).join("\n\n---\n\n");
}

// ─── Claude ───────────────────────────────────────────────────────────────────

async function chamarClaude(system: string, user: string, id: string): Promise<string> {
  if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY não configurada");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 330_000);
  const base = {
    model: MODELO,
    max_tokens: MAX_TOKENS[id] ?? 8000,
    system,
    messages: [{ role: "user", content: user }],
  };
  const completo = {
    ...base,
    thinking: { type: "adaptive" },
    output_config: { effort: ESFORCO[id] ?? "medium" },
    fallbacks: "default",
  };
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": ANTHROPIC_KEY,
    "anthropic-version": "2023-06-01",
  };
  try {
    let r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: ctrl.signal,
      headers: { ...headers, "anthropic-beta": "server-side-fallback-2026-07-01" },
      body: JSON.stringify(completo),
    });
    // Se a API recusar algum parâmetro novo, tenta o pedido básico em vez de
    // derrubar a etapa inteira.
    if (r.status === 400) {
      r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", signal: ctrl.signal, headers, body: JSON.stringify(base),
      });
    }
    if (!r.ok) throw new Error(`Claude ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const d = await r.json();
    if (d.stop_reason === "refusal") {
      throw new Error(`pedido recusado (${d.stop_details?.category ?? "sem categoria"}): ${d.stop_details?.explanation ?? ""}`);
    }
    let texto = (d.content ?? [])
      .filter((b: Dict) => b.type === "text")
      .map((b: Dict) => b.text as string)
      .join("\n").trim();
    if (!texto) throw new Error("resposta vazia");
    if (d.stop_reason === "max_tokens") texto += "\n\n[entrega cortada no limite de tamanho — o próximo agente deve considerar isso]";
    return texto;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error("demorou demais e foi interrompido");
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function extrair(texto: string): { nota: string | null; json: Dict | null } {
  const blocos = [...texto.matchAll(/```json\s*([\s\S]*?)```/gi)];
  let json: Dict | null = null;
  for (const b of blocos.reverse()) {
    try { json = JSON.parse(b[1]); break; } catch { /* tenta o anterior */ }
  }
  const nota = texto.match(/###\s*Nota para o time\s*\n([\s\S]*?)(?=\n```|\n###|$)/i)?.[1]?.trim() ?? null;
  return { nota, json };
}

// ─── Prompt de cada agente ────────────────────────────────────────────────────

function systemDe(a: Agente, ctx: Contexto): string {
  let s = a.system + blocoDeSkills(a);
  const tipos = SKILLS_DA_CASA[a.id];
  if (tipos) {
    const sk = ctx.skills.filter((x) => tipos.includes(x.tipo));
    if (sk.length) {
      s += `\n\nSkills da casa disponíveis (use as que servirem e diga qual usou):\n` +
        sk.map((x) => `- ${x.nome}: ${x.resumo}\n  ${(x.instrucoes ?? "").replace(/\s+/g, " ").slice(0, 900)}`).join("\n");
    }
  }
  s += `\n\nVocê trabalha numa agência de publicidade premiada e escreve para colegas, não para um chatbot: direto, específico, sem preâmbulo.`;
  if (a.json) {
    s += `\n\nFORMATO DA ENTREGA (obrigatório, nesta ordem):\n` +
      `1. Um resumo em Markdown de no máximo 25 linhas: as decisões que você tomou e por quê. NÃO repita aqui o conteúdo das peças — ele vai no JSON.\n` +
      `2. A seção "### Nota para o time" (2 a 4 linhas para quem recebe seu trabalho a seguir: o que precisa saber, decisões, o que ficou em aberto).\n` +
      `3. Um único bloco \`\`\`json com este formato exato, preenchido com o conteúdo COMPLETO e real da sua entrega — o JSON É a entrega, é o que os colegas e o sistema leem:\n${a.json}\n` +
      `O JSON precisa ser válido e fechado. Se for longo, corte o resumo, nunca o JSON.`;
  } else {
    s += `\n\nFormato da entrega: Markdown com títulos claros e tabelas. Termine OBRIGATORIAMENTE com a seção:\n` +
      `### Nota para o time\n(2 a 4 linhas para quem recebe seu trabalho a seguir: o que precisa saber, decisões que você tomou, o que ficou em aberto)`;
  }
  return s;
}

function pedidoDe(
  a: Agente, etapa: Etapa, run: Dict, ctx: Contexto, entregas: Entrega[], mensagens: string, extra: string, anexos: string,
): string {
  const cfg = (run.config as Dict) ?? {};
  const datas = datasDoPeriodo(String(cfg.inicio), Number(cfg.periodo_dias ?? 30));
  return [
    `# Cliente\n${textoDoContexto(ctx)}`,
    `# Período de trabalho\nDe ${datas[0]} a ${datas[datas.length - 1]} (${datas.length} dias). Hoje é ${iso(hojeLocal())}.`,
    `# Briefing / pedido do cliente\n${run.briefing}`,
    `# Etapa: ${etapa.titulo}\n${etapa.pedido}${extra}`,
    `# O que o time já entregou\n${textoDasEntregas(entregas)}`,
    mensagens ? `# Mensagens do time para você\n${mensagens}` : "",
    anexos,
    `Agora faça a sua parte, ${a.nome}.`,
  ].filter(Boolean).join("\n\n");
}

// ─── Ferramentas de apoio (Ben pesquisa, Marcela gera imagem) ─────────────────

async function chamarFuncao(slug: string, corpo: unknown, timeoutMs: number): Promise<Dict> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${slug}`, {
      method: "POST", signal: ctrl.signal,
      headers: cabecalhosInternos(),
      body: JSON.stringify(corpo),
    });
    const texto = await r.text();
    if (!r.ok) throw new Error(`${slug} ${r.status}: ${texto.slice(0, 200)}`);
    try { return JSON.parse(texto); } catch { return { texto }; }
  } finally { clearTimeout(t); }
}

async function pesquisaDoBen(ctx: Contexto): Promise<string> {
  try {
    const r = await chamarFuncao("ben-trends", {
      nicho: ctx.nicho || ctx.segmento || ctx.nome, plataforma: "todas", client_name: ctx.nome,
    }, 150_000);
    return String(r.content ?? "").trim();
  } catch { return ""; }
}

const RATIO: Record<string, string> = { "4:5": "3:4", "3:4": "3:4", "1:1": "1:1", "9:16": "9:16", "16:9": "16:9", "4:3": "4:3" };

async function gerarImagens(pecas: Dict[], ctx: Contexto, max: number): Promise<Dict[]> {
  const alvo = pecas.filter((p) => p.prompt_imagem).slice(0, max);
  const feitas = await Promise.allSettled(alvo.map(async (p) => {
    const r = await chamarFuncao("generate-image", {
      prompt: p.prompt_imagem,
      aspectRatio: RATIO[String(p.proporcao ?? "")] ?? "3:4",
      clientContext: { name: ctx.nome, industry: ctx.segmento, brand_color: ctx.marca?.cor ?? null },
    }, 120_000);
    const url = (r.url ?? r.image_url ?? r.imageUrl ?? (r.images as Dict[] | undefined)?.[0]?.url) as string | undefined;
    if (!url) throw new Error("sem url");
    return { data: p.data ?? null, tema: p.tema ?? null, headline: p.headline_na_arte ?? null, url };
  }));
  return feitas.filter((f) => f.status === "fulfilled").map((f) => (f as PromiseFulfilledResult<Dict>).value);
}

// ─── Execução de uma etapa ────────────────────────────────────────────────────

async function garantirTask(sb: SB, runId: string, etapa: string, id: string) {
  const a = TIME[id];
  const key = `${etapa}:${id}`;
  const { data } = await sb.from("orchestration_tasks").select("id").eq("run_id", runId).eq("agent_key", key).maybeSingle();
  if (data) return;
  await sb.from("orchestration_tasks").insert({
    run_id: runId, agent_key: key, agent_label: `${a.nome} · ${a.papel}`, etapa, agente: id, status: "pending",
  });
}

async function agentesParaRetrabalho(sb: SB, runId: string): Promise<{ ids: string[]; ajustes: Dict[] }> {
  const { data } = await sb.from("orchestration_tasks").select("structured_output")
    .eq("run_id", runId).eq("agent_key", "revisao:vitoria").eq("status", "done").maybeSingle();
  const js = ((data?.structured_output as Dict)?.json as Dict) ?? {};
  const ajustes = (Array.isArray(js.ajustes) ? js.ajustes : []) as Dict[];
  const serios = ajustes.filter((a) => /cr[ií]tic|important/i.test(String(a.prioridade ?? "")));
  const { data: prod } = await sb.from("orchestration_tasks").select("agente")
    .eq("run_id", runId).in("etapa", ETAPAS_DE_PRODUCAO).eq("status", "done");
  const produziram = new Set((prod ?? []).map((t: Dict) => t.agente as string));
  const ids = [...new Set(serios.map((a) => String(a.agente ?? "").toLowerCase()))]
    .filter((id) => produziram.has(id));
  return { ids, ajustes: serios };
}

async function trabalhar(
  sb: SB, run: Dict, etapa: Etapa, id: string, ctx: Contexto, entregas: Entrega[], mensagens: string, ajustes: Dict[],
): Promise<void> {
  const a = agente(id)!;
  const cfg = (run.config as Dict) ?? {};
  const key = `${etapa.id}:${id}`;
  const marcar = (patch: Dict) => sb.from("orchestration_tasks").update(patch).eq("run_id", run.id).eq("agent_key", key);

  try {
    let extra = "";
    if (id === "ben") {
      const pesquisa = await pesquisaDoBen(ctx);
      extra = pesquisa
        ? `\n\n## Pesquisa de campo (levantada agora, use como base)\n${pesquisa.slice(0, 12000)}`
        : `\n\n(A pesquisa automática de tendências não respondeu. Trabalhe com o que sabe do nicho e marque explicitamente o que precisa ser verificado.)`;
    }
    if (id === "pedro") {
      const datas = datasDoPeriodo(String(cfg.inicio), Number(cfg.periodo_dias ?? 30));
      extra = `\n\nDatas válidas do período — use SOMENTE estas: ${datas.join(", ")}.\n` +
        `Quantidade de peças a calendarizar: ${cfg.qtd_pecas ?? 8}. Plataformas ativas: ${ctx.plataformas.join(", ")}. ` +
        `Marque pelo menos 2 itens como vídeo (reels) para o Bobby.`;
    }
    if (etapa.id === "retrabalho") {
      const meus = ajustes.filter((x) => String(x.agente ?? "").toLowerCase() === id);
      extra = `\n\nAjustes que a Vitória pediu a você:\n` +
        meus.map((x) => `- [${x.prioridade}] ${x.item}: ${x.problema} → ${x.correcao}`).join("\n") +
        `\n\nSua entrega original está em "O que o time já entregou". Devolva a entrega COMPLETA já corrigida, no mesmo formato (com o bloco json).`;
    }

    const anexos = blocoDeContexto((run.config as Dict)?.documentos, await lerUrls((run.config as Dict)?.urls));
    const texto = await chamarClaude(systemDe(a, ctx), pedidoDe(a, etapa, run, ctx, entregas, mensagens, extra, anexos), id);
    const { nota, json: js } = extrair(texto);
    const structured: Dict = { json: js, nota };

    if (id === "marcela" && cfg.gerar_imagens !== false) {
      const pecas = (Array.isArray(js?.pecas) ? js!.pecas : []) as Dict[];
      const imagens = await gerarImagens(pecas, ctx, Number(cfg.max_imagens ?? 3));
      structured.imagens = imagens;
      if (imagens.length) await msg(sb, run, etapa.id, "marcela", "time", "handoff", `Gerei ${imagens.length} arte(s) de referência: ${imagens.map((i) => i.tema ?? i.headline).filter(Boolean).join("; ")}.`, { imagens });
    }

    await marcar({ status: "done", output: texto, structured_output: structured, completed_at: new Date().toISOString() });

    // Handoff: a nota vai para quem vem a seguir.
    const prox = proximaEtapa(etapa.id);
    const para = prox && prox.agentes.length ? prox.agentes.filter((p) => ativo(ctx, p)).join(",") || "time" : "time";
    await msg(sb, run, etapa.id, id, para, etapa.id === "retrabalho" ? "retrabalho" : "handoff",
      nota ?? texto.replace(/[#*`]/g, "").slice(0, 400));

    // Vitória fala diretamente com quem precisa ajustar.
    if (id === "vitoria" && Array.isArray(js?.ajustes)) {
      for (const aj of (js!.ajustes as Dict[]).slice(0, 12)) {
        const alvo = String(aj.agente ?? "").toLowerCase();
        if (!TIME[alvo]) continue;
        await msg(sb, run, etapa.id, "vitoria", alvo, "feedback",
          `[${aj.prioridade ?? "sugestão"}] ${aj.item ?? ""}: ${aj.problema ?? ""} → ${aj.correcao ?? ""}`, aj);
      }
    }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await marcar({ status: "error", error: err.slice(0, 500), completed_at: new Date().toISOString() });
    await msg(sb, run, etapa.id, "aira", "time", "sistema", `${a.nome} não conseguiu entregar (${err.slice(0, 200)}). O time segue com o que tem.`);
    throw e;
  }
}

async function montarFilaDeAprovacao(sb: SB, run: Dict, ctx: Contexto) {
  const entregas = await entregasAnteriores(sb, run.id as string, ["planejamento", ...ETAPAS_DE_PRODUCAO, "retrabalho", "aprovacao"]);
  const de = (id: string) => entregas.find((e) => e.agente === id);
  const pecas = ((de("beatriz")?.structured?.json as Dict)?.pecas ?? []) as Dict[];
  const visuais = ((de("marcela")?.structured?.json as Dict)?.pecas ?? []) as Dict[];
  const imagens = (de("marcela")?.structured?.imagens ?? []) as Dict[];
  const itens = ((de("pedro")?.structured?.json as Dict)?.itens ?? []) as Dict[];
  const aira = de("aira");

  const horaDe = (p: Dict) => itens.find((i) => i.data === p.data && (i.tema === p.tema || i.plataforma === p.plataforma))?.hora
    ?? itens.find((i) => i.data === p.data)?.hora ?? "09:00";
  const imagemDe = (p: Dict) => imagens.find((i) => i.data === p.data || i.tema === p.tema)?.url ?? null;
  const visualDe = (p: Dict) => visuais.find((v) => v.data === p.data || v.tema === p.tema) ?? null;

  const propostas: Dict[] = [];
  const posts: Dict[] = [];
  for (const p of pecas) {
    if (!p.data || !p.legenda) continue;
    const hora = String(horaDe(p)).slice(0, 5);
    const plat = String(p.plataforma ?? ctx.plataformas[0] ?? "instagram").toLowerCase();
    const legenda = String(p.legenda) + (Array.isArray(p.hashtags) && p.hashtags.length ? `\n\n${(p.hashtags as string[]).map((h) => h.startsWith("#") ? h : `#${h}`).join(" ")}` : "");
    const url = imagemDe(p);
    const titulo = `${String(p.formato ?? "post")} · ${String(p.tema ?? "").slice(0, 80)}`;
    propostas.push({
      client_id: run.client_id, user_id: run.user_id,
      agent_id: "aira", agent_name: "Aira", agent_color: "#B9FF4B",
      kind: "editorial", status: "pending",
      titulo, title: titulo,
      descricao: legenda.slice(0, 1500),
      scheduled_for: `${p.data}T${hora}:00-03:00`,
      payload: {
        inner_kind: "post", title: titulo, description: legenda, scheduled_date: p.data, scheduled_time: hora,
        platform: plat, formato: p.formato ?? null, pilar: null, cta: p.cta ?? null, gatilho: p.gatilho ?? null,
        slides: p.slides ?? null, brief_visual: p.brief_visual ?? null, visual: visualDe(p), imagem_url: url,
        run_id: run.id, origem: "agencia-pipeline",
      },
    });
    posts.push({
      user_id: run.user_id, client_id: run.client_id,
      platforms: [plat], caption: legenda,
      media_url: url, media_type: url ? "image" : null,
      scheduled_at: `${p.data}T${hora}:00-03:00`, status: "draft",
    });
  }
  if (propostas.length) {
    const { error } = await sb.from("agent_proposals").insert(propostas);
    if (error) await msg(sb, run, "aprovacao", "aira", "time", "sistema", `Não consegui gravar a fila de aprovação: ${error.message}`);
  }
  if (posts.length) {
    const { error } = await sb.from("scheduled_posts").insert(posts);
    if (error) await msg(sb, run, "aprovacao", "aira", "time", "sistema", `Rascunhos de post não gravados: ${error.message}`);
  }
  await sb.from("client_deliverables").insert({
    client_id: run.client_id, category: "Planejamento",
    title: `Produção do período — ${propostas.length} peça(s) na fila de aprovação`,
    description: (aira?.output ?? "").slice(0, 12000),
    status: "concluído", done_at: new Date().toISOString(), visible_to_client: true,
  });
  await msg(sb, run, "aprovacao", "aira", "cliente", "aprovacao",
    `${propostas.length} peça(s) entraram na fila de aprovação${imagens.length ? `, ${imagens.length} já com arte de referência` : ""}. ` +
    `Rascunhos criados no agendamento. O que depende do cliente está no relatório.`);
}

/**
 * Dispara uma etapa sem esperar a resposta (ela só chega quando a etapa
 * inteira terminar). O pedido sai imediatamente; se o worker que disparou
 * for encerrado, o vigia em `status` reaciona o que ficou parado.
 */
/** Aciona uma etapa. O `step` responde 202 na hora, então isto é rápido. */
async function disparar(runId: string, etapaId: string) {
  await fetch(SELF, {
    method: "POST",
    headers: cabecalhosInternos(),
    body: JSON.stringify({ action: "step", run_id: runId, etapa: etapaId }),
  }).then((r) => { r.body?.cancel().catch(() => {}); }).catch(() => {});
}

async function avancar(sb: SB, run: Dict, etapa: Etapa) {
  const prox = proximaEtapa(etapa.id);
  if (!prox) return finalizar(sb, run);
  await sb.from("orchestration_runs").update({ etapa_atual: prox.id }).eq("id", run.id);
  await disparar(run.id as string, prox.id);
}

/**
 * Vigia: chamado a cada consulta de status. Se um agente está "rodando" há
 * tempo demais, o worker dele morreu — marca erro. Se ninguém está rodando e
 * a produção não acabou, reaciona a etapa atual (ou a seguinte).
 */
async function vigiar(sb: SB, run: Dict): Promise<string | null> {
  if (run.status !== "running") return null;
  const { data } = await sb.from("orchestration_tasks")
    .select("agent_key,etapa,agente,status,started_at,completed_at").eq("run_id", run.id);
  const tasks = (data ?? []) as Dict[];
  const agora = Date.now();
  const LIMITE_MS = 9 * 60_000;

  const travadas = tasks.filter((t) => t.status === "running" && agora - Date.parse(String(t.started_at)) > LIMITE_MS);
  for (const t of travadas) {
    await sb.from("orchestration_tasks").update({ status: "error", error: "sem resposta — execução interrompida pela plataforma", completed_at: new Date().toISOString() }).eq("run_id", run.id).eq("agent_key", t.agent_key);
    await msg(sb, run, String(t.etapa), "aira", "time", "sistema", `${TIME[t.agente as string]?.nome ?? t.agente} ficou sem responder e foi marcada como falha. Reacionando a produção.`);
  }
  if (tasks.some((t) => t.status === "running" && !travadas.includes(t))) return null; // alguém trabalhando

  // Nada rodando: qual etapa acionar? A atual, se ainda tem pendente; senão a seguinte.
  const atualId = String(run.etapa_atual ?? "briefing");
  const atual = ETAPAS.find((e) => e.id === atualId);
  if (!atual) return null;
  const daAtual = tasks.filter((t) => t.etapa === atualId);
  const ultimaAtividade = Math.max(0, ...tasks.map((t) => Date.parse(String(t.completed_at ?? t.started_at ?? 0)) || 0));
  if (agora - ultimaAtividade < 40_000) return null; // acabou de acontecer algo; a cadeia normal deve seguir

  let alvo: Etapa | undefined;
  if (daAtual.some((t) => t.status === "pending") || (atualId === "retrabalho" && !daAtual.length)) alvo = atual;
  else if (daAtual.every((t) => t.status === "done" || t.status === "error")) {
    // etapa crítica sem nenhum sucesso: encerra
    if (atual.critica && daAtual.length && !daAtual.some((t) => t.status === "done")) {
      await sb.from("orchestration_runs").update({ status: "error", completed_at: new Date().toISOString() }).eq("id", run.id);
      await msg(sb, run, atualId, "aira", "cliente", "sistema", `A etapa "${atual.titulo}" é essencial e ninguém conseguiu entregar. Produção interrompida — use "retomar".`);
      return "erro";
    }
    if (atualId === "relatorio") { await finalizar(sb, run); return "finalizado"; }
    alvo = proximaEtapa(atualId);
  }
  if (!alvo) return null;
  await sb.from("orchestration_runs").update({ etapa_atual: alvo.id }).eq("id", run.id);
  await msg(sb, run, alvo.id, "aira", "time", "sistema", `Vigia: reacionando "${alvo.titulo}".`);
  await disparar(run.id as string, alvo.id);
  return alvo.id;
}

async function finalizar(sb: SB, run: Dict) {
  const { data } = await sb.from("orchestration_tasks").select("output")
    .eq("run_id", run.id).eq("agent_key", "relatorio:aira").eq("status", "done").maybeSingle();
  const report = (data?.output as string) ?? "Produção concluída. Veja as entregas de cada agente.";
  await sb.from("orchestration_runs").update({
    status: "done", report, share_token: (run.share_token as string) ?? crypto.randomUUID(),
    completed_at: new Date().toISOString(), etapa_atual: "concluido",
  }).eq("id", run.id);
  await msg(sb, run, "relatorio", "aira", "cliente", "aprovacao", "Relatório executivo pronto. Produção do período concluída.");
}

async function executarEtapa(sb: SB, runId: string, etapaId: string) {
  const { data: run } = await sb.from("orchestration_runs").select("*").eq("id", runId).single();
  if (!run || run.status !== "running") return;
  const etapa = ETAPAS.find((e) => e.id === etapaId);
  if (!etapa) return;
  const ctx = run.contexto as Contexto;
  await sb.from("orchestration_runs").update({ etapa_atual: etapaId }).eq("id", runId);

  let ids = etapa.agentes;
  let ajustes: Dict[] = [];
  if (etapaId === "retrabalho") {
    const r = await agentesParaRetrabalho(sb, runId);
    ids = r.ids; ajustes = r.ajustes;
  }
  ids = ids.filter((id) => ativo(ctx, id));

  if (!ids.length) {
    await msg(sb, run, etapaId, "aira", "time", "sistema",
      etapaId === "retrabalho"
        ? "Vitória não pediu ajuste crítico — produção segue direto para a fila de aprovação."
        : `Etapa "${etapa.titulo}" sem agente ativo neste cliente — pulada.`);
    return avancar(sb, run, etapa);
  }

  for (const id of ids) await garantirTask(sb, runId, etapaId, id);

  // Trava contra execução dupla: se alguém desta etapa já está rodando há
  // menos de 5 min, outro worker está cuidando dela.
  const { data: emCurso } = await sb.from("orchestration_tasks").select("agent_key,started_at")
    .eq("run_id", runId).eq("etapa", etapaId).eq("status", "running");
  if ((emCurso ?? []).some((t: Dict) => Date.now() - Date.parse(String(t.started_at)) < 5 * 60_000)) return;

  // Só quem ainda não entregou nesta etapa trabalha (retomada não refaz o que já está pronto).
  const { data: prontas } = await sb.from("orchestration_tasks").select("agente")
    .eq("run_id", runId).eq("etapa", etapaId).eq("status", "done");
  const jaFeito = new Set((prontas ?? []).map((t: Dict) => t.agente as string));
  ids = ids.filter((id) => !jaFeito.has(id));
  if (!ids.length) return avancar(sb, run, etapa);

  await sb.from("orchestration_tasks")
    .update({ status: "running", started_at: new Date().toISOString(), error: null })
    .eq("run_id", runId).in("agent_key", ids.map((id) => `${etapaId}:${id}`));

  const nomes = ids.map((id) => TIME[id].nome).join(", ");
  await msg(sb, run, etapaId, "aira", ids.join(","), "sistema",
    etapaId === "retrabalho" ? `Aira devolve para ajuste: ${nomes}.` : `Aira aciona ${nomes} — ${etapa.titulo}.`);

  const entregas = await entregasAnteriores(sb, runId, etapa.recebe);
  const mensagens = await mensagensPara(sb, runId, ids);
  const resultados = await Promise.allSettled(
    ids.map((id) => trabalhar(sb, run, etapa, id, ctx, entregas, mensagens, ajustes)),
  );
  const ok = resultados.filter((r) => r.status === "fulfilled").length;

  if (ok === 0 && etapa.critica) {
    await sb.from("orchestration_runs").update({ status: "error", completed_at: new Date().toISOString() }).eq("id", runId);
    await msg(sb, run, etapaId, "aira", "cliente", "sistema",
      `A etapa "${etapa.titulo}" é essencial e ninguém conseguiu entregar. Produção interrompida — corrija a causa e use "retomar".`);
    return;
  }

  if (etapaId === "aprovacao") {
    try { await montarFilaDeAprovacao(sb, run, ctx); }
    catch (e) { await msg(sb, run, etapaId, "aira", "time", "sistema", `Fila de aprovação não montada: ${e instanceof Error ? e.message : e}`); }
  }
  if (etapaId === "relatorio") return finalizar(sb, run);
  return avancar(sb, run, etapa);
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

const resumoDoTime = () =>
  Object.values(TIME).map((a) => ({ id: a.id, nome: a.nome, papel: a.papel, cor: a.cor, skills: a.skills }));
const resumoDasEtapas = () =>
  ETAPAS.map((e) => ({ id: e.id, titulo: e.titulo, agentes: e.agentes, critica: e.critica }));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  let body: Dict = {};
  try { body = await req.json(); } catch { /* sem corpo */ }
  const acao = String(body.action ?? "status");
  const auth = await autenticar(req, sb);

  const carregarRun = async (runId: string) => {
    const { data: run } = await sb.from("orchestration_runs").select("*").eq("id", runId).maybeSingle();
    if (!run) return null;
    if (!auth.interno && run.user_id !== auth.userId) return null;
    return run as Dict;
  };

  // ── start ──
  if (acao === "start") {
    const userId = auth.userId ?? (auth.interno ? (body.user_id as string) ?? null : null);
    if (!userId) return json({ error: "não autenticado" }, 401);
    const slug = String(body.client_id ?? "");
    const briefing = String(body.briefing ?? "").trim();
    if (!slug) return json({ error: "client_id obrigatório" }, 400);
    if (!briefing) return json({ error: "briefing obrigatório" }, 400);

    const ctx = await contextoDoCliente(sb, slug, userId);
    const inicio = new Date(hojeLocal()); inicio.setDate(inicio.getDate() + 2);
    const config = {
      inicio: iso(inicio),
      periodo_dias: Math.min(Math.max(Number(body.periodo_dias ?? 30), 7), 60),
      qtd_pecas: Math.min(Math.max(Number(body.qtd_pecas ?? 8), 3), 16),
      gerar_imagens: body.gerar_imagens !== false,
      max_imagens: Math.min(Number(body.max_imagens ?? 3), 6),
      documentos: body.documentos ?? null,
      urls: body.urls ?? null,
    };

    const { data: run, error } = await sb.from("orchestration_runs").insert({
      client_id: slug, user_id: userId, briefing, status: "running",
      pipeline: "agencia", config, contexto: ctx, etapa_atual: "briefing",
    }).select().single();
    if (error || !run) return json({ error: `não consegui abrir a produção: ${error?.message}` }, 500);

    const tasks: Dict[] = [];
    for (const e of ETAPAS) {
      for (const id of e.agentes) {
        if (!ativo(ctx, id)) continue;
        const a = TIME[id];
        tasks.push({ run_id: run.id, agent_key: `${e.id}:${id}`, agent_label: `${a.nome} · ${a.papel}`, etapa: e.id, agente: id, status: "pending" });
      }
    }
    await sb.from("orchestration_tasks").insert(tasks);
    await msg(sb, run as Dict, "briefing", "aira", "time", "sistema",
      `Produção aberta para ${ctx.nome}: ${config.periodo_dias} dias a partir de ${config.inicio}, ${config.qtd_pecas} peças. ` +
      `Time escalado: ${[...new Set(tasks.map((t) => TIME[t.agente as string].nome))].join(", ")}.`);

    await disparar(run.id as string, "briefing");
    return json({ run_id: run.id, acionado: true });
  }

  // ── step (interno) ──
  // Responde 202 na hora e executa a etapa em segundo plano (waitUntil). A
  // primeira produção real rodou 11 etapas assim, sem cair — o vigia em
  // `status` cobre o caso raro de o worker ser encerrado no meio.
  if (acao === "step") {
    const runId = String(body.run_id ?? "");
    const etapa = String(body.etapa ?? "");
    if (!runId || !etapa) return json({ error: "run_id e etapa obrigatórios" }, 400);
    if (!auth.interno) {
      const run = await carregarRun(runId);
      if (!run) return json({ error: "sem acesso" }, 403);
    }
    const trabalho = executarEtapa(sb, runId, etapa).catch(async (e) => {
      console.error("etapa falhou", etapa, e);
      await sb.from("agent_messages").insert({
        run_id: runId, etapa, de: "aira", para: "time", tipo: "sistema",
        conteudo: `Falha inesperada na etapa ${etapa}: ${e instanceof Error ? e.message : e}`,
      });
    });
    const rt = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
    if (rt?.waitUntil) rt.waitUntil(trabalho); else await trabalho;
    return json({ ok: true, etapa }, 202);
  }

  // ── status ──
  if (acao === "status") {
    const runId = String(body.run_id ?? "");
    const run = await carregarRun(runId);
    if (!run) return json({ error: "run não encontrado" }, 404);
    const vigia = await vigiar(sb, run).catch(() => null);
    if (vigia) Object.assign(run, (await carregarRun(runId)) ?? {});
    const { data: tasks } = await sb.from("orchestration_tasks")
      .select("agent_key,agent_label,etapa,agente,status,output,structured_output,error,started_at,completed_at")
      .eq("run_id", runId).order("started_at", { ascending: true });
    const { data: mensagens } = await sb.from("agent_messages")
      .select("id,etapa,de,para,tipo,conteudo,payload,created_at")
      .eq("run_id", runId).order("created_at", { ascending: true }).limit(300);
    return json({ run, tasks: tasks ?? [], mensagens: mensagens ?? [], etapas: resumoDasEtapas(), time: resumoDoTime() });
  }

  // ── listar ──
  if (acao === "listar") {
    if (!auth.userId && !auth.interno) return json({ error: "não autenticado" }, 401);
    const slug = String(body.client_id ?? "");
    let q = sb.from("orchestration_runs")
      .select("id,client_id,status,etapa_atual,briefing,share_token,created_at,completed_at,config")
      .eq("pipeline", "agencia").order("created_at", { ascending: false }).limit(10);
    if (slug) q = q.eq("client_id", slug);
    if (!auth.interno) q = q.eq("user_id", auth.userId);
    const { data } = await q;
    return json({ runs: data ?? [], etapas: resumoDasEtapas(), time: resumoDoTime() });
  }

  // ── cancelar / retomar ──
  if (acao === "cancelar" || acao === "retomar") {
    const run = await carregarRun(String(body.run_id ?? ""));
    if (!run) return json({ error: "run não encontrado" }, 404);
    if (acao === "cancelar") {
      await sb.from("orchestration_runs").update({ status: "cancelado", completed_at: new Date().toISOString() }).eq("id", run.id);
      await msg(sb, run, String(run.etapa_atual ?? ""), "aira", "time", "sistema", "Produção interrompida a pedido.");
      return json({ ok: true });
    }
    const etapa = ETAPAS.find((e) => e.id === run.etapa_atual)?.id ?? "briefing";
    // O que ficou "rodando" ou com erro nesta etapa volta a pendente e é refeito.
    await sb.from("orchestration_tasks").update({ status: "pending", error: null, started_at: null })
      .eq("run_id", run.id).eq("etapa", etapa).in("status", ["running", "error"]);
    await sb.from("orchestration_runs").update({ status: "running", completed_at: null, etapa_atual: etapa }).eq("id", run.id);
    await msg(sb, run, etapa, "aira", "time", "sistema", `Retomando a partir de "${ETAPAS.find((e) => e.id === etapa)?.titulo}".`);
    await disparar(run.id as string, etapa);
    return json({ ok: true, etapa });
  }

  // ── diag: só o formato da chave do ambiente, nunca o valor ──
  if (acao === "diag") {
    return json({
      chave_servico: SERVICE_KEY ? `${SERVICE_KEY.slice(0, 10)}… (${SERVICE_KEY.length})` : null,
      anthropic: Boolean(ANTHROPIC_KEY),
      auth: auth,
      modelo: MODELO,
    });
  }

  return json({ error: `ação desconhecida: ${acao}` }, 400);
});
