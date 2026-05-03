import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight, ChevronLeft, Sparkles, CheckCircle2,
  ArrowRight, MessageCircle, Calendar, Star, Zap,
  TrendingUp, Target, RefreshCw,
} from "lucide-react";

const GREEN = "#B9FF4B";
const DARK = "#07080A";

const CAROL_WHATSAPP = "5585986408404";
const CAROL_WA_LINK = `https://wa.me/${CAROL_WHATSAPP}?text=`;

interface LeadData {
  nome: string;
  whatsapp: string;
  email: string;
  empresa: string;
  segmento: string;
  tempoMercado: string;
  produtos: string;
  faturamento: string;
  clienteIdeal: string;
  dorPrincipal: string;
  diferencial: string;
  canaisAtivos: string[];
  trafegoPago: string;
  meta90dias: string;
  budgetMarketing: string;
  jaTentou: string;
}

const EMPTY: LeadData = {
  nome: "", whatsapp: "", email: "", empresa: "", segmento: "",
  tempoMercado: "", produtos: "", faturamento: "", clienteIdeal: "",
  dorPrincipal: "", diferencial: "", canaisAtivos: [],
  trafegoPago: "", meta90dias: "", budgetMarketing: "", jaTentou: "",
};

const CANAIS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "WhatsApp", "YouTube", "Google Ads", "E-mail", "Site/Blog"];

const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

function inp(extra?: React.CSSProperties) {
  return {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(185,255,75,0.15)",
    color: "#F0F0F0",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    ...extra,
  };
}

function buildPrompt(d: LeadData): string {
  return `Você é a LIA, especialista em diagnóstico de marketing da Calu Agência.

Gere um DIAGNÓSTICO DE MARKETING ultra-personalizado e poderoso para o lead abaixo. Este diagnóstico será a primeira impressão da Calu Agência — deve impressionar, gerar credibilidade e criar desejo de contratar.

=== DADOS DO LEAD ===
Nome: ${d.nome}
Empresa: ${d.empresa}
Segmento: ${d.segmento}
Tempo de mercado: ${d.tempoMercado}
Produtos/Serviços: ${d.produtos}
Faturamento mensal atual: ${d.faturamento}

Público-alvo: ${d.clienteIdeal}
Dor principal que resolve: ${d.dorPrincipal}
Diferencial: ${d.diferencial}

Canais de marketing ativos: ${d.canaisAtivos.join(", ") || "Nenhum"}
Investe em tráfego pago: ${d.trafegoPago}
Orçamento disponível para marketing: ${d.budgetMarketing}
Meta nos próximos 90 dias: ${d.meta90dias}
O que já tentou sem sucesso: ${d.jaTentou || "Não informado"}

=== ESTRUTURA DO DIAGNÓSTICO ===

# Diagnóstico de Marketing — ${d.empresa}
*Elaborado pela Calu Agência — ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}*

## 🔍 Diagnóstico Executivo
Análise direta dos 3 maiores problemas que estão travando o crescimento deste negócio agora. Seja específico, use os dados do briefing.

## 📊 Onde Você Está Perdendo Dinheiro
Identifique pontos concretos de vazamento no funil: captação, conversão, retenção. Use linguagem direta.

## ⚡ Top 3 Alavancas de ROI Imediato
As 3 ações que, implementadas nos próximos 30 dias, trarão o maior retorno. Para cada uma: o que fazer, por que vai funcionar e resultado esperado.

## 🗺️ Roadmap dos Próximos 90 Dias
**Mês 1 — Fundação:** [ações]
**Mês 2 — Crescimento:** [ações]
**Mês 3 — Escala:** [ações]

## 🎯 Potencial de Crescimento
Com base no segmento ${d.segmento} e no budget disponível, qual é o potencial realista de crescimento em receita/leads nos próximos 90 dias com as estratégias corretas.

## ✅ Os 5 Próximos Passos Prioritários
Lista numerada com as 5 ações mais urgentes que ${d.nome} precisa tomar.

Seja profundo, específico, use os dados do briefing. Português brasileiro. Tom: autoridade + empolgação. NÃO seja genérico.`;
}

function mdToBlocks(text: string): Array<{ type: "h1" | "h2" | "h3" | "p" | "bullet"; content: string }> {
  const lines = text.split("\n");
  const blocks: Array<{ type: "h1" | "h2" | "h3" | "p" | "bullet"; content: string }> = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("# ")) blocks.push({ type: "h1", content: line.slice(2) });
    else if (line.startsWith("## ")) blocks.push({ type: "h2", content: line.slice(3) });
    else if (line.startsWith("### ")) blocks.push({ type: "h3", content: line.slice(4) });
    else if (line.startsWith("- ") || line.startsWith("* ")) blocks.push({ type: "bullet", content: line.slice(2) });
    else if (/^\d+\. /.test(line)) blocks.push({ type: "bullet", content: line.replace(/^\d+\. /, "") });
    else blocks.push({ type: "p", content: line });
  }
  return blocks;
}

function DiagnosisView({ diagnosis, lead }: { diagnosis: string; lead: LeadData }) {
  const blocks = mdToBlocks(diagnosis);
  const waMsg = encodeURIComponent(
    `Olá! Acabei de receber o diagnóstico gratuito da Calu Agência para ${lead.empresa} e quero saber mais sobre como vocês podem me ajudar a implementar as estratégias!`
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #07080A 0%, #0D1018 100%)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(7,8,10,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(185,255,75,0.1)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: GREEN, color: DARK }}>C</div>
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Calu Agência</span>
        </div>
        <a href={`${CAROL_WA_LINK}${waMsg}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: GREEN, color: DARK }}>
          <MessageCircle className="w-3.5 h-3.5" /> Quero contratar
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 text-center space-y-2"
          style={{ background: "rgba(185,255,75,0.06)", border: "1px solid rgba(185,255,75,0.2)" }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5" style={{ color: GREEN }} />
            <span className="text-sm font-semibold" style={{ color: GREEN }}>Diagnóstico Pronto, {lead.nome.split(" ")[0]}!</span>
          </div>
          <p className="text-base font-bold" style={{ color: "#F0F0F0" }}>
            Analisamos {lead.empresa} e identificamos exatamente o que está travando seu crescimento
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Diagnóstico personalizado elaborado pela IA da Calu Agência
          </p>
        </motion.div>

        {/* Diagnosis content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {blocks.map((block, i) => {
            if (block.type === "h1") return (
              <h1 key={i} className="text-lg font-black leading-tight" style={{ color: "#F0F0F0" }}>
                {block.content}
              </h1>
            );
            if (block.type === "h2") return (
              <h2 key={i} className="text-base font-bold pt-3" style={{ color: GREEN }}>
                {block.content}
              </h2>
            );
            if (block.type === "h3") return (
              <h3 key={i} className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
                {block.content}
              </h3>
            );
            if (block.type === "bullet") return (
              <div key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                <span style={{ color: GREEN, flexShrink: 0, marginTop: 2 }}>▸</span>
                <span>{block.content}</span>
              </div>
            );
            return (
              <p key={i} className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                {block.content}
              </p>
            );
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "linear-gradient(135deg, rgba(185,255,75,0.08), rgba(185,255,75,0.03))", border: "1px solid rgba(185,255,75,0.25)" }}>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="w-4 h-4" style={{ color: GREEN }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: GREEN }}>próximo passo</span>
            </div>
            <p className="text-xl font-black" style={{ color: "#F0F0F0" }}>
              Quer que meu time execute tudo isso por você?
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Este foi apenas o diagnóstico. A Calu Agência tem um time de 11 especialistas em IA prontos para implementar cada uma dessas estratégias.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-3 py-2">
            {[
              { icon: Zap, label: "Resultados em 30 dias" },
              { icon: Target, label: "Estratégia personalizada" },
              { icon: TrendingUp, label: "ROI mensurável" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="text-center space-y-1">
                <div className="w-8 h-8 rounded-xl mx-auto flex items-center justify-center"
                  style={{ background: "rgba(185,255,75,0.12)" }}>
                  <Icon className="w-4 h-4" style={{ color: GREEN }} />
                </div>
                <p className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
              </div>
            ))}
          </div>

          <a href={`${CAROL_WA_LINK}${waMsg}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-base font-black transition-all hover:opacity-90 active:scale-95"
            style={{ background: GREEN, color: DARK, boxShadow: `0 0 32px -4px ${GREEN}60` }}>
            <MessageCircle className="w-5 h-5" />
            Falar com a Carol agora no WhatsApp
            <ArrowRight className="w-4 h-4" />
          </a>

          <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Sem compromisso. Apenas uma conversa para entender como podemos ajudar.
          </p>
        </motion.div>

        {/* Social proof */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { n: "11", label: "Especialistas IA" },
            { n: "90d", label: "Primeiros resultados" },
            { n: "100%", label: "Personalizado" },
          ].map(({ n, label }) => (
            <div key={label} className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xl font-black" style={{ color: GREEN }}>{n}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs pb-8" style={{ color: "rgba(255,255,255,0.15)" }}>
          © Calu Agência · Diagnóstico gerado por IA
        </p>
      </div>
    </div>
  );
}

export default function SuperDiagnostico() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<LeadData>({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof LeadData>(k: K, v: LeadData[K]) =>
    setData(prev => ({ ...prev, [k]: v }));

  const canNext = () => {
    if (step === 0) return data.nome.trim() && data.whatsapp.trim() && data.empresa.trim() && data.segmento.trim();
    if (step === 1) return data.tempoMercado && data.produtos.trim() && data.faturamento;
    if (step === 2) return data.clienteIdeal.trim() && data.dorPrincipal.trim() && data.diferencial.trim();
    if (step === 3) return data.canaisAtivos.length > 0 && data.trafegoPago;
    if (step === 4) return data.meta90dias && data.budgetMarketing;
    return true;
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Save lead to contacts
      supabase.from("contacts").insert({
        name: data.nome,
        phone: data.whatsapp,
        email: data.email || null,
        company: data.empresa,
        channel: "Super Diagnóstico",
        status: "Novo",
        notes: `Segmento: ${data.segmento} | Meta: ${data.meta90dias} | Budget: ${data.budgetMarketing}`,
      }).then(() => {});

      const { data: res, error: err } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt: "Você é a LIA, especialista em diagnóstico de marketing da Calu Agência. Gere diagnósticos poderosos, específicos e que impressionam. Português brasileiro. Nunca seja genérico.",
          maxTokens: 6000,
          enableThinking: true,
          thinkingBudget: 4000,
          messages: [{ role: "user", content: buildPrompt(data) }],
        },
      });
      if (err) throw err;
      setDiagnosis(res?.content ?? "");
    } catch (e: any) {
      setError("Erro ao gerar diagnóstico. Tente novamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (diagnosis) return <DiagnosisView diagnosis={diagnosis} lead={data} />;

  const STEPS = [
    { title: "Você", sub: "Quem é você?" },
    { title: "Negócio", sub: "Sobre a empresa" },
    { title: "Público", sub: "Seu cliente ideal" },
    { title: "Marketing", sub: "O que você já faz" },
    { title: "Objetivos", sub: "Onde quer chegar" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #07080A 0%, #0D1018 100%)" }}>
      {/* Header */}
      <div className="px-4 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: GREEN, color: DARK }}>C</div>
        <div>
          <p className="text-sm font-bold" style={{ color: "#F0F0F0" }}>Calu Agência</p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Super Diagnóstico Gratuito</p>
        </div>
      </div>

      {/* Hero (only step 0) */}
      {step === 0 && (
        <div className="px-4 pb-4 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-2"
            style={{ background: "rgba(185,255,75,0.1)", color: GREEN, border: "1px solid rgba(185,255,75,0.2)" }}>
            <Sparkles className="w-3 h-3" /> 100% Gratuito · Gerado por IA
          </div>
          <h1 className="text-2xl font-black leading-tight" style={{ color: "#F0F0F0" }}>
            Descubra o que está travando o crescimento do seu negócio
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Responda 5 etapas rápidas e receba um diagnóstico personalizado com o roadmap exato para escalar sua empresa nos próximos 90 dias.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="px-4 pb-2">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{ background: i <= step ? GREEN : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
          Etapa {step + 1} de {STEPS.length} — {STEPS[step].sub}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }} className="space-y-3">

            {step === 0 && <>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Seu nome *</label>
                <input value={data.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: João Silva" style={inp()} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>WhatsApp *</label>
                <input value={data.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="Ex: 11987654321" type="tel" style={inp()} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>E-mail (opcional)</label>
                <input value={data.email} onChange={e => set("email", e.target.value)} placeholder="seuemail@empresa.com" type="email" style={inp()} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Nome da empresa *</label>
                <input value={data.empresa} onChange={e => set("empresa", e.target.value)} placeholder="Ex: Clínica Bella Pele" style={inp()} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Segmento / Nicho *</label>
                <input value={data.segmento} onChange={e => set("segmento", e.target.value)} placeholder="Ex: Estética, E-commerce de moda, Advocacia..." style={inp()} />
              </div>
            </>}

            {step === 1 && <>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Há quanto tempo está no mercado? *</label>
                <select value={data.tempoMercado} onChange={e => set("tempoMercado", e.target.value)} style={inp()}>
                  <option value="">Selecione...</option>
                  {["Menos de 1 ano", "1 a 2 anos", "2 a 5 anos", "5 a 10 anos", "Mais de 10 anos"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>O que você vende? *</label>
                <textarea value={data.produtos} onChange={e => set("produtos", e.target.value)} rows={3}
                  placeholder="Descreva seus principais produtos ou serviços..." style={inp({ resize: "none" })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Faturamento mensal atual *</label>
                <select value={data.faturamento} onChange={e => set("faturamento", e.target.value)} style={inp()}>
                  <option value="">Selecione...</option>
                  {["Até R$5k", "R$5k–15k", "R$15k–30k", "R$30k–80k", "R$80k–200k", "Acima de R$200k"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </>}

            {step === 2 && <>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Quem é seu cliente ideal? *</label>
                <textarea value={data.clienteIdeal} onChange={e => set("clienteIdeal", e.target.value)} rows={3}
                  placeholder="Descreva: idade, profissão, comportamento, poder aquisitivo..." style={inp({ resize: "none" })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Qual dor principal você resolve? *</label>
                <textarea value={data.dorPrincipal} onChange={e => set("dorPrincipal", e.target.value)} rows={2}
                  placeholder="Qual problema seu cliente tinha antes de te contratar?" style={inp({ resize: "none" })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Qual é o seu grande diferencial? *</label>
                <textarea value={data.diferencial} onChange={e => set("diferencial", e.target.value)} rows={2}
                  placeholder="Por que um cliente te escolheria ao invés da concorrência?" style={inp({ resize: "none" })} />
              </div>
            </>}

            {step === 3 && <>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Onde você já faz marketing? *</label>
                <div className="flex flex-wrap gap-2">
                  {CANAIS.map(c => (
                    <button key={c} type="button" onClick={() => set("canaisAtivos", toggle(data.canaisAtivos, c))}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: data.canaisAtivos.includes(c) ? "rgba(185,255,75,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${data.canaisAtivos.includes(c) ? "rgba(185,255,75,0.35)" : "rgba(255,255,255,0.08)"}`,
                        color: data.canaisAtivos.includes(c) ? GREEN : "rgba(255,255,255,0.5)",
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Investe em tráfego pago? *</label>
                <select value={data.trafegoPago} onChange={e => set("trafegoPago", e.target.value)} style={inp()}>
                  <option value="">Selecione...</option>
                  {["Não invisto", "Invisto esporadicamente", "Invisto todo mês", "Invisto pesado todo mês"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>O que já tentou que não funcionou?</label>
                <textarea value={data.jaTentou} onChange={e => set("jaTentou", e.target.value)} rows={2}
                  placeholder="Agências, freelancers, cursos, tentativas internas..." style={inp({ resize: "none" })} />
              </div>
            </>}

            {step === 4 && <>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Sua meta principal nos próximos 90 dias *</label>
                <select value={data.meta90dias} onChange={e => set("meta90dias", e.target.value)} style={inp()}>
                  <option value="">Selecione...</option>
                  {[
                    "Aumentar o faturamento", "Gerar mais leads qualificados", "Reduzir o custo por cliente",
                    "Lançar um novo produto/serviço", "Fortalecer a marca", "Escalar o negócio para novas cidades",
                    "Profissionalizar o marketing", "Aumentar presença nas redes sociais",
                  ].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Quanto pode investir em marketing por mês? *</label>
                <select value={data.budgetMarketing} onChange={e => set("budgetMarketing", e.target.value)} style={inp()}>
                  <option value="">Selecione...</option>
                  {["Até R$500", "R$500–1.500", "R$1.500–3.000", "R$3.000–6.000", "R$6.000–12.000", "Acima de R$12.000"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              {error && (
                <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.15)" }}>
                  {error}
                </div>
              )}

              <div className="rounded-xl p-4 text-center space-y-1" style={{ background: "rgba(185,255,75,0.05)", border: "1px solid rgba(185,255,75,0.15)" }}>
                <p className="text-xs font-semibold" style={{ color: GREEN }}>Tudo pronto!</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Em instantes você receberá um diagnóstico completo e personalizado para {data.empresa || "sua empresa"}.
                </p>
              </div>
            </>}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav buttons */}
      <div className="px-4 py-5 space-y-3">
        {step < 4 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
            className="w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-95"
            style={{ background: canNext() ? GREEN : "rgba(255,255,255,0.06)", color: canNext() ? DARK : "rgba(255,255,255,0.2)" }}>
            Continuar <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={generate} disabled={!canNext() || loading}
            className="w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
            style={{ background: GREEN, color: DARK, boxShadow: `0 0 32px -4px ${GREEN}50` }}>
            {loading
              ? <><RefreshCw className="w-5 h-5 animate-spin" /> Analisando seu negócio...</>
              : <><Sparkles className="w-5 h-5" /> Gerar meu diagnóstico gratuito</>}
          </button>
        )}
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} disabled={loading}
            className="w-full py-2 text-sm flex items-center justify-center gap-1"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
          style={{ background: "rgba(7,8,10,0.95)", backdropFilter: "blur(8px)" }}>
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black"
              style={{ background: GREEN, color: DARK }}>C</div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: GREEN }} />
              <span className="relative inline-flex rounded-full h-4 w-4" style={{ background: GREEN }} />
            </span>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-bold" style={{ color: "#F0F0F0" }}>Analisando {data.empresa}...</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Nossa IA está preparando seu diagnóstico personalizado</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: GREEN, animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
