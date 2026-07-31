import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * Rotinas autônomas por cliente.
 *
 * A Carol define só QUANDO (rotina + dias + hora, em `client_routines`). Um
 * cron chama esta função de 15 em 15 minutos; ela acorda o que está na hora,
 * executa e **publica o resultado no portal do cliente** como entrega visível.
 *
 * Duas regras que valem para todas as rotinas:
 *  - **Respeita a escolha de agentes do cliente** (`client_agents`): agente que
 *    a Carol desmarcou não trabalha nem em rotina automática.
 *  - **Tudo que produz vira `client_deliverables` com `visible_to_client`** —
 *    o cliente abre o portal e vê o que a agência fez, sem ninguém copiar nada
 *    na mão. Rotina que roda e não deixa rastro no portal não serve.
 *
 * Uma rotina roda no MÁXIMO uma vez por dia (compara a data local do
 * `last_run_at`), então atraso do cron ou execução repetida não duplica
 * entrega.
 */

const TZ = "America/Fortaleza";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

/** Data e hora locais de Fortaleza — o cron roda em UTC e erraria o dia. */
function agoraLocal() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? "00";
  const data = `${p("year")}-${p("month")}-${p("day")}`;
  const hora = `${p("hour")}:${p("minute")}`;
  const diaSemana = new Date(`${data}T12:00:00Z`).getUTCDay();
  return { data, hora, diaSemana };
}

function dataLocalDe(iso: string | null): string | null {
  if (!iso) return null;
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(iso));
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? "00";
  return `${p("year")}-${p("month")}-${p("day")}`;
}

interface Cliente {
  id: string;
  nome: string;
  segmento: string;
  workspace: string;
}

export interface Resultado {
  titulo: string;
  categoria: string;
  texto: string;
  /** Rascunho que ainda depende de aprovação não vai para o portal do cliente. */
  publicar?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";

  const sb = createClient(supabaseUrl, serviceKey);

  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  let autorizado = Boolean(bearer) && (bearer === serviceKey || (cronSecret && bearer === cronSecret));
  if (!autorizado && bearer) {
    const { data: ok } = await sb.rpc("verify_cron_key", { p_name: "rotina-agentes", p_key: bearer });
    autorizado = ok === true;
  }
  if (!autorizado) return json({ error: "Unauthorized" }, 401);

  let corpo: Record<string, unknown> = {};
  try { corpo = await req.json(); } catch { /* chamada do cron vem sem corpo */ }
  const forcar = corpo.forcar === true;              // ignora dia/hora (teste)
  const soCliente = String(corpo.cliente ?? "");
  const soRotina = String(corpo.rotina ?? "");

  const { data, hora, diaSemana } = agoraLocal();

  const { data: rotinas } = await sb
    .from("client_routines")
    .select("*")
    .eq("ativo", true);

  const executadas: unknown[] = [];

  for (const r of rotinas ?? []) {
    if (soCliente && r.client_id !== soCliente) continue;
    if (soRotina && r.rotina !== soRotina) continue;

    if (!forcar) {
      if (!(r.dias_semana ?? []).includes(diaSemana)) continue;
      if (String(r.hora) > hora) continue;                    // ainda não deu a hora
      if (dataLocalDe(r.last_run_at) === data) continue;      // já rodou hoje
    }

    const label = `${r.client_id}/${r.rotina}`;
    try {
      const cliente = await carregarCliente(sb, r.client_id);
      const agentes = await agentesAtivos(sb, r.user_id, r.client_id);

      const resultado = await executarRotina({
        sb, supabaseUrl, serviceKey, anthropicKey,
        rotina: r.rotina, cliente, agentes, config: r.config ?? {},
        userId: r.user_id, hoje: data,
      });

      if (resultado.publicar !== false) await publicarNoPortal(sb, r.client_id, resultado);

      await sb.from("client_routines").update({
        last_run_at: new Date().toISOString(),
        last_status: "ok",
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq("id", r.id);

      executadas.push({ rotina: label, status: "ok", entrega: resultado.titulo });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await sb.from("client_routines").update({
        last_run_at: new Date().toISOString(),
        last_status: "erro",
        last_error: msg.slice(0, 400),
        updated_at: new Date().toISOString(),
      }).eq("id", r.id);
      executadas.push({ rotina: label, status: "erro", erro: msg.slice(0, 200) });
    }
  }

  return json({ hora_local: `${data} ${hora}`, dia_semana: diaSemana, executadas });
});

async function carregarCliente(sb: ReturnType<typeof createClient>, slug: string): Promise<Cliente> {
  const { data } = await sb
    .from("clients")
    .select("id, name, segment, workspace_id")
    .eq("workspace_id", slug)
    .maybeSingle();
  return {
    id: (data?.id as string) ?? "",
    nome: (data?.name as string) ?? slug,
    segmento: (data?.segment as string) ?? "",
    workspace: slug,
  };
}

/** Sem linha em client_agents = time inteiro (mesmo padrão do workspace). */
async function agentesAtivos(
  sb: ReturnType<typeof createClient>, userId: string, slug: string,
): Promise<string[] | null> {
  const { data } = await sb
    .from("client_agents")
    .select("agent_ids")
    .eq("user_id", userId).eq("client_id", slug)
    .maybeSingle();
  return (data?.agent_ids as string[]) ?? null;
}

const podeUsar = (agentes: string[] | null, id: string) => !agentes || agentes.includes(id);

async function chamarFuncao(
  supabaseUrl: string, serviceKey: string, slug: string, corpo: unknown,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${supabaseUrl}/functions/v1/${slug}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
  });
  const texto = await res.text();
  if (!res.ok) throw new Error(`${slug} ${res.status}: ${texto.slice(0, 200)}`);
  try { return JSON.parse(texto); } catch { return { texto }; }
}

async function executarRotina(ctx: {
  sb: ReturnType<typeof createClient>;
  supabaseUrl: string;
  serviceKey: string;
  anthropicKey: string;
  rotina: string;
  cliente: Cliente;
  agentes: string[] | null;
  config: Record<string, unknown>;
  userId: string;
  hoje: string;
}): Promise<Resultado> {
  const { sb, supabaseUrl, serviceKey, rotina, cliente, agentes } = ctx;

  // Memória da marca: o que já foi criado, para não repetir pauta.
  const { data: memoria } = await sb
    .from("carousel_memory")
    .select("tema")
    .eq("client_id", cliente.workspace)
    .order("created_at", { ascending: false })
    .limit(15);
  const historico = (memoria ?? []).map((m: { tema: string }) => m.tema).filter(Boolean);

  const dadosCliente = {
    nome: cliente.nome,
    segmento: cliente.segmento,
  };

  if (rotina === "pauta") {
    if (!podeUsar(agentes, "strategist") && !podeUsar(agentes, "copywriter")) {
      throw new Error("nenhum agente de conteúdo ativo neste cliente");
    }
    const r = await chamarFuncao(supabaseUrl, serviceKey, "carousel-studio", {
      action: "ideias",
      cliente: dadosCliente,
      nicho: cliente.segmento,
      historico,
    });
    const ideias = (r.ideias ?? []) as Array<{ tema: string; gancho: string; formato: string; porque: string }>;
    if (!ideias.length) throw new Error("a IA não devolveu pautas");

    // Sem markdown: o portal do cliente mostra esse texto como está.
    const texto = ideias
      .map((i, n) => `${n + 1}. ${i.gancho}\n   Tema: ${i.tema}\n   Formato: ${i.formato}\n   Por quê: ${i.porque}`)
      .join("\n\n");
    return {
      titulo: `Pautas da semana — ${ideias.length} ideias novas`,
      categoria: "Conteúdo",
      texto,
    };
  }

  if (rotina === "carrossel") {
    // Tema: a primeira pauta nova que a IA sugerir agora.
    const rIdeias = await chamarFuncao(supabaseUrl, serviceKey, "carousel-studio", {
      action: "ideias", cliente: dadosCliente, nicho: cliente.segmento, historico,
    });
    const primeira = ((rIdeias.ideias ?? []) as Array<{ tema: string }>)[0];
    if (!primeira?.tema) throw new Error("sem tema para o carrossel");

    const r = await chamarFuncao(supabaseUrl, serviceKey, "carousel-studio", {
      action: "strategy",
      cliente: dadosCliente,
      tema: primeira.tema,
      formato: "carrossel",
      nSlides: 7,
      objetivo: "autoridade",
      historico,
    });
    const slides = (r.slides ?? []) as Array<{ titulo: string; corpo: string }>;
    if (!slides.length) throw new Error("a IA não devolveu slides");

    // Entra na biblioteca do estúdio: a Carol abre, ajusta o design e publica.
    await sb.from("carousel_memory").insert({
      client_id: cliente.workspace,
      tema: primeira.tema,
      angulo: r.angulo ?? null,
      slides: r.slides,
      legenda: r.legenda ?? null,
      hashtags: r.hashtags ?? null,
    });

    const texto =
      `${r.titulo_projeto ?? primeira.tema}\n\n` +
      slides.map((s, n) => `${n + 1}. ${s.titulo}\n   ${s.corpo}`).join("\n\n") +
      `\n\nLegenda: ${r.legenda ?? ""}` +
      `\n\nMelhor horário: ${r.melhor_horario ?? "—"}`;
    return {
      titulo: `Carrossel pronto para revisão: ${primeira.tema}`,
      categoria: "Conteúdo",
      texto,
    };
  }

  if (rotina === "calendario") {
    if (!podeUsar(agentes, "calendario")) throw new Error("Pedro (calendário) não está ativo neste cliente");
    if (!ctx.anthropicKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    // Só os próximos 7 dias, e só datas que existem — a IA erra data quando
    // fica livre para inventar.
    const dias: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(`${ctx.hoje}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      dias.push(d.toISOString().slice(0, 10));
    }

    const itens = await planejarSemana(ctx.anthropicKey, cliente, dias, historico);
    if (!itens.length) throw new Error("a IA não devolveu itens de calendário");

    const linhas = itens.map((it) => {
      const data = dias.includes(it.scheduled_date) ? it.scheduled_date : dias[0];
      const hora = /^\d{2}:\d{2}$/.test(it.scheduled_time ?? "") ? it.scheduled_time : "10:00";
      return { ...it, scheduled_date: data, scheduled_time: hora };
    });

    const autoAprovar = ctx.config.auto_aprovar === true;

    if (autoAprovar) {
      // A Carol confiou a rotina: já entra no calendário que o cliente vê.
      const { error } = await sb.from("client_calendar_events").insert(
        linhas.map((it) => ({
          user_id: ctx.userId,
          client_id: cliente.workspace,
          kind: it.kind,
          title: it.title,
          description: it.description,
          event_date: it.scheduled_date,
          event_time: it.scheduled_time,
          payload: { platform: it.platform, origem: "rotina" },
          status: "scheduled",
        })),
      );
      if (error) throw new Error(`calendário: ${error.message}`);
    } else {
      // Padrão: fila de aprovação. O cliente não vê antes de a Carol liberar.
      const { error } = await sb.from("agent_proposals").insert(
        linhas.map((it) => ({
          user_id: ctx.userId,
          client_id: cliente.workspace,
          agent_id: "pedro",
          agent_name: "Pedro",
          agent_color: "#2DD4BF",
          kind: "editorial",
          title: it.title,
          titulo: it.title,
          descricao: it.description,
          payload: {
            inner_kind: it.kind,
            description: it.description,
            platform: it.platform,
            scheduled_date: it.scheduled_date,
            scheduled_time: it.scheduled_time,
            origem: "rotina",
          },
          scheduled_for: `${it.scheduled_date}T${it.scheduled_time}:00-03:00`,
          status: "pending",
        })),
      );
      if (error) throw new Error(`propostas: ${error.message}`);
    }

    const texto = linhas
      .map((it) => `${formatarDia(it.scheduled_date)} ${it.scheduled_time} — ${it.title} (${it.kind})\n${it.description}`)
      .join("\n\n");

    return {
      titulo: autoAprovar
        ? `Calendário da semana — ${linhas.length} ações programadas`
        : `Calendário da semana — ${linhas.length} ações para aprovar`,
      categoria: "Planejamento",
      texto,
      publicar: autoAprovar,   // rascunho pendente não vai para o portal
    };
  }

  if (rotina === "relatorio") {
    // Números reais, sem inventar: seguidores das contas e o que saiu/está na fila.
    const { data: conexoes } = await sb
      .from("social_connections")
      .select("platform, account_name, account_username, followers_count")
      .eq("client_id", cliente.workspace).eq("connected", true);

    const { data: posts } = await sb
      .from("scheduled_posts")
      .select("status, scheduled_at")
      .eq("client_id", cliente.workspace)
      .gte("scheduled_at", new Date(Date.now() - 30 * 86400_000).toISOString());

    const publicados = (posts ?? []).filter((p: { status: string }) => p.status === "published").length;
    const agendados = (posts ?? []).filter((p: { status: string }) => p.status === "scheduled").length;

    const linhasRedes = (conexoes ?? [])
      .map((c: { platform: string; account_username: string | null; followers_count: number | null }) =>
        `${c.platform}: ${c.account_username ?? "conta conectada"} — ${c.followers_count ?? 0} seguidores`)
      .join("\n") || "Nenhuma rede conectada ainda";

    const texto =
      `Redes conectadas\n${linhasRedes}\n\n` +
      `Últimos 30 dias\nPublicações realizadas: ${publicados}\nAgendadas para sair: ${agendados}\n\n` +
      `Conteúdo criado no período: ${historico.length} peça(s) na biblioteca da marca.`;
    return {
      titulo: "Relatório do período",
      categoria: "Relatório",
      texto,
    };
  }

  throw new Error(`rotina desconhecida: ${rotina}`);
}

interface ItemCalendario {
  kind: string;
  title: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  platform: string;
}

const formatarDia = (iso: string) => {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

/** Pedro planejando a semana. Datas fechadas na mão para a IA não inventar dia. */
async function planejarSemana(
  anthropicKey: string, cliente: Cliente, dias: string[], historico: string[],
): Promise<ItemCalendario[]> {
  const prompt =
    `Você é o Pedro, coordenador de calendário editorial da Calu Agência.\n\n` +
    `Cliente: ${cliente.nome}${cliente.segmento ? ` — segmento: ${cliente.segmento}` : ""}.\n` +
    `Planeje a semana usando SOMENTE estas datas: ${dias.join(", ")}.\n` +
    (historico.length ? `Já foi produzido recentemente (não repita): ${historico.join("; ")}.\n` : "") +
    `\nMisture posts de rede social, disparo de WhatsApp, e-mail, campanha/anúncio quando fizer ` +
    `sentido para o segmento, e tarefas internas da agência. Fale no vocabulário desse mercado, ` +
    `com sazonalidade e objeções reais dele. Distribua sem amontoar tudo no mesmo dia.\n\n` +
    `Responda APENAS com JSON válido, sem cercas de código:\n` +
    `{"items":[{"kind":"post|whatsapp|email|task|campaign|ad","title":"...","description":"o que ` +
    `exatamente será feito","scheduled_date":"YYYY-MM-DD","scheduled_time":"HH:MM",` +
    `"platform":"instagram|linkedin|facebook|wpp|email|interno"}]}\n\n` +
    `Entre 8 e 12 itens.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-5",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const texto = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");
  const bloco = texto.match(/\{[\s\S]*\}/);
  if (!bloco) throw new Error("Pedro não devolveu JSON");
  const parsed = JSON.parse(bloco[0]);
  return (parsed.items ?? []) as ItemCalendario[];
}

/**
 * O ponto da feature: o que a agência produz aparece para o cliente sozinho.
 * `visible_to_client` é o que o portal filtra.
 */
async function publicarNoPortal(
  sb: ReturnType<typeof createClient>, slug: string, r: Resultado,
) {
  const { error } = await sb.from("client_deliverables").insert({
    client_id: slug,
    category: r.categoria,
    title: r.titulo,
    description: r.texto.slice(0, 12000),
    status: "concluído",
    done_at: new Date().toISOString(),
    visible_to_client: true,
  });
  if (error) throw new Error(`portal: ${error.message}`);
}
