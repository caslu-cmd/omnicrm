import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Sparkles, Copy, Download, RefreshCw,
  CheckCircle2, Instagram, Linkedin, Facebook, Youtube,
  ChevronRight, Loader2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────────
type CalendarType = "semanal" | "mensal" | "editorial";

interface Platform {
  id: string;
  label: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
}

// ── Constants ──────────────────────────────────────────────────
const PLATFORMS: Platform[] = [
  { id: "instagram", label: "Instagram",  Icon: Instagram,     color: "#E1306C", bg: "rgba(225,48,108,0.1)"  },
  { id: "tiktok",    label: "TikTok",     Icon: () => <span className="text-xs font-bold">TK</span>, color: "#EE1D52", bg: "rgba(238,29,82,0.1)"   },
  { id: "linkedin",  label: "LinkedIn",   Icon: Linkedin,      color: "#0A66C2", bg: "rgba(10,102,194,0.1)"  },
  { id: "facebook",  label: "Facebook",   Icon: Facebook,      color: "#1877F2", bg: "rgba(24,119,242,0.1)"  },
  { id: "youtube",   label: "YouTube",    Icon: Youtube,       color: "#FF0000", bg: "rgba(255,0,0,0.08)"    },
];

const CALENDAR_TYPES = [
  {
    id: "semanal" as CalendarType,
    emoji: "📅",
    label: "Semanal",
    desc: "1 semana com detalhamento máximo dia a dia",
  },
  {
    id: "mensal" as CalendarType,
    emoji: "📆",
    label: "Mensal",
    desc: "Visão macro do mês com temas por semana",
  },
  {
    id: "editorial" as CalendarType,
    emoji: "📋",
    label: "Editorial Completo",
    desc: "Planejamento de longo prazo com pilares e arco narrativo",
  },
];

const SYSTEM_PROMPT = `Você é a Especialista em Calendário Editorial de uma agência de marketing de alto nível.

Sua metodologia:
1. PILARES DE CONTEÚDO — Define 3 a 5 pilares que sustentam toda a comunicação (ex: Educação, Bastidores, Prova Social, Entretenimento, Venda Direta)
2. FREQUÊNCIA POR PLATAFORMA — Instagram (5-7x/sem), LinkedIn (3-4x/sem), TikTok (diário), Facebook (3x/sem)
3. TEMAS MENSAIS — Cada mês com tema central + subtemas semanais que criam coesão narrativa
4. DATAS ESTRATÉGICAS — Feriados, datas comemorativas, eventos do setor
5. MIX DE CONTEÚDO — Regra 70-20-10: 70% valor, 20% engajamento, 10% venda

Ao criar um CALENDÁRIO SEMANAL entregue:
- Tabela com colunas: Dia | Plataforma | Pilar | Tema | Formato | Ideia de Conteúdo | Objetivo
- Narrativa da semana como um todo
- Horários sugeridos de publicação

Ao criar um CALENDÁRIO MENSAL entregue:
- Tabela: Semana | Tema Central | Formatos | Plataformas | Objetivo
- Mapa de datas relevantes do mês
- Distribuição dos pilares nas semanas

Ao criar um CALENDÁRIO EDITORIAL COMPLETO entregue:
- Definição dos pilares de conteúdo
- Arco narrativo por mês (temas, lançamentos, sazonalidades)
- Cronograma estratégico com marcos importantes
- Diretrizes de tom de voz e linguagem

Use markdown com tabelas, emojis e seções bem organizadas.
Responda sempre em português brasileiro.`;

// ── Simple markdown renderer ───────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 style="color:rgba(255,255,255,0.85);font-size:0.875rem;font-weight:700;margin:1.25rem 0 0.5rem">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="color:rgba(255,255,255,0.9);font-size:1rem;font-weight:700;margin:1.5rem 0 0.6rem">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="color:#B9FF4B;font-size:1.125rem;font-weight:800;margin:0 0 0.75rem">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:rgba(255,255,255,0.85)">$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em style="color:rgba(255,255,255,0.6)">$1</em>')
    .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:1rem 0"/>')
    .replace(/^\|(.+)$/gm, (line) => {
      if (line.match(/^\|[-| :]+\|$/)) return '';
      const cells = line.split('|').filter(Boolean);
      const isHeader = false;
      const cellsHtml = cells.map(c =>
        `<td style="padding:6px 12px;border:1px solid rgba(255,255,255,0.07);font-size:0.75rem;color:rgba(255,255,255,0.7)">${c.trim()}</td>`
      ).join('');
      return `<tr>${cellsHtml}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>)/gs, (m) =>
      `<div style="overflow-x:auto;margin:0.75rem 0"><table style="border-collapse:collapse;width:100%">${m}</table></div>`
    )
    .replace(/^- (.+)$/gm, '<li style="color:rgba(255,255,255,0.65);font-size:0.8125rem;margin:0.2rem 0;padding-left:0.25rem">$1</li>')
    .replace(/(<li.*<\/li>)/gs, (m) => `<ul style="list-style:disc;padding-left:1.25rem;margin:0.5rem 0">${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li style="color:rgba(255,255,255,0.65);font-size:0.8125rem;margin:0.25rem 0">$1</li>')
    .replace(/\n{2,}/g, '<div style="height:0.5rem"></div>')
    .replace(/\n/g, ' ');
}

// ── Component ──────────────────────────────────────────────────
export default function CalendarioEditorialTab({
  clientId,
  clientColor = "#B9FF4B",
  clientName,
  clientNiche,
}: {
  clientId: string;
  clientColor?: string;
  clientName: string;
  clientNiche?: string;
}) {
  const [calType, setCalType]         = useState<CalendarType>("mensal");
  const [platforms, setPlatforms]     = useState<string[]>(["instagram"]);
  const [period, setPeriod]           = useState("");
  const [objectives, setObjectives]   = useState("");
  const [context, setContext]         = useState("");
  const [generating, setGenerating]   = useState(false);
  const [result, setResult]           = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const s = (o = 1) => `rgba(255,255,255,${o})`;

  const togglePlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const buildPrompt = () => {
    const typeLabel = CALENDAR_TYPES.find((t) => t.id === calType)?.label ?? calType;
    const platformList = platforms.join(", ") || "todas as plataformas";
    const niche = clientNiche ?? "não especificado";

    return `Crie um CALENDÁRIO ${typeLabel.toUpperCase()} para o seguinte cliente:

**Cliente:** ${clientName}
**Nicho/Segmento:** ${niche}
**Plataformas:** ${platformList}
**Período:** ${period || "próximo mês"}
**Objetivos:** ${objectives || "aumentar engajamento e reconhecimento de marca"}
${context ? `**Informações adicionais:** ${context}` : ""}

Entregue o calendário completo e detalhado seguindo sua metodologia especializada.`;
  };

  const handleGenerate = async () => {
    if (!platforms.length) {
      toast.error("Selecione ao menos uma plataforma.");
      return;
    }
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("chat-ai", {
        body: {
          messages: [{ role: "user", content: buildPrompt() }],
          systemPrompt: SYSTEM_PROMPT,
          maxTokens: 8000,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.content) throw new Error("Resposta inválida.");

      setResult(data.content);
      toast.success("Calendário gerado com sucesso!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar calendário.";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success("Calendário copiado!");
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendario-${clientName.toLowerCase().replace(/\s+/g, "-")}-${calType}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo baixado!");
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: s(0.85) }}>
            Calendário Editorial
          </h2>
          <p className="text-xs mt-0.5" style={{ color: s(0.35) }}>
            Gere calendários semanais, mensais ou editoriais completos com IA
          </p>
        </div>
        {result && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: s(0.5), border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <Copy className="w-3.5 h-3.5" /> Copiar
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: s(0.5), border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <Download className="w-3.5 h-3.5" /> Baixar
            </button>
          </div>
        )}
      </div>

      <div className={cn("grid gap-4 md:gap-6", result ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1 max-w-2xl")}>
        {/* ── Form ──────────────────────────────────────────── */}
        <div className={cn("space-y-5", result ? "lg:col-span-2" : "")}>
          {/* Calendar type */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: s(0.3) }}>
              Tipo de calendário
            </p>
            <div className="space-y-2">
              {CALENDAR_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCalType(t.id)}
                  className="w-full flex items-start gap-3 rounded-xl p-3 text-left transition-all"
                  style={calType === t.id
                    ? { background: `${clientColor}14`, border: `1px solid ${clientColor}35` }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <span className="text-base mt-0.5">{t.emoji}</span>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: calType === t.id ? clientColor : s(0.75) }}>
                      {t.label}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: s(0.3) }}>{t.desc}</div>
                  </div>
                  {calType === t.id && (
                    <CheckCircle2 className="w-3.5 h-3.5 ml-auto mt-0.5 flex-shrink-0" style={{ color: clientColor }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: s(0.3) }}>
              Plataformas
            </p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const selected = platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                    style={selected
                      ? { background: p.bg, color: p.color, border: `1px solid ${p.color}35` }
                      : { background: "rgba(255,255,255,0.04)", color: s(0.35), border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <p.Icon className="w-3 h-3" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period + Objectives */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: s(0.3) }}>
                Período
              </label>
              <input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="ex: Maio 2026, semana 05/05 a 11/05..."
                className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8) }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: s(0.3) }}>
                Objetivos
              </label>
              <textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                rows={2}
                placeholder="ex: aumentar seguidores, gerar leads, lançar produto..."
                className="w-full rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8) }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: s(0.3) }}>
                Contexto adicional <span style={{ color: s(0.2) }}>(opcional)</span>
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                placeholder="ex: há lançamento previsto, datas fixas, campanhas em andamento..."
                className="w-full rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8) }}
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !platforms.length}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: clientColor, color: "#07080A" }}
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando calendário...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Gerar Calendário com IA</>
            )}
          </button>
        </div>

        {/* ── Output ────────────────────────────────────────── */}
        <AnimatePresence>
          {(result || generating || error) && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="col-span-3 rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", minHeight: 400 }}
            >
              {/* Output header */}
              <div
                className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5" style={{ color: clientColor }} />
                  <span className="text-xs font-semibold" style={{ color: s(0.7) }}>
                    {CALENDAR_TYPES.find((t) => t.id === calType)?.label} — {clientName}
                  </span>
                </div>
                {result && (
                  <button
                    onClick={() => setResult(null)}
                    className="p-1 rounded-lg transition-all"
                    style={{ color: s(0.25) }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = s(0.6); }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = s(0.25); }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-auto p-6">
                {generating && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: clientColor, borderTopColor: "transparent" }}
                    />
                    <div className="text-center">
                      <p className="text-sm font-medium" style={{ color: s(0.6) }}>
                        Gerando seu calendário...
                      </p>
                      <p className="text-xs mt-1" style={{ color: s(0.25) }}>
                        Isso pode levar alguns segundos
                      </p>
                    </div>
                  </div>
                )}

                {error && !generating && (
                  <div
                    className="rounded-xl p-4 flex items-start gap-3"
                    style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.15)" }}
                  >
                    <X className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#F87171" }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "#F87171" }}>Erro ao gerar</p>
                      <p className="text-xs mt-0.5" style={{ color: s(0.45) }}>{error}</p>
                    </div>
                  </div>
                )}

                {result && !generating && (
                  <div
                    className="prose prose-invert max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
                  />
                )}
              </div>

              {result && (
                <div
                  className="flex gap-2 px-5 py-3 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: `${clientColor}14`, color: clientColor, border: `1px solid ${clientColor}30` }}
                  >
                    <RefreshCw className="w-3 h-3" /> Gerar novo
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", color: s(0.45), border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Copy className="w-3 h-3" /> Copiar tudo
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", color: s(0.45), border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Download className="w-3 h-3" /> Baixar .txt
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
