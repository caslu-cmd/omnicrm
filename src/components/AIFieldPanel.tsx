import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Check, RefreshCw } from "lucide-react";
import { useAIField } from "@/contexts/AIFieldContext";
import { supabase } from "@/integrations/supabase/client";

// ── Agentes disponíveis ────────────────────────────────────────
const AGENTS = [
  {
    id: "beatriz",
    name: "Beatriz",
    role: "Redatora & Copy",
    avatar: "✍️",
    color: "#E879F9",
    bg: "rgba(232,121,249,0.09)",
    border: "rgba(232,121,249,0.25)",
    keywords: ["mensagem", "conteúdo", "e-mail", "email", "assunto", "copy", "texto", "whatsapp", "legenda"],
    prompt: (label: string, ctx: string, val: string) =>
      `Você é Beatriz, redatora sênior da Calu Agência. Especialista em copywriting persuasivo, textos que convertem e linguagem de marca. Escreva para o campo "${label}"${ctx ? ` (contexto: ${ctx})` : ""}${val ? `. Valor atual: "${val}"` : ""}.\n\nRetorne APENAS o texto final, sem prefixos, sem explicações. Português brasileiro, profissional e direto ao ponto.`,
  },
  {
    id: "marina",
    name: "Marina",
    role: "Social Media",
    avatar: "📱",
    color: "#38BDF8",
    bg: "rgba(56,189,248,0.09)",
    border: "rgba(56,189,248,0.25)",
    keywords: ["social", "instagram", "facebook", "post", "redes", "legenda", "caption", "agendamento"],
    prompt: (label: string, ctx: string, val: string) =>
      `Você é Marina, especialista em redes sociais da Calu Agência. Cria conteúdo autêntico, engajante e adequado a cada plataforma. Escreva para o campo "${label}"${ctx ? ` (contexto: ${ctx})` : ""}${val ? `. Valor atual: "${val}"` : ""}.\n\nRetorne APENAS o texto final. Português brasileiro, tom jovem e próximo do público.`,
  },
  {
    id: "rafaela",
    name: "Rafaela",
    role: "Tráfego Pago",
    avatar: "📊",
    color: "#FB923C",
    bg: "rgba(251,146,60,0.09)",
    border: "rgba(251,146,60,0.25)",
    keywords: ["campanha", "anúncio", "ads", "meta", "google", "tráfego", "paid", "headline", "conversão"],
    prompt: (label: string, ctx: string, val: string) =>
      `Você é Rafaela, especialista em tráfego pago da Calu Agência. Domina Meta Ads, Google Ads e copy de alta conversão. Escreva para o campo "${label}"${ctx ? ` (contexto: ${ctx})` : ""}${val ? `. Valor atual: "${val}"` : ""}.\n\nRetorne APENAS o texto final. Foco em conversão, números e benefícios claros.`,
  },
  {
    id: "queila",
    name: "Queila",
    role: "Estrategista",
    avatar: "🎯",
    color: "#B9FF4B",
    bg: "rgba(185,255,75,0.08)",
    border: "rgba(185,255,75,0.25)",
    keywords: ["nome", "título", "deal", "pipeline", "estratégia", "posicionamento", "negócio", "etapa", "empresa"],
    prompt: (label: string, ctx: string, val: string) =>
      `Você é Queila, estrategista de marketing da Calu Agência. Pensa no posicionamento, no negócio como um todo e na jornada do cliente. Escreva para o campo "${label}"${ctx ? ` (contexto: ${ctx})` : ""}${val ? `. Valor atual: "${val}"` : ""}.\n\nRetorne APENAS o texto final. Pensamento estratégico, claro e orientado a resultado.`,
  },
  {
    id: "laura",
    name: "Laura",
    role: "Diretora de Contas",
    avatar: "👔",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.09)",
    border: "rgba(167,139,250,0.25)",
    keywords: ["briefing", "relatório", "proposta", "apresentação", "executivo", "cliente", "diagnóstico", "fonte"],
    prompt: (label: string, ctx: string, val: string) =>
      `Você é Laura, diretora de contas da Calu Agência. Domina comunicação executiva, apresentações e gestão de relacionamento com clientes. Escreva para o campo "${label}"${ctx ? ` (contexto: ${ctx})` : ""}${val ? `. Valor atual: "${val}"` : ""}.\n\nRetorne APENAS o texto final. Tom profissional, estruturado e orientado ao cliente.`,
  },
];

// ── Detecta o melhor agente para o campo ──────────────────────
function detectBestAgent(fieldLabel: string, fieldContext: string): string {
  const text = `${fieldLabel} ${fieldContext}`.toLowerCase();
  let best = "beatriz";
  let bestScore = -1;

  for (const agent of AGENTS) {
    const score = agent.keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      best = agent.id;
    }
  }
  return best;
}

// ── Componente principal ───────────────────────────────────────
export default function AIFieldPanel() {
  const { state, close } = useAIField();
  const { isOpen, position, fieldLabel, currentValue, fieldContext, onInsert } = state;

  const [selectedAgentId, setSelectedAgentId] = useState("beatriz");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, close]);

  // Reseta estado ao abrir e detecta melhor agente
  useEffect(() => {
    if (isOpen) {
      setPrompt("");
      setResult("");
      setDone(false);
      setSelectedAgentId(detectBestAgent(fieldLabel, fieldContext));
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, fieldLabel, fieldContext]);

  const selectedAgent = AGENTS.find((a) => a.id === selectedAgentId) ?? AGENTS[0];

  // Posição inteligente: evita sair da tela
  const panelW = 360;
  const panelH = 380;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.min(position.x, vw - panelW - 12);
  const top = position.y + panelH > vh ? position.y - panelH - 8 : position.y;

  const gerar = async (customPrompt?: string) => {
    const instrucaoUsuario = (customPrompt ?? prompt).trim();

    setLoading(true);
    setResult("");
    setDone(false);

    const instrucao = instrucaoUsuario
      ? `O usuário quer: "${instrucaoUsuario}"`
      : `Gere o melhor texto possível para este campo. ${currentValue ? `Melhore o atual: "${currentValue}"` : "O campo está vazio."}`;

    const systemPrompt = selectedAgent.prompt(fieldLabel, fieldContext, currentValue);

    try {
      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt,
          messages: [{ role: "user", content: instrucao }],
        },
      });
      if (error) throw error;
      setResult(data?.content?.trim() ?? "");
      setDone(true);
    } catch {
      setResult("Erro ao conectar com a IA. Tente novamente.");
      setDone(false);
    } finally {
      setLoading(false);
    }
  };

  const inserir = () => {
    onInsert(result);
    close();
  };

  const SUGESTOES = [
    "Seja persuasivo e direto",
    "Tom informal e próximo",
    "Resumir em poucas palavras",
    "Mais criativo e impactante",
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.93, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: -6 }}
          transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            position: "fixed",
            top,
            left,
            width: panelW,
            zIndex: 9999,
            borderRadius: 16,
            overflow: "hidden",
            background: "#0C0D0F",
            border: `1px solid ${selectedAgent.border}`,
            boxShadow: `0 20px 60px -8px rgba(0,0,0,0.85), 0 0 0 1px ${selectedAgent.bg}`,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px 10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: selectedAgent.bg,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: selectedAgent.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13,
              }}>
                {selectedAgent.avatar}
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F0F0F0" }}>{selectedAgent.name}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: 5 }}>
                  {selectedAgent.role}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: 5 }}>— {fieldLabel}</span>
              </div>
            </div>
            <button onClick={close} style={{ color: "#444466", cursor: "pointer", background: "none", border: "none", padding: 2 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Seletor de agentes */}
          <div style={{
            display: "flex", gap: 5, padding: "8px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            overflowX: "auto",
          }}>
            {AGENTS.map((agent) => {
              const active = agent.id === selectedAgentId;
              return (
                <button
                  key={agent.id}
                  onClick={() => { setSelectedAgentId(agent.id); setResult(""); setDone(false); }}
                  title={agent.role}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 9px", borderRadius: 20, fontSize: 11, fontWeight: active ? 600 : 400,
                    background: active ? agent.bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? agent.border : "rgba(255,255,255,0.07)"}`,
                    color: active ? agent.color : "rgba(255,255,255,0.4)",
                    cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap", flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = agent.color; e.currentTarget.style.borderColor = agent.border; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; } }}
                >
                  <span style={{ fontSize: 12 }}>{agent.avatar}</span>
                  {agent.name}
                </button>
              );
            })}
          </div>

          <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Sugestões rápidas */}
            {!result && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => gerar(s)}
                    style={{
                      padding: "3px 9px", borderRadius: 20, fontSize: 10, cursor: "pointer",
                      background: "#141420", border: "1px solid #2A2A3A", color: "#8888AA",
                      transition: "all .15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = selectedAgent.color + "44"; e.currentTarget.style.color = selectedAgent.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A2A3A"; e.currentTarget.style.color = "#8888AA"; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Resultado da IA */}
            {(result || loading) && (
              <div style={{
                background: "#141420", borderRadius: 10, padding: "10px 12px",
                border: "1px solid #2A2A3A", minHeight: 60,
                fontSize: 12, color: "#C0C0D0", lineHeight: 1.6, whiteSpace: "pre-wrap",
              }}>
                {loading
                  ? <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#555577" }}>
                      <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                      <span style={{ color: selectedAgent.color, opacity: 0.7 }}>{selectedAgent.name} está gerando…</span>
                    </div>
                  : result
                }
              </div>
            )}

            {/* Botões de ação quando há resultado */}
            {done && result && (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={inserir}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: selectedAgent.color, color: "#07080A", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  <Check style={{ width: 13, height: 13 }} /> Inserir no campo
                </button>
                <button
                  onClick={() => gerar(prompt || undefined)}
                  style={{
                    padding: "7px 12px", borderRadius: 8, fontSize: 12,
                    background: "#1E1E2E", color: "#8888AA", border: "1px solid #2A2A3A",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <RefreshCw style={{ width: 11, height: 11 }} /> Gerar outro
                </button>
              </div>
            )}

            {/* Input do usuário */}
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gerar(); } }}
                placeholder={`Instrução para ${selectedAgent.name}… (Enter para gerar)`}
                rows={2}
                style={{
                  flex: 1, borderRadius: 8, padding: "8px 10px", fontSize: 12,
                  background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0",
                  outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = selectedAgent.color + "44")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
              />
              <button
                onClick={() => gerar()}
                disabled={loading}
                style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: loading ? "#1E1E2E" : selectedAgent.color,
                  color: loading ? "#444466" : "#07080A",
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {loading
                  ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                  : <Send style={{ width: 13, height: 13 }} />
                }
              </button>
            </div>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
