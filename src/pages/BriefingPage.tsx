import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap, Sparkles, Download, Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LIME = "#B9FF4B";
const BG = "#07080A";

// ── Lia system prompt ─────────────────────────────────────────────────────────
const LIA_PROMPT = `Você é Lia, consultora sênior de marketing digital da Calu Agência. Sua missão é coletar informações estratégicas do potencial cliente para que nosso time de especialistas prepare uma proposta personalizada.

Siga este roteiro em fases, sempre fazendo UMA PERGUNTA POR VEZ:

━━ FASE 1 — CONTATO ━━
Colete os três dados abaixo, um por vez:
1. Nome completo
2. E-mail
3. Telefone/WhatsApp

Confirme após receber o nome: "Ótimo, [nome]! Vou fazer algumas perguntas sobre seu negócio."

━━ FASE 2 — BRIEFING ESTRATÉGICO ━━
Faça em ordem, uma por vez:
1. "Qual é o segmento do seu negócio?"
2. "Me conta sobre seu produto ou serviço principal."
3. "Você tem presença nas redes sociais? Quais plataformas e quantos seguidores?"
4. "Qual é seu maior desafio de marketing hoje?"
5. "Seu objetivo principal: mais visibilidade, mais leads ou mais vendas?"
6. "Você investe em anúncios pagos? Se sim, qual o orçamento mensal?"
7. "Você tem site? Está satisfeito com ele?"

Após a última resposta, diga EXATAMENTE:
"Perfeito, [nome]! Já tenho tudo que preciso. Nosso time de especialistas está entrando na sala agora para preparar sua proposta personalizada — vai levar apenas alguns instantes! 🚀

[[BRIEFING_COMPLETO]]"

━━ REGRAS ━━
- Português brasileiro, profissional e acolhedor
- Use o nome do usuário
- Uma pergunta por vez, nunca acumule
- Após [[BRIEFING_COMPLETO]], não envie mais mensagens`;

// ── Agent config ──────────────────────────────────────────────────────────────
const PROPOSAL_AGENTS: {
  id: string;
  name: string;
  role: string;
  color: string;
  initial: string;
  prompt: (ctx: string) => string;
}[] = [
  {
    id: "queila",
    name: "Queila",
    role: "Estrategista",
    color: "#FBBF24",
    initial: "Q",
    prompt: (ctx) => `Você é Queila, Estrategista-Chefe da Calu Agência. Com base no briefing deste potencial cliente, escreva em 2-3 parágrafos sua análise estratégica focada em: posicionamento, diferencial competitivo e os 2-3 pilares de crescimento mais relevantes para este negócio. Seja específica e use dados do briefing. NÃO mencione preços, valores ou investimento.

BRIEFING DO CLIENTE:
${ctx}`,
  },
  {
    id: "beatriz",
    name: "Beatriz",
    role: "Copywriter",
    color: "#A78BFA",
    initial: "B",
    prompt: (ctx) => `Você é Beatriz, Copywriter Sênior da Calu Agência. Com base neste briefing, escreva em 2 parágrafos: qual abordagem de comunicação e tom de voz é ideal para este cliente, e sugira 2 exemplos de ganchos de conteúdo que funcionariam bem para o perfil dele. Seja criativa e específica. NÃO mencione preços.

BRIEFING DO CLIENTE:
${ctx}`,
  },
  {
    id: "marina",
    name: "Marina",
    role: "Gestora de Redes",
    color: "#60A5FA",
    initial: "M",
    prompt: (ctx) => `Você é Marina, Gestora de Redes Sociais da Calu Agência. Com base no briefing, sugira em 2-3 parágrafos: quais plataformas priorizar, qual frequência de postagem, que tipos de conteúdo performariam melhor e qual seria a estratégia de crescimento orgânico para este cliente. NÃO mencione preços.

BRIEFING DO CLIENTE:
${ctx}`,
  },
  {
    id: "rafaela",
    name: "Rafaela",
    role: "Tráfego Pago",
    color: "#F97316",
    initial: "R",
    prompt: (ctx) => `Você é Rafaela, Especialista em Tráfego Pago da Calu Agência. Com base no briefing, explique em 2 parágrafos: qual estratégia de tráfego pago faria mais sentido para este negócio (plataformas, tipo de campanha, público-alvo principal) e quais resultados realistas esperar. NÃO mencione valores ou orçamentos.

BRIEFING DO CLIENTE:
${ctx}`,
  },
  {
    id: "laura",
    name: "Laura",
    role: "Diretora — Síntese",
    color: LIME,
    initial: "La",
    prompt: (ctx) => `Você é Laura, Diretora Estratégica da Calu Agência. Produza a PROPOSTA ESTRATÉGICA COMPLETA para este potencial cliente com base no briefing e nas análises do time.

Use esta estrutura exata em markdown:

# Proposta Estratégica
## Diagnóstico Executivo
[2-3 pontos críticos da situação atual do cliente baseados no briefing]

## Oportunidades Identificadas
[3 oportunidades concretas e específicas para o negócio deste cliente]

## Estratégia Recomendada
[Abordagem geral: posicionamento, canais, tipo de conteúdo, tráfego — específica para este cliente]

## Plano de Ação — Primeiros 90 Dias
**Mês 1 — Fundação**
[3-4 ações específicas]

**Mês 2 — Aceleração**
[3-4 ações específicas]

**Mês 3 — Escala**
[3-4 ações específicas]

## Resultados Esperados
[3-5 métricas e metas realistas para os primeiros 90 dias]

## Por que a Calu Agência?
[2 parágrafos conectando os serviços da Calu especificamente aos desafios e objetivos que o cliente mencionou]

REGRAS ABSOLUTAS:
- NÃO mencione preços, valores, investimento, custos ou orçamento em nenhum momento
- Seja específica — use dados reais do briefing
- Tom profissional, confiante e orientado a resultado
- Português brasileiro impecável

BRIEFING COMPLETO:
${ctx}`,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = "intro" | "chat" | "agents" | "proposal";

type LiaMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: string;
};

type AgentMsg = {
  id: string;
  agentId: string;
  content: string;
  ts: string;
  typing: boolean;
};

// ── Markdown renderer (minimal) ───────────────────────────────────────────────
function Md({ text, color = "rgba(255,255,255,0.78)" }: { text: string; color?: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return (
          <h1 key={i} className="text-xl font-black mt-5 mb-2" style={{ color: "#fff", letterSpacing: "-0.03em" }}>
            {line.slice(2)}
          </h1>
        );
        if (line.startsWith("## ")) return (
          <h2 key={i} className="text-base font-bold mt-4 mb-1.5" style={{ color: LIME }}>
            {line.slice(3)}
          </h2>
        );
        if (line.startsWith("### ") || (line.startsWith("**") && line.endsWith("**"))) return (
          <p key={i} className="text-sm font-semibold mt-2 mb-0.5" style={{ color: "rgba(255,255,255,0.9)" }}>
            {line.replace(/^###?\s*/, "").replace(/^\*\*|\*\*$/g, "")}
          </p>
        );
        if (line.startsWith("- ") || line.startsWith("• ")) return (
          <div key={i} className="flex gap-2 text-sm py-0.5" style={{ color }}>
            <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: LIME }} />
            <span>{line.slice(2)}</span>
          </div>
        );
        if (line.startsWith("---")) return <hr key={i} className="my-3" style={{ borderColor: "rgba(255,255,255,0.07)" }} />;
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} className="text-sm leading-relaxed" style={{ color }}>{line}</p>;
      })}
    </div>
  );
}

// ── PDF generation ────────────────────────────────────────────────────────────
function generatePDF(clientName: string, proposal: string) {
  const date = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Proposta Estratégica — ${clientName} — Calu Agência</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a1a; font-size: 13px; line-height: 1.6; }
  .page { max-width: 760px; margin: 0 auto; padding: 48px 56px; }
  .cover { text-align: center; padding: 80px 0 60px; border-bottom: 3px solid #B9FF4B; margin-bottom: 48px; }
  .logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 40px; }
  .logo-icon { width: 36px; height: 36px; background: #B9FF4B; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #07080A; }
  .logo-name { font-size: 18px; font-weight: 800; color: #07080A; letter-spacing: -0.03em; }
  .cover h1 { font-size: 28px; font-weight: 900; color: #07080A; letter-spacing: -0.04em; margin-bottom: 12px; }
  .cover .client { font-size: 16px; color: #555; margin-bottom: 8px; }
  .cover .date { font-size: 12px; color: #999; }
  .badge { display: inline-block; background: #B9FF4B; color: #07080A; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
  h1.section { font-size: 20px; font-weight: 900; color: #07080A; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #B9FF4B; }
  h2.section { font-size: 15px; font-weight: 700; color: #07080A; margin: 24px 0 8px; }
  h3.section { font-size: 13px; font-weight: 600; color: #333; margin: 16px 0 6px; }
  p { margin-bottom: 8px; color: #333; }
  ul { padding-left: 20px; margin-bottom: 8px; }
  li { margin-bottom: 4px; }
  li::marker { color: #B9FF4B; }
  .footer { margin-top: 56px; padding-top: 24px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 11px; color: #999; }
  .footer-right { font-size: 11px; color: #B9FF4B; font-weight: 700; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .cover { page-break-after: always; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div class="logo">
      <div class="logo-icon">⚡</div>
      <div class="logo-name">Calu Agência</div>
    </div>
    <div class="badge">Proposta Estratégica</div>
    <h1>Plano de Marketing Digital</h1>
    <div class="client">Preparado para: <strong>${clientName}</strong></div>
    <div class="date">${date}</div>
  </div>

  ${proposal
    .replace(/^# (.+)$/gm, '<h1 class="section">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="section">$1</h2>')
    .replace(/^\*\*(.+)\*\*$/gm, '<h3 class="section">$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/^(?!<[h|u|l|d])(.+)$/gm, (m) => m.trim() ? `<p>${m}</p>` : '')
    .replace(/---/g, '<hr/>')
  }

  <div class="footer">
    <div class="footer-left">Proposta gerada pela Calu Agência · caluagencia.com.br</div>
    <div class="footer-right">Confidencial</div>
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BriefingPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [liaMsgs, setLiaMsgs] = useState<LiaMsg[]>([]);
  const [input, setInput] = useState("");
  const [liaLoading, setLiaLoading] = useState(false);
  const [agentMsgs, setAgentMsgs] = useState<AgentMsg[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [proposal, setProposal] = useState("");
  const [clientName, setClientName] = useState("Cliente");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const agentEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [liaMsgs, liaLoading]);
  useEffect(() => { agentEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [agentMsgs]);

  // ── Lia call ────────────────────────────────────────────────────────────────
  const callLia = async (history: LiaMsg[]) => {
    const { data, error } = await supabase.functions.invoke("chat-ai", {
      body: {
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        systemPrompt: LIA_PROMPT,
        maxTokens: 600,
      },
    });
    if (error) throw error;
    return (data.content as string) ?? "";
  };

  const startChat = async () => {
    setPhase("chat");
    setLiaLoading(true);
    const trigger: LiaMsg = { id: "t", role: "user", content: "iniciar", ts: now() };
    try {
      const reply = await callLia([trigger]);
      const clean = reply.replace("[[BRIEFING_COMPLETO]]", "").trim();
      setLiaMsgs([{ id: "a0", role: "assistant", content: clean, ts: now() }]);
    } catch {
      setLiaMsgs([{ id: "a0", role: "assistant", content: "Olá! Sou a Lia, consultora da Calu Agência. 😊 Para começar: qual é o seu nome completo?", ts: now() }]);
    } finally {
      setLiaLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || liaLoading) return;
    setInput("");
    const ts = now();
    const userMsg: LiaMsg = { id: `u-${Date.now()}`, role: "user", content: text, ts };
    const newHistory = [...liaMsgs, userMsg];
    setLiaMsgs(newHistory);
    setLiaLoading(true);
    try {
      const reply = await callLia(newHistory);
      const hasTrigger = reply.includes("[[BRIEFING_COMPLETO]]");
      const clean = reply.replace("[[BRIEFING_COMPLETO]]", "").trim();
      const replyMsg: LiaMsg = { id: `a-${Date.now()}`, role: "assistant", content: clean, ts: now() };
      setLiaMsgs((prev) => [...prev, replyMsg]);

      if (hasTrigger) {
        // Extract client name from conversation
        const firstUserMsg = newHistory.find((m) => m.role === "user")?.content ?? "";
        setClientName(firstUserMsg.split(" ")[0] || "Cliente");

        // Build briefing context
        const briefingCtx = newHistory
          .concat(replyMsg)
          .filter((m) => m.role !== "user" || m.id !== "t")
          .map((m) => `${m.role === "user" ? "Cliente" : "Lia"}: ${m.content}`)
          .join("\n");

        setTimeout(() => runAgents(briefingCtx), 1200);
      }
    } catch {
      setLiaMsgs((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: "Desculpe, tive um problema. Pode repetir?", ts: now() }]);
    } finally {
      setLiaLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // ── Agent room ──────────────────────────────────────────────────────────────
  const runAgents = async (briefingCtx: string) => {
    setPhase("agents");

    for (const agent of PROPOSAL_AGENTS) {
      setCurrentAgent(agent.id);

      // Typing indicator
      const typingId = `${agent.id}-typing`;
      setAgentMsgs((prev) => [...prev, { id: typingId, agentId: agent.id, content: "", ts: now(), typing: true }]);

      try {
        const { data } = await supabase.functions.invoke("chat-ai", {
          body: {
            messages: [{ role: "user", content: agent.prompt(briefingCtx) }],
            maxTokens: agent.id === "laura" ? 3000 : 600,
          },
        });
        const content = (data?.content ?? "").trim();

        // Replace typing with actual message
        setAgentMsgs((prev) =>
          prev.map((m) => m.id === typingId ? { ...m, content, typing: false } : m)
        );

        if (agent.id === "laura") {
          setProposal(content);
        }
      } catch {
        setAgentMsgs((prev) =>
          prev.map((m) => m.id === typingId ? { ...m, content: "Análise em andamento...", typing: false } : m)
        );
      }
    }

    setCurrentAgent(null);
    setTimeout(() => setPhase("proposal"), 1500);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, color: "white" }}>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(185,255,75,0.055) 0%, transparent 65%)" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-center px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: LIME, boxShadow: `0 0 16px rgba(185,255,75,0.4)` }}>
            <Zap className="w-3.5 h-3.5" style={{ color: BG }} />
          </div>
          <span className="text-sm font-bold" style={{ letterSpacing: "-0.02em" }}>Calu Agência</span>
        </div>
      </header>

      {/* ── INTRO ── */}
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center text-center py-16 px-6">

            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black"
                style={{
                  background: "linear-gradient(135deg, rgba(185,255,75,0.14) 0%, rgba(185,255,75,0.04) 100%)",
                  border: "1.5px solid rgba(185,255,75,0.35)",
                  boxShadow: "0 0 48px -8px rgba(185,255,75,0.25)",
                  color: LIME,
                }}>L</div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#34D399", border: "2px solid #07080A" }}>
                <span className="text-[8px] font-bold text-white">IA</span>
              </div>
            </div>

            <p className="text-[11px] font-semibold tracking-widest uppercase mb-3"
              style={{ color: "rgba(185,255,75,0.55)" }}>
              Calu Agência · Proposta Personalizada
            </p>
            <h1 className="text-4xl font-black mb-3" style={{ letterSpacing: "-0.04em" }}>
              Olá! Sou a{" "}
              <span style={{ background: `linear-gradient(135deg, ${LIME}, #8FD600)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Lia
              </span>
            </h1>
            <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Consultora de Marketing · Calu Agência</p>
            <p className="text-sm max-w-md leading-relaxed mb-12" style={{ color: "rgba(255,255,255,0.32)" }}>
              Vou coletar as informações do seu negócio em poucos minutos. Depois, nosso time de especialistas prepara uma <strong style={{ color: "rgba(255,255,255,0.55)" }}>proposta estratégica completa</strong> para você — gratuita e sem compromisso.
            </p>

            <div className="flex items-start gap-8 mb-12">
              {[
                { n: "1", label: "Briefing com a Lia", sub: "~5 min" },
                { n: "2", label: "Time em ação", sub: "ao vivo" },
                { n: "3", label: "Proposta em PDF", sub: "para baixar" },
              ].map(({ n, label, sub }) => (
                <div key={n} className="text-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2.5"
                    style={{ background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.25)", color: LIME }}>
                    {n}
                  </div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.72)" }}>{label}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>{sub}</p>
                </div>
              ))}
            </div>

            <button onClick={startChat}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ background: LIME, color: BG, boxShadow: "0 0 40px -6px rgba(185,255,75,0.5)" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "")}>
              <Sparkles className="w-4 h-4" />
              Iniciar diagnóstico gratuito
            </button>
            <p className="text-[11px] mt-4" style={{ color: "rgba(255,255,255,0.18)" }}>Sem compromisso · 100% gratuito</p>
          </motion.div>
        )}

        {/* ── CHAT COM LIA ── */}
        {phase === "chat" && (
          <motion.div key="chat"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pb-4">

            <div className="flex items-center gap-3 py-5 px-1">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.25)", color: LIME }}>
                L
              </div>
              <div>
                <p className="text-sm font-semibold">Lia</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
                  <span className="text-[11px]" style={{ color: "rgba(52,211,153,0.8)" }}>Consultora · online</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1" style={{ minHeight: 0 }}>
              <AnimatePresence initial={false}>
                {liaMsgs.map((msg) => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2.5 mt-0.5"
                        style={{ background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.2)", color: LIME }}>L</div>
                    )}
                    <div className="max-w-[82%] rounded-2xl px-4 py-3"
                      style={msg.role === "user"
                        ? { background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.2)", borderBottomRightRadius: 6 }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderBottomLeftRadius: 6 }}>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{msg.content}</p>
                      <p className="text-[10px] mt-1.5 text-right" style={{ color: "rgba(255,255,255,0.2)" }}>{msg.ts}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {liaLoading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.2)", color: LIME }}>L</div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "rgba(185,255,75,0.6)" }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-end gap-2">
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder="Digite sua resposta..." rows={1} disabled={liaLoading}
                  className="flex-1 rounded-xl px-4 py-3 text-sm resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none", minHeight: 44, maxHeight: 120 }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(185,255,75,0.35)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                <button onClick={sendMessage} disabled={!input.trim() || liaLoading}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
                  style={{ background: input.trim() ? LIME : "rgba(255,255,255,0.06)", boxShadow: input.trim() ? "0 0 20px -4px rgba(185,255,75,0.5)" : "none" }}>
                  <Send className="w-4 h-4" style={{ color: input.trim() ? BG : "rgba(255,255,255,0.3)" }} />
                </button>
              </div>
              <p className="text-[10px] text-center mt-2" style={{ color: "rgba(255,255,255,0.15)" }}>Enter para enviar · Shift+Enter para nova linha</p>
            </div>
          </motion.div>
        )}

        {/* ── SALA DE AGENTES ── */}
        {phase === "agents" && (
          <motion.div key="agents"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pb-4">

            {/* Header da sala */}
            <div className="py-6 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                {PROPOSAL_AGENTS.map((a) => (
                  <motion.div key={a.id}
                    animate={{ scale: currentAgent === a.id ? 1.15 : 1, opacity: currentAgent === a.id ? 1 : 0.45 }}
                    transition={{ duration: 0.3 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: `${a.color}20`, border: `1.5px solid ${a.color}${currentAgent === a.id ? "80" : "30"}`, color: a.color }}>
                    {a.initial}
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Users className="w-3.5 h-3.5" style={{ color: LIME }} />
                <p className="text-sm font-bold" style={{ color: LIME }}>Sala de Proposta — ao vivo</p>
                {currentAgent && (
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4 }}
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "rgba(185,255,75,0.12)", color: LIME, border: "1px solid rgba(185,255,75,0.25)" }}>
                    ● digitando
                  </motion.span>
                )}
                {!currentAgent && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}>
                    ✓ concluído
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                {currentAgent
                  ? `${PROPOSAL_AGENTS.find(a => a.id === currentAgent)?.name} está analisando seu briefing...`
                  : "Time finalizou. Preparando proposta..."}
              </p>
            </div>

            {/* Mensagens dos agentes */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-4" style={{ minHeight: 0 }}>
              <AnimatePresence initial={false}>
                {agentMsgs.map((msg) => {
                  const agent = PROPOSAL_AGENTS.find((a) => a.id === msg.agentId)!;
                  return (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                      className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                        style={{ background: `${agent.color}18`, border: `1.5px solid ${agent.color}40`, color: agent.color }}>
                        {agent.initial}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[12px] font-bold" style={{ color: agent.color }}>{agent.name}</span>
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{agent.role}</span>
                          {!msg.typing && <span className="text-[10px] ml-auto" style={{ color: "rgba(255,255,255,0.18)" }}>{msg.ts}</span>}
                        </div>
                        <div className="rounded-2xl rounded-tl-md px-4 py-3"
                          style={{ background: `${agent.color}07`, border: `1px solid ${agent.color}18` }}>
                          {msg.typing ? (
                            <div className="flex items-center gap-1 py-0.5">
                              {[0, 1, 2].map((i) => (
                                <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: agent.color }}
                                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                                  transition={{ delay: i * 0.18, repeat: Infinity, duration: 1 }} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
                              {msg.content.split("\n")[0].slice(0, 220)}
                              {msg.content.length > 220 ? "…" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={agentEndRef} />
            </div>
          </motion.div>
        )}

        {/* ── PROPOSTA FINAL ── */}
        {phase === "proposal" && (
          <motion.div key="proposal"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">

            {/* Hero da proposta */}
            <div className="rounded-3xl p-8 text-center"
              style={{ background: "linear-gradient(135deg, rgba(185,255,75,0.08) 0%, rgba(185,255,75,0.03) 100%)", border: "1.5px solid rgba(185,255,75,0.25)" }}>
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: "rgba(185,255,75,0.6)" }}>
                Proposta Pronta
              </p>
              <h2 className="text-2xl font-black mb-2" style={{ letterSpacing: "-0.03em" }}>
                Plano Estratégico — {clientName}
              </h2>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                Preparado pelo time da Calu Agência com base no seu briefing
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => generatePDF(clientName, proposal)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ background: LIME, color: BG, boxShadow: "0 0 28px -4px rgba(185,255,75,0.4)" }}>
                  <Download className="w-4 h-4" /> Baixar Proposta em PDF
                </button>
                <a href="https://wa.me/5511999999999?text=Olá! Acabei de receber a proposta da Calu Agência e gostaria de conversar."
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)" }}>
                  <ArrowRight className="w-4 h-4" /> Falar com a Caroline
                </a>
              </div>
            </div>

            {/* Conteúdo da proposta */}
            <div className="rounded-2xl p-6 space-y-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Md text={proposal} />
            </div>

            {/* Mensagens dos agentes (resumo) */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Análises do time
                </p>
              </div>
              <div className="p-4 space-y-4">
                {agentMsgs.filter((m) => !m.typing && m.agentId !== "laura").map((msg) => {
                  const agent = PROPOSAL_AGENTS.find((a) => a.id === msg.agentId)!;
                  return (
                    <div key={msg.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                        style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30`, color: agent.color }}>
                        {agent.initial}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold mb-1" style={{ color: agent.color }}>{agent.name} · {agent.role}</p>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                          {msg.content.slice(0, 320)}{msg.content.length > 320 ? "…" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              Proposta gerada pela Calu Agência · caluagencia.com.br
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
