import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const LIME = "#B9FF4B";
const ARIA_BASE = "https://proldgiyterqhthludlp.supabase.co/functions/v1";
const ARIA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2xkZ2l5dGVycWh0aGx1ZGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzQ4NjEsImV4cCI6MjA5Mjg1MDg2MX0.v8xcDbEbbyxv671SYhsWYHs9bbp9J-Q937SknjUiBIE";

const SYSTEM_PROMPT = `Você é Lia, consultora sênior de marketing digital da Calu Agência. Sua missão é conduzir um diagnóstico gratuito de marketing para potenciais clientes, coletando informações estratégicas e entregando uma análise personalizada ao final.

Siga este roteiro em fases, sempre fazendo uma pergunta por vez:

━━ FASE 1 — CONTATO ━━
Colete os três dados abaixo, um por vez, de forma natural:
1. Nome completo
2. E-mail
3. Telefone/WhatsApp

Só avance para a Fase 2 depois de ter os três dados. Confirme o nome após receber: "Ótimo, [nome]! Agora vou fazer algumas perguntas sobre seu negócio."

━━ FASE 2 — BRIEFING ESTRATÉGICO ━━
Faça estas perguntas em ordem, uma por vez:
1. "Qual é o segmento do seu negócio?" (ex: varejo, serviços, saúde, educação...)
2. "Me conta mais sobre o seu produto ou serviço principal."
3. "Você já tem presença nas redes sociais? Quais plataformas e quantos seguidores aproximadamente?"
4. "Qual é o seu maior desafio de marketing hoje? O que mais te frustra?"
5. "Qual é o seu objetivo principal: mais visibilidade, mais leads ou mais vendas diretas?"
6. "Você já investe em anúncios pagos (Meta Ads, Google Ads)? Se sim, qual é o orçamento mensal aproximado?"
7. "Você tem site? Está satisfeito com ele?"

Após a última resposta, diga: "Perfeito, [nome]! Com base em tudo que você me contou, vou preparar agora o seu diagnóstico personalizado."

━━ FASE 3 — DIAGNÓSTICO COMPLETO ━━
Entregue um diagnóstico profissional e personalizado com esta estrutura em markdown:

## 📊 Diagnóstico de Marketing — [Nome do Negócio]

### Análise do Cenário Atual
[Análise honesta e específica da situação atual com base nas respostas]

### 🎯 3 Oportunidades Identificadas
**1. [Nome da oportunidade]**
[Descrição e por que é relevante para este negócio]

**2. [Nome da oportunidade]**
[Descrição e por que é relevante para este negócio]

**3. [Nome da oportunidade]**
[Descrição e por que é relevante para este negócio]

### ⚡ Recomendações Imediatas
- [Ação 1 — específica e executável]
- [Ação 2 — específica e executável]
- [Ação 3 — específica e executável]

### 🚀 Próximos Passos com a Calu Agência
[Explique como a Calu pode ajudar este cliente especificamente, conectando os serviços da agência aos desafios que ele mencionou]

---
*Diagnóstico preparado por Lia · Consultora de Marketing · Calu Agência*

Após entregar o diagnóstico, finalize com: "Gostaria de conversar com nossa equipe para dar início à sua estratégia? É só me dizer — posso conectar você com a Caroline agora mesmo! 🚀"

━━ REGRAS ━━
- Sempre em português brasileiro, profissional e acolhedor
- Use o nome do usuário nas respostas
- Faça uma pergunta por vez — nunca acumule perguntas
- Seja específica nas análises — evite respostas genéricas
- Ao iniciar (quando receber "iniciar"), diga apenas: "Olá! Sou a Lia, consultora de marketing da Calu Agência. 😊 Vou te ajudar a identificar oportunidades reais de crescimento para o seu negócio — é gratuito e leva cerca de 5 minutos. Para começar: qual é o seu nome completo?"`;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("## ")) return (
      <h2 key={i} className="text-base font-bold mt-4 mb-2" style={{ color: "#F0F0F0" }}>
        {line.slice(3)}
      </h2>
    );
    if (line.startsWith("### ")) return (
      <h3 key={i} className="text-sm font-semibold mt-3 mb-1" style={{ color: LIME }}>
        {line.slice(4)}
      </h3>
    );
    if (line.startsWith("**") && line.endsWith("**")) return (
      <p key={i} className="text-sm font-semibold mt-2" style={{ color: "rgba(255,255,255,0.9)" }}>
        {line.slice(2, -2)}
      </p>
    );
    if (line.startsWith("- ")) return (
      <div key={i} className="flex items-start gap-2 text-sm py-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
        <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: LIME }} />
        <span>{renderInlineBold(line.slice(2))}</span>
      </div>
    );
    if (line.startsWith("---")) return (
      <hr key={i} className="my-3" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
    );
    if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) return (
      <p key={i} className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
        {line.slice(1, -1)}
      </p>
    );
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return (
      <p key={i} className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
        {renderInlineBold(line)}
      </p>
    );
  });
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "rgba(255,255,255,0.92)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function BriefingPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const callAI = async (history: Message[]) => {
    const res = await fetch(`${ARIA_BASE}/chat-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ARIA_ANON}`,
      },
      body: JSON.stringify({
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        systemPrompt: SYSTEM_PROMPT,
        maxTokens: 2048,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.content as string;
  };

  const startChat = async () => {
    setStarted(true);
    setLoading(true);
    const ts = now();
    const trigger: Message = { id: "trigger", role: "user", content: "iniciar", timestamp: ts };
    try {
      const reply = await callAI([trigger]);
      setMessages([{ id: `a-${Date.now()}`, role: "assistant", content: reply, timestamp: ts }]);
    } catch {
      setMessages([{
        id: "a-0",
        role: "assistant",
        content: "Olá! Sou a Lia, consultora de marketing da Calu Agência. 😊 Vou te ajudar a identificar oportunidades reais de crescimento para o seu negócio. Para começar: qual é o seu nome completo?",
        timestamp: ts,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const ts = now();
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: ts };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const reply = await callAI(newHistory);
      const replyTs = now();
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: reply, timestamp: replyTs }]);
    } catch (e) {
      setMessages((prev) => [...prev, {
        id: `e-${Date.now()}`, role: "assistant",
        content: "Desculpe, tive um problema técnico. Pode repetir sua resposta?",
        timestamp: now(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#07080A", color: "white" }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(185,255,75,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(185,255,75,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate("/landing")}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: LIME, boxShadow: "0 0 12px rgba(185,255,75,0.4)" }}>
            <Zap className="w-3 h-3" style={{ color: "#07080A" }} />
          </div>
          <span className="text-sm font-semibold" style={{ letterSpacing: "-0.02em" }}>Calu Agência</span>
        </div>

        <div className="w-20" />
      </header>

      {/* Body */}
      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pb-4">

        {!started ? (
          /* ── Intro screen ── */
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex-1 flex flex-col items-center justify-center text-center py-16"
          >
            {/* Lia avatar */}
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(185,255,75,0.15) 0%, rgba(185,255,75,0.05) 100%)",
                  border: "1px solid rgba(185,255,75,0.3)",
                  boxShadow: "0 0 40px -8px rgba(185,255,75,0.3)",
                  color: LIME,
                }}>
                L
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "#34D399", border: "2px solid #07080A" }}>
                <span className="text-[8px] font-bold text-white">IA</span>
              </div>
            </div>

            <div className="text-[11px] font-medium tracking-widest uppercase mb-3"
              style={{ color: "rgba(185,255,75,0.6)" }}>
              Calu Agência · Diagnóstico Gratuito
            </div>
            <h1 className="text-3xl font-bold mb-3" style={{ letterSpacing: "-0.03em" }}>
              Olá, sou a{" "}
              <span style={{
                background: `linear-gradient(135deg, ${LIME} 0%, #8FD600 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Lia</span>
            </h1>
            <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              Consultora de Marketing Digital · Calu Agência
            </p>
            <p className="text-sm max-w-md leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.35)" }}>
              Vou analisar o cenário do seu negócio, identificar oportunidades de crescimento
              e entregar um <strong style={{ color: "rgba(255,255,255,0.55)" }}>diagnóstico de marketing personalizado</strong> — completamente gratuito.
            </p>

            {/* What to expect */}
            <div className="flex items-center gap-6 mb-10">
              {[
                { label: "Coleta de dados", desc: "Nome, e-mail e telefone" },
                { label: "Briefing estratégico", desc: "7 perguntas-chave" },
                { label: "Diagnóstico completo", desc: "Análise + recomendações" },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2"
                    style={{ background: "rgba(185,255,75,0.12)", border: "1px solid rgba(185,255,75,0.25)", color: LIME }}>
                    {i + 1}
                  </div>
                  <div className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{step.label}</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{step.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={startChat}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: LIME,
                color: "#07080A",
                boxShadow: "0 0 32px -4px rgba(185,255,75,0.5)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
              <Sparkles className="w-4 h-4" />
              Iniciar diagnóstico gratuito
            </button>
            <p className="text-[11px] mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
              ~5 minutos · Sem compromisso · 100% gratuito
            </p>
          </motion.div>
        ) : (
          /* ── Chat screen ── */
          <div className="flex-1 flex flex-col pt-6">

            {/* Lia header bar */}
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "rgba(185,255,75,0.12)", border: "1px solid rgba(185,255,75,0.25)", color: LIME }}>
                L
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>Lia</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
                  <span className="text-[11px]" style={{ color: "rgba(52,211,153,0.8)" }}>
                    Consultora de Marketing · online
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1" style={{ minHeight: 0 }}>
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2.5 mt-0.5"
                        style={{ background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.2)", color: LIME }}>
                        L
                      </div>
                    )}
                    <div
                      className="max-w-[82%] rounded-2xl px-4 py-3"
                      style={msg.role === "user" ? {
                        background: "rgba(185,255,75,0.12)",
                        border: "1px solid rgba(185,255,75,0.22)",
                        borderBottomRightRadius: 6,
                      } : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderBottomLeftRadius: 6,
                      }}
                    >
                      {msg.role === "user" ? (
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                          {msg.content}
                        </p>
                      ) : (
                        <div className="space-y-0.5">
                          {renderMarkdown(msg.content)}
                        </div>
                      )}
                      <div className="text-[10px] mt-2 text-right" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start items-end gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.2)", color: LIME }}>
                    L
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "rgba(185,255,75,0.6)" }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Digite sua resposta..."
                  rows={1}
                  disabled={loading}
                  className="flex-1 rounded-xl px-4 py-3 text-sm resize-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F0F0F0",
                    outline: "none",
                    minHeight: 44,
                    maxHeight: 120,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(185,255,75,0.35)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
                  style={{
                    background: input.trim() ? LIME : "rgba(255,255,255,0.06)",
                    boxShadow: input.trim() ? "0 0 20px -4px rgba(185,255,75,0.5)" : "none",
                  }}>
                  <Send className="w-4 h-4" style={{ color: input.trim() ? "#07080A" : "rgba(255,255,255,0.3)" }} />
                </button>
              </div>
              <p className="text-[10px] text-center mt-2" style={{ color: "rgba(255,255,255,0.15)" }}>
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
