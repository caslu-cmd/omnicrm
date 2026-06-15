import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, TrendingUp, BarChart2, Loader2, CheckCircle2,
  AlertCircle, Sparkles, RefreshCw, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

// Separa o relatório do Ben (markdown) nas 3 abas.
function parseRelatorio(content: string): Resultado {
  const grab = (re: RegExp) => {
    const m = content.match(re);
    return m ? m[1].trim() : "";
  };
  const tendencias = grab(/#+\s*🔥[^\n]*\n([\s\S]*?)(?=\n#+\s|$)/);
  const ideias = grab(/#+\s*💡[^\n]*\n([\s\S]*?)(?=\n#+\s|$)/);
  // Hashtags + Quick Wins ficam juntos na última aba
  const hashtags = grab(/#+\s*#️⃣[^\n]*\n([\s\S]*)$/);
  return {
    tendencias: tendencias || content,
    ideias,
    hashtags,
    completo: content,
  };
}

// ── Types ──────────────────────────────────────────────────────────────────────
type Etapa = "idle" | "buscando" | "analisando" | "concluido" | "erro";
type Aba = "tendencias" | "ideias" | "hashtags";

interface Resultado {
  tendencias: string;
  ideias: string;
  hashtags: string;
  completo: string;
}

// ── Etapas de progresso ────────────────────────────────────────────────────────
const ETAPAS = [
  { id: "buscando",  label: "Buscando",   desc: "Pesquisando na internet",   icon: Search },
  { id: "analisando",label: "Analisando", desc: "Processando resultados",     icon: BarChart2 },
  { id: "concluido", label: "Ben",        desc: "Gerando insights finais",    icon: TrendingUp },
] as const;

const PLATAFORMAS = [
  { value: "todas",     label: "Todas as plataformas" },
  { value: "Instagram", label: "Instagram" },
  { value: "TikTok",    label: "TikTok" },
  { value: "LinkedIn",  label: "LinkedIn" },
  { value: "YouTube",   label: "YouTube" },
  { value: "Facebook",  label: "Facebook" },
];

function etapaIndex(e: Etapa): number {
  if (e === "buscando")  return 0;
  if (e === "analisando") return 1;
  if (e === "concluido") return 2;
  return -1;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copiado!");
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function BenPage() {
  const [nicho, setNicho] = useState("");
  const [plataforma, setPlataforma] = useState("todas");
  const [tipoConteudo, setTipoConteudo] = useState("");
  const [etapa, setEtapa] = useState<Etapa>("idle");
  const [queryAtual, setQueryAtual] = useState("");
  const [buscaCount, setBuscaCount] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<Aba>("tendencias");

  const ativo = etapa === "buscando" || etapa === "analisando";
  const idxAtual = etapaIndex(etapa);

  const cancelar = useCallback(() => {
    setEtapa("idle");
    setQueryAtual("");
    setBuscaCount(0);
  }, []);

  const pesquisar = useCallback(async () => {
    if (!nicho.trim()) {
      toast.error("Informe o nicho antes de pesquisar.");
      return;
    }

    setEtapa("buscando");
    setResultado(null);
    setQueryAtual("Pesquisando tendências na web...");
    setBuscaCount(0);

    // Transição visual para a fase de análise (a chamada é única, ~30-60s)
    const t = setTimeout(() => {
      setEtapa("analisando");
      setQueryAtual("Analisando resultados...");
    }, 2000);

    try {
      const { data, error } = await supabase.functions.invoke("ben-trends", {
        body: { nicho, plataforma, tipo_conteudo: tipoConteudo },
      });
      clearTimeout(t);

      if (error) throw new Error(error.message ?? "Erro ao consultar o Ben.");
      const content: string = data?.content ?? "";
      if (!content) throw new Error(data?.error ?? "Ben não retornou resultado.");

      setResultado(parseRelatorio(content));
      setEtapa("concluido");
      setAbaAtiva("tendencias");
      toast.success("Pesquisa concluída! Tendências prontas.");
    } catch (err: any) {
      clearTimeout(t);
      setEtapa("erro");
      setQueryAtual(err?.message ?? "Erro desconhecido");
      toast.error("Falha na pesquisa de tendências. Tente novamente.");
    }
  }, [nicho, plataforma, tipoConteudo]);

  const abaConfig: { id: Aba; label: string; emoji: string }[] = [
    { id: "tendencias", label: "Tendências",       emoji: "🔥" },
    { id: "ideias",     label: "Ideias",            emoji: "💡" },
    { id: "hashtags",   label: "Hashtags & Estratégia", emoji: "#️⃣" },
  ];

  const textoAba = resultado
    ? abaAtiva === "tendencias" ? resultado.tendencias
      : abaAtiva === "ideias" ? resultado.ideias
      : resultado.hashtags
    : "";

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-4rem)] overflow-auto md:overflow-hidden" style={{ background: "#07080A" }}>

      {/* ── Painel esquerdo — inputs ───────────────────────────── */}
      <div
        className="flex flex-col w-full md:w-[340px] md:min-w-[300px] flex-shrink-0 border-b md:border-b-0 md:border-r overflow-y-auto"
        style={{ borderColor: "#1E1E2E", background: "#0A0A10" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#1E1E2E" }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "#B9FF4B22", border: "1px solid #B9FF4B44" }}
          >
            🔍
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: "#F0F0F0" }}>Ben</div>
            <div className="text-[11px]" style={{ color: "#B9FF4B", opacity: 0.7 }}>
              Especialista em Tendências
            </div>
          </div>
        </div>

        {/* Skills do Ben */}
        <div className="px-5 py-3 border-b" style={{ borderColor: "#1E1E2E" }}>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>Skills</p>
          <div className="flex flex-wrap gap-2">
            {[
              { emoji: "🌐", label: "Web Search" },
              { emoji: "📊", label: "Análise" },
              { emoji: "💡", label: "Ideação" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium"
                style={{ background: "#B9FF4B15", border: "1px solid #B9FF4B30", color: "#B9FF4B" }}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 flex flex-col px-5 py-4 gap-4 overflow-y-auto">
          {/* Nicho */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
              Nicho / Segmento <span style={{ color: "#F87171" }}>*</span>
            </label>
            <input
              type="text"
              className="rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: "#141420",
                border: "1px solid #2A2A3A",
                color: "#E0E0F0",
                fontFamily: "inherit",
              }}
              placeholder="Ex: moda fitness, alimentação saudável, tecnologia..."
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              disabled={ativo}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
            />
          </div>

          {/* Plataforma */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
              Plataforma
            </label>
            <select
              className="rounded-xl px-4 py-3 text-sm outline-none transition-colors appearance-none cursor-pointer"
              style={{
                background: "#141420",
                border: "1px solid #2A2A3A",
                color: "#E0E0F0",
                fontFamily: "inherit",
              }}
              value={plataforma}
              onChange={(e) => setPlataforma(e.target.value)}
              disabled={ativo}
            >
              {PLATAFORMAS.map((p) => (
                <option key={p.value} value={p.value} style={{ background: "#141420" }}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de conteúdo (opcional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
              Tipo de conteúdo <span style={{ color: "#555577", fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              type="text"
              className="rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: "#141420",
                border: "1px solid #2A2A3A",
                color: "#E0E0F0",
                fontFamily: "inherit",
              }}
              placeholder="Ex: reels educativos, carrossel, stories..."
              value={tipoConteudo}
              onChange={(e) => setTipoConteudo(e.target.value)}
              disabled={ativo}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
            />
          </div>
        </div>

        {/* Botão */}
        <div className="px-5 pb-5">
          {ativo ? (
            <button
              onClick={cancelar}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "#1E1E2E", border: "1px solid #3A3A4A", color: "#8888AA" }}
            >
              <XIcon className="w-4 h-4" />
              Cancelar
            </button>
          ) : (
            <button
              onClick={pesquisar}
              disabled={!nicho.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: nicho.trim() ? "#B9FF4B" : "#1E1E2E",
                color: nicho.trim() ? "#07080A" : "#444466",
                cursor: nicho.trim() ? "pointer" : "not-allowed",
              }}
            >
              <Sparkles className="w-4 h-4" />
              Pesquisar Tendências
            </button>
          )}
        </div>
      </div>

      {/* ── Painel direito — resultado ──────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-[400px] md:min-h-0">

        {/* Barra de progresso / abas */}
        <div
          className="flex items-center gap-0 border-b px-4"
          style={{ borderColor: "#1E1E2E", background: "#0A0A10", minHeight: 52 }}
        >
          {(etapa === "idle" || ativo || etapa === "erro") ? (
            <div className="flex items-center gap-3 flex-1">
              {ETAPAS.map((e, i) => {
                const done   = idxAtual > i;
                const active = idxAtual === i && ativo;
                return (
                  <div key={e.id} className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                      style={{
                        background: done ? "#B9FF4B22" : active ? "#1E1E2E" : "transparent",
                        border: `1px solid ${done ? "#B9FF4B55" : active ? "#B9FF4B33" : "#1E1E2E"}`,
                        color: done ? "#B9FF4B" : active ? "#B9FF4B" : "#444466",
                      }}
                    >
                      {done ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : active ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <e.icon className="w-3.5 h-3.5" />
                      )}
                      <span>{e.label}</span>
                    </div>
                    {i < ETAPAS.length - 1 && (
                      <div className="w-5 h-px" style={{ background: "#1E1E2E" }} />
                    )}
                  </div>
                );
              })}
              {ativo && queryAtual && (
                <span className="ml-2 text-[11px] truncate max-w-xs" style={{ color: "#666688" }}>
                  {queryAtual}
                </span>
              )}
              {etapa === "erro" && (
                <span className="ml-2 text-[11px] flex items-center gap-1" style={{ color: "#F87171" }}>
                  <AlertCircle className="w-3.5 h-3.5" /> {queryAtual}
                </span>
              )}
            </div>
          ) : (
            /* Abas de resultado */
            <div className="flex items-center gap-1 flex-1">
              {abaConfig.map((aba) => (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{
                    background: abaAtiva === aba.id ? "#B9FF4B22" : "transparent",
                    color: abaAtiva === aba.id ? "#B9FF4B" : "#555577",
                    borderBottom: abaAtiva === aba.id ? "2px solid #B9FF4B" : "2px solid transparent",
                    borderRadius: "8px 8px 0 0",
                  }}
                >
                  <span>{aba.emoji}</span>
                  {aba.label}
                </button>
              ))}

              <div className="flex items-center gap-2 ml-auto">
                {resultado && (
                  <button
                    onClick={() => copyToClipboard(textoAba)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
                    style={{ background: "#1E1E2E", color: "#8888AA" }}
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </button>
                )}
                <button
                  onClick={() => { setEtapa("idle"); setResultado(null); setNicho(""); setQueryAtual(""); setBuscaCount(0); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
                  style={{ background: "#1E1E2E", color: "#8888AA" }}
                  title="Nova pesquisa"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* Estado inicial */}
            {etapa === "idle" && !resultado && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-6"
                style={{ color: "#333355" }}
              >
                <div style={{ fontSize: 72 }}>🔍</div>
                <div className="text-center">
                  <p className="text-lg font-semibold mb-1" style={{ color: "#555577" }}>
                    Tendências do Google Trends para o seu nicho
                  </p>
                  <p className="text-sm" style={{ color: "#333355" }}>
                    Ben consulta o Google Trends Brasil e traz dados reais de interesse, queries em crescimento e ideias de conteúdo.
                  </p>
                </div>
                <div className="flex gap-4">
                  {ETAPAS.map((e) => (
                    <div
                      key={e.id}
                      className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl"
                      style={{ background: "#0E0E18", border: "1px solid #1A1A2A" }}
                    >
                      <e.icon className="w-5 h-5" style={{ color: "#444466" }} />
                      <span className="text-xs font-medium" style={{ color: "#555577" }}>{e.label}</span>
                      <span className="text-[11px] text-center" style={{ color: "#333355" }}>{e.desc}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Pesquisando */}
            {ativo && (
              <motion.div
                key="ativo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-8"
              >
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                    style={{ background: "#0E1A08", border: "1px solid #B9FF4B33" }}
                  >
                    🔍
                  </div>
                  <div
                    className="absolute -inset-2 rounded-2xl animate-pulse"
                    style={{ background: "#B9FF4B0A", border: "1px solid #B9FF4B22" }}
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <p className="font-semibold" style={{ color: "#B9FF4B" }}>
                    {etapa === "buscando" ? `Busca ${buscaCount} em andamento...` : "Analisando resultados..."}
                  </p>
                  {queryAtual && (
                    <p className="text-sm max-w-md text-center" style={{ color: "#555577" }}>
                      {queryAtual}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: "#333355" }}>
                    Isso leva cerca de 30-60 segundos
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-72">
                  {ETAPAS.map((e, i) => {
                    const done   = idxAtual > i;
                    const active = idxAtual === i;
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{
                          background: done ? "#0E1A08" : active ? "#141420" : "#0A0A10",
                          border: `1px solid ${done ? "#B9FF4B33" : active ? "#B9FF4B22" : "#1A1A2A"}`,
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: done ? "#B9FF4B22" : active ? "#B9FF4B11" : "#1A1A2A" }}
                        >
                          {done ? (
                            <CheckCircle2 className="w-4 h-4" style={{ color: "#B9FF4B" }} />
                          ) : active ? (
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#B9FF4B" }} />
                          ) : (
                            <e.icon className="w-4 h-4" style={{ color: "#333355" }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: done || active ? "#B9FF4B" : "#333355" }}>
                            {e.label}
                          </p>
                          <p className="text-[11px]" style={{ color: "#444466" }}>{e.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Resultado */}
            {resultado && etapa === "concluido" && (
              <motion.div
                key={`resultado-${abaAtiva}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-auto p-6"
              >
                <pre
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: "#C0C0D0", fontFamily: "inherit", maxWidth: 820 }}
                >
                  {textoAba || resultado.completo}
                </pre>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
