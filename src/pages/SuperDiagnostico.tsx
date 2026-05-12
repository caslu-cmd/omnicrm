import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Send, Sparkles, CheckCircle2, ArrowRight,
  MessageCircle, TrendingUp, Target, Zap, Star, RefreshCw,
} from "lucide-react";

const GREEN = "#B9FF4B";
const DARK = "#07080A";
const LIA_COLOR = "#38BDF8";
const CAROL_WA = "5585986408404";

// ─── Markdown simples para o diagnóstico ───────────────────────
function mdToBlocks(text: string) {
  return text.split("\n").filter(l => l.trim()).map((raw, i) => {
    const l = raw.trim();
    if (l.startsWith("# "))  return { type: "h1",    content: l.slice(2),  key: i };
    if (l.startsWith("## ")) return { type: "h2",    content: l.slice(3),  key: i };
    if (l.startsWith("### "))return { type: "h3",    content: l.slice(4),  key: i };
    if (/^[-*] /.test(l))    return { type: "bullet",content: l.slice(2),  key: i };
    if (/^\d+\. /.test(l))   return { type: "bullet",content: l.replace(/^\d+\. /,""), key: i };
    return { type: "p", content: l, key: i };
  });
}

// ─── Tela do diagnóstico gerado ────────────────────────────────
function DiagnosisScreen({ diagnosis, nome, empresa }: { diagnosis: string; nome: string; empresa: string }) {
  const blocks = mdToBlocks(diagnosis);
  const waMsg = encodeURIComponent(
    `Olá! Acabei de receber o diagnóstico gratuito da Calu Agência para ${empresa} e quero saber como vocês podem me ajudar a implementar!`
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#07080A 0%,#0D1018 100%)" }}>
      {/* Sticky CTA bar */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between flex-wrap gap-4"
        style={{ background: "rgba(7,8,10,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(185,255,75,0.1)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: GREEN, color: DARK }}>C</div>
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Calu Agência</span>
        </div>
        <a href={`https://wa.me/${CAROL_WA}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: GREEN, color: DARK }}>
          <MessageCircle className="w-3.5 h-3.5" /> Quero contratar
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 text-center space-y-2"
          style={{ background: "rgba(185,255,75,0.06)", border: "1px solid rgba(185,255,75,0.2)" }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5" style={{ color: GREEN }} />
            <span className="text-sm font-semibold" style={{ color: GREEN }}>Diagnóstico pronto, {nome.split(" ")[0]}!</span>
          </div>
          <p className="text-base font-bold" style={{ color: "#F0F0F0" }}>
            A LIA analisou {empresa} e identificou os pontos críticos do seu marketing
          </p>
        </motion.div>

        {/* Diagnosis body */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {blocks.map(b => {
            if (b.type === "h1") return <h1 key={b.key} className="text-xl font-black" style={{ color: "#F0F0F0" }}>{b.content}</h1>;
            if (b.type === "h2") return <h2 key={b.key} className="text-base font-bold pt-3" style={{ color: GREEN }}>{b.content}</h2>;
            if (b.type === "h3") return <h3 key={b.key} className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{b.content}</h3>;
            if (b.type === "bullet") return (
              <div key={b.key} className="flex gap-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                <span style={{ color: GREEN, flexShrink: 0, marginTop: 2 }}>▸</span><span>{b.content}</span>
              </div>
            );
            return <p key={b.key} className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{b.content}</p>;
          })}
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "linear-gradient(135deg,rgba(185,255,75,0.08),rgba(185,255,75,0.03))", border: "1px solid rgba(185,255,75,0.25)" }}>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Star className="w-4 h-4" style={{ color: GREEN }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: GREEN }}>próximo passo</span>
            </div>
            <p className="text-xl font-black" style={{ color: "#F0F0F0" }}>Quer que meu time execute tudo isso por você?</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Este foi apenas o diagnóstico. A Calu Agência tem 11 especialistas em IA prontos para implementar cada estratégia.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Zap, label: "Resultados em 30 dias" },
              { icon: Target, label: "Estratégia personalizada" },
              { icon: TrendingUp, label: "ROI mensurável" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(185,255,75,0.06)" }}>
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: GREEN }} />
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
              </div>
            ))}
          </div>
          <a href={`https://wa.me/${CAROL_WA}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-base font-black transition-all hover:opacity-90 active:scale-95"
            style={{ background: GREEN, color: DARK, boxShadow: `0 0 32px -4px ${GREEN}60` }}>
            <MessageCircle className="w-5 h-5" />
            Falar com a Carol agora no WhatsApp
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            Sem compromisso. Só uma conversa para entender como podemos ajudar.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-3 pb-8">
          {[{ n: "11", label: "Especialistas IA" }, { n: "90d", label: "Primeiros resultados" }, { n: "100%", label: "Personalizado" }].map(({ n, label }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xl font-black" style={{ color: GREEN }}>{n}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sistema de prompt da LIA ───────────────────────────────────
const LIA_SYSTEM = `Você é a LIA, agente de diagnóstico de marketing da Calu Agência. Você está numa landing page conversando com um lead que quer receber um diagnóstico gratuito do seu negócio.

Sua missão: conduzir uma conversa amigável e natural para coletar as informações necessárias e depois gerar um diagnóstico poderoso.

REGRAS:
- Seja calorosa, empolgante e profissional. Português brasileiro.
- Faça UMA pergunta por vez. Nunca bombardeie com várias perguntas.
- Adapte a conversa conforme as respostas. Seja natural, não robótica.
- Valide e comente brevemente cada resposta antes de fazer a próxima pergunta.
- Quando tiver coletado: nome, empresa, segmento, o que vende, cliente ideal, dor principal, diferencial, canais ativos, meta 90 dias e budget — sinalize que vai gerar o diagnóstico.

DADOS A COLETAR (colete de forma natural, não precisa ser nessa ordem):
1. Nome do prospect e empresa
2. Segmento/nicho
3. Produtos/serviços
4. Faturamento aproximado
5. Cliente ideal e dor que resolve
6. Diferencial
7. Canais de marketing ativos
8. Se investe em tráfego pago
9. Meta nos próximos 90 dias
10. Budget disponível para marketing

QUANDO TIVER DADOS SUFICIENTES:
Diga algo como "Perfeito! Já tenho tudo que preciso para montar seu diagnóstico. Vou analisar agora..." e na mesma mensagem inclua exatamente isso ao final (sem espaços extras):
DIAGNOSTICO_PRONTO:{"nome":"...","empresa":"...","segmento":"...","produtos":"...","faturamento":"...","clienteIdeal":"...","dorPrincipal":"...","diferencial":"...","canaisAtivos":"...","trafegoPago":"...","meta90dias":"...","budgetMarketing":"..."}

Comece a conversa se apresentando brevemente e pedindo o nome e empresa do lead.`;

function buildDiagnosisPrompt(d: Record<string, string>): string {
  return `Você é a LIA, especialista em diagnóstico de marketing da Calu Agência.

Gere um DIAGNÓSTICO DE MARKETING poderoso e ultra-personalizado para o lead abaixo. Este é o primeiro contato da Calu Agência com esse prospect — deve impressionar e gerar desejo de contratar.

=== DADOS COLETADOS ===
Nome: ${d.nome}
Empresa: ${d.empresa}
Segmento: ${d.segmento}
Produtos/Serviços: ${d.produtos}
Faturamento: ${d.faturamento}
Cliente ideal: ${d.clienteIdeal}
Dor principal: ${d.dorPrincipal}
Diferencial: ${d.diferencial}
Canais ativos: ${d.canaisAtivos}
Tráfego pago: ${d.trafegoPago}
Meta 90 dias: ${d.meta90dias}
Budget marketing: ${d.budgetMarketing}

=== ESTRUTURA ===

# Diagnóstico de Marketing — ${d.empresa}
*Elaborado pela Calu Agência · ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}*

## 🔍 Diagnóstico Executivo
Os 3 maiores problemas que estão travando o crescimento agora. Seja direto e específico com os dados do briefing.

## 💸 Onde Você Está Perdendo Dinheiro
Pontos concretos de vazamento no funil: captação, conversão, retenção.

## ⚡ Top 3 Alavancas de ROI Imediato
Para cada uma: o que fazer, por que vai funcionar e resultado esperado em 30 dias.

## 🗺️ Roadmap 90 Dias
**Mês 1 — Fundação:** [ações]
**Mês 2 — Crescimento:** [ações]
**Mês 3 — Escala:** [ações]

## 🎯 Potencial de Crescimento
Com base no segmento e budget disponível, qual o crescimento realista em receita/leads nos próximos 90 dias.

## ✅ 5 Próximos Passos Prioritários
Lista numerada com as ações mais urgentes.

Seja profundo, específico, use os dados. Português brasileiro. NÃO seja genérico.`;
}

// ─── Componente principal ───────────────────────────────────────
export default function SuperDiagnostico() {
  const [messages, setMessages] = useState<{ role: "lia" | "user"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [generatingDiag, setGeneratingDiag] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [leadData, setLeadData] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const startChat = async () => {
    setStarted(true);
    setThinking(true);
    const { data, error } = await supabase.functions.invoke("chat-ai", {
      body: {
        systemPrompt: LIA_SYSTEM,
        maxTokens: 400,
        messages: [{ role: "user", content: "Olá!" }],
      },
    });
    setThinking(false);
    const reply = data?.content ?? "Olá! Sou a LIA, agente de diagnóstico da Calu Agência. Como posso te chamar e qual é o nome da sua empresa?";
    historyRef.current = [
      { role: "user", content: "Olá!" },
      { role: "assistant", content: reply },
    ];
    setMessages([{ role: "lia", text: reply }]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || thinking || generatingDiag) return;
    setInput("");

    const userMsg = { role: "user" as const, text };
    setMessages(prev => [...prev, userMsg]);
    historyRef.current.push({ role: "user", content: text });

    setThinking(true);
    const { data } = await supabase.functions.invoke("chat-ai", {
      body: {
        systemPrompt: LIA_SYSTEM,
        maxTokens: 600,
        messages: historyRef.current,
      },
    });
    setThinking(false);

    const reply: string = data?.content ?? "Pode continuar, estou ouvindo!";
    historyRef.current.push({ role: "assistant", content: reply });

    // Detecta se a LIA sinalizou que tem dados suficientes
    const marker = "DIAGNOSTICO_PRONTO:";
    const markerIdx = reply.indexOf(marker);
    if (markerIdx !== -1) {
      const visibleText = reply.slice(0, markerIdx).trim();
      if (visibleText) setMessages(prev => [...prev, { role: "lia", text: visibleText }]);

      try {
        const jsonStr = reply.slice(markerIdx + marker.length).trim();
        const parsed = JSON.parse(jsonStr);
        setLeadData(parsed);

        // Salva lead no CRM
        (supabase.from("contacts") as any).insert({
          name: parsed.nome ?? "",
          phone: parsed.whatsapp ?? "",
          email: null,
          company: parsed.empresa ?? "",
          channel: "Super Diagnóstico",
          status: "Novo",
          notes: `Segmento: ${parsed.segmento} | Meta: ${parsed.meta90dias} | Budget: ${parsed.budgetMarketing}`,
        }).then(() => {});

        // Notifica Carol via WhatsApp
        const waLead = parsed.whatsapp ? `55${parsed.whatsapp.replace(/\D/g,"")}` : "";
        const notificacao = `🔔 *Novo Lead — Super Diagnóstico*\n\n👤 *Nome:* ${parsed.nome}\n🏢 *Empresa:* ${parsed.empresa}\n📱 *WhatsApp:* ${parsed.whatsapp}${waLead ? `\n👉 wa.me/${waLead}` : ""}\n🎯 *Segmento:* ${parsed.segmento}\n📊 *Faturamento:* ${parsed.faturamento}\n💡 *Meta 90 dias:* ${parsed.meta90dias}\n💰 *Budget marketing:* ${parsed.budgetMarketing}\n\n✅ O diagnóstico foi gerado automaticamente. Entre em contato para fechar!`;
        supabase.functions.invoke("aira-meeting", {
          body: { summary: notificacao, groups: [], participants: [] },
        }).then(() => {});

        // Gera diagnóstico
        setGeneratingDiag(true);
        const { data: diagData } = await supabase.functions.invoke("chat-ai", {
          body: {
            systemPrompt: "Você é a LIA, especialista em marketing da Calu Agência. Gere diagnósticos poderosos e específicos. Português brasileiro.",
            maxTokens: 5000,
            enableThinking: true,
            thinkingBudget: 3000,
            messages: [{ role: "user", content: buildDiagnosisPrompt(parsed) }],
          },
        });
        setGeneratingDiag(false);
        setDiagnosis(diagData?.content ?? "");
      } catch {
        setGeneratingDiag(false);
        setMessages(prev => [...prev, { role: "lia", text: "Vou gerar seu diagnóstico agora! Um momento..." }]);
      }
    } else {
      setMessages(prev => [...prev, { role: "lia", text: reply }]);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (diagnosis) {
    return <DiagnosisScreen diagnosis={diagnosis} nome={leadData.nome ?? ""} empresa={leadData.empresa ?? ""} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#07080A 0%,#0B0F18 100%)" }}>

      {/* ── HERO ── */}
      <div className="px-4 pt-8 pb-6 max-w-2xl mx-auto w-full space-y-6">
        {/* Branding */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: GREEN, color: DARK }}>C</div>
          <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>Calu Agência</span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: "rgba(185,255,75,0.1)", color: GREEN, border: "1px solid rgba(185,255,75,0.2)" }}>
            <Sparkles className="w-3 h-3" /> 100% Gratuito · Gerado por IA
          </div>
          <h1 className="text-3xl font-black leading-tight" style={{ color: "#F0F0F0" }}>
            Descubra o que está travando o crescimento do seu negócio
          </h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.45)" }}>
            Converse com a <strong style={{ color: LIA_COLOR }}>LIA</strong>, nossa especialista em diagnóstico, e receba um plano personalizado para escalar sua empresa nos próximos 90 dias.
          </p>
        </div>

        {/* Social proof pills */}
        <div className="flex flex-wrap gap-2">
          {["Diagnóstico em minutos", "Sem cadastro", "Plano de 90 dias", "Estratégia real"].map(t => (
            <span key={t} className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
              ✓ {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── CHAT ── */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pb-6">
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(56,189,248,0.15)", minHeight: 400 }}>

          {/* Chat header */}
          <div className="px-4 py-3 flex items-center gap-3"
            style={{ background: "rgba(56,189,248,0.05)", borderBottom: "1px solid rgba(56,189,248,0.1)" }}>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: `${LIA_COLOR}18`, color: LIA_COLOR, border: `1px solid ${LIA_COLOR}30` }}>L</div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#07080A]"
                style={{ background: started ? "#4ade80" : "rgba(255,255,255,0.2)" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>LIA</p>
              <p className="text-[10px]" style={{ color: LIA_COLOR }}>Agente de Diagnóstico · Calu Agência</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 300, maxHeight: 420 }}>
            {!started && (
              <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
                  style={{ background: `${LIA_COLOR}15`, color: LIA_COLOR, border: `1px solid ${LIA_COLOR}25` }}>L</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Pronto para descobrir o potencial do seu negócio?</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Clique abaixo para iniciar a conversa com a LIA</p>
                </div>
                <button onClick={startChat}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ background: GREEN, color: DARK }}>
                  <Sparkles className="w-4 h-4" /> Iniciar diagnóstico gratuito
                </button>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {msg.role === "lia" && (
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ background: `${LIA_COLOR}18`, color: LIA_COLOR, border: `1px solid ${LIA_COLOR}25` }}>L</div>
                  )}
                  <div className="max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={msg.role === "lia"
                      ? { background: "rgba(56,189,248,0.08)", color: "rgba(255,255,255,0.85)", border: `1px solid ${LIA_COLOR}18`, borderTopLeftRadius: 4 }
                      : { background: GREEN, color: DARK, borderTopRightRadius: 4 }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {(thinking || generatingDiag) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: `${LIA_COLOR}18`, color: LIA_COLOR, border: `1px solid ${LIA_COLOR}25` }}>L</div>
                <div className="px-4 py-2.5 rounded-2xl flex items-center gap-2"
                  style={{ background: "rgba(56,189,248,0.08)", border: `1px solid ${LIA_COLOR}18` }}>
                  {generatingDiag
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: LIA_COLOR }} /><span className="text-xs" style={{ color: LIA_COLOR }}>Gerando seu diagnóstico...</span></>
                    : <>{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: LIA_COLOR, animationDelay: `${i*150}ms` }} />)}</>}
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {started && (
            <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(56,189,248,0.1)" }}>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Digite sua resposta..."
                  disabled={thinking || generatingDiag}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.15)", color: "#F0F0F0" }}
                />
                <button onClick={send} disabled={!input.trim() || thinking || generatingDiag}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 active:scale-90"
                  style={{ background: input.trim() ? GREEN : "rgba(255,255,255,0.06)", color: input.trim() ? DARK : "rgba(255,255,255,0.3)" }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs pb-6" style={{ color: "rgba(255,255,255,0.12)" }}>
        © Calu Agência · Diagnóstico gerado por IA
      </p>
    </div>
  );
}
