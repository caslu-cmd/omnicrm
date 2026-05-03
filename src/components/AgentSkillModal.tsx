import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sparkles, Copy, Download, RefreshCw, Loader2,
  Brain, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AgentSkill, getAgentSkills } from "@/data/agentSkills";

interface Props {
  agentId: string;
  agentName: string;
  agentColor: string;
  clientName: string;
  clientNiche?: string;
  onClose: () => void;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, `<h3 style="color:rgba(255,255,255,0.85);font-size:0.8rem;font-weight:700;margin:1rem 0 0.4rem;text-transform:uppercase;letter-spacing:0.05em">$1</h3>`)
    .replace(/^## (.+)$/gm,  `<h2 style="color:rgba(255,255,255,0.9);font-size:0.95rem;font-weight:700;margin:1.25rem 0 0.5rem">$1</h2>`)
    .replace(/^# (.+)$/gm,   `<h1 style="color:#B9FF4B;font-size:1.1rem;font-weight:800;margin:0 0 0.75rem">$1</h1>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:rgba(255,255,255,0.88)">$1</strong>`)
    .replace(/\*(.+?)\*/g,   `<em style="color:rgba(255,255,255,0.55)">$1</em>`)
    .replace(/^---+$/gm, `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0.75rem 0"/>`)
    .replace(/^- \[ \] (.+)$/gm, `<li style="color:rgba(255,255,255,0.55);font-size:0.78rem;margin:0.2rem 0;list-style:none;padding-left:1.2rem;position:relative"><span style="position:absolute;left:0;color:rgba(255,255,255,0.2)">☐</span>$1</li>`)
    .replace(/^- \[x\] (.+)$/gm, `<li style="color:rgba(52,211,153,0.8);font-size:0.78rem;margin:0.2rem 0;list-style:none;padding-left:1.2rem;position:relative"><span style="position:absolute;left:0">✅</span>$1</li>`)
    .replace(/^- (.+)$/gm, `<li style="color:rgba(255,255,255,0.62);font-size:0.8rem;margin:0.2rem 0;padding-left:0.25rem">$1</li>`)
    .replace(/(<li.*<\/li>)/gs, (m) => `<ul style="list-style:disc;padding-left:1.25rem;margin:0.4rem 0">${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, `<li style="color:rgba(255,255,255,0.65);font-size:0.8rem;margin:0.25rem 0">$1</li>`)
    .replace(/`([^`]+)`/g, `<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:3px;font-family:monospace;font-size:0.78rem;color:rgba(185,255,75,0.9)">$1</code>`)
    .replace(/\|(.+)\|/g, (line) => {
      if (line.match(/\|[-| :]+\|/)) return '';
      const cells = line.split('|').filter(Boolean);
      const cellsHtml = cells.map(c =>
        `<td style="padding:5px 10px;border:1px solid rgba(255,255,255,0.07);font-size:0.75rem;color:rgba(255,255,255,0.65)">${c.trim()}</td>`
      ).join('');
      return `<tr>${cellsHtml}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>)/g, (m) =>
      `<div style="overflow-x:auto;margin:0.5rem 0"><table style="border-collapse:collapse;width:100%;min-width:400px">${m}</table></div>`
    )
    .replace(/\n{2,}/g, `<div style="height:0.4rem"></div>`)
    .replace(/\n/g, ' ');
}

export default function AgentSkillModal({
  agentId, agentName, agentColor, clientName, clientNiche, onClose,
}: Props) {
  const skills = getAgentSkills(agentId);
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const s = (o = 1) => `rgba(255,255,255,${o})`;

  const handleSelectSkill = (skill: AgentSkill) => {
    setSelectedSkill(skill);
    setFieldValues({});
    setResult(null);
    setError(null);
  };

  const getFieldValue = (id: string): string => {
    const v = fieldValues[id];
    if (Array.isArray(v)) return v.join(", ");
    return v ?? "";
  };

  const getMultiValue = (id: string): string[] => {
    const v = fieldValues[id];
    if (Array.isArray(v)) return v;
    return [];
  };

  const toggleMulti = (fieldId: string, option: string) => {
    const current = getMultiValue(fieldId);
    const next = current.includes(option)
      ? current.filter((x) => x !== option)
      : [...current, option];
    setFieldValues((prev) => ({ ...prev, [fieldId]: next }));
  };

  const buildUserMessage = () => {
    if (!selectedSkill) return "";
    const clientCtx = `Cliente: ${clientName}${clientNiche ? ` | Nicho: ${clientNiche}` : ""}`;
    const fields = selectedSkill.fields
      .map((f) => `${f.label}: ${getFieldValue(f.id) || "(não informado)"}`)
      .join("\n");
    return `${clientCtx}\n\n${fields}`;
  };

  const canSubmit = () => {
    if (!selectedSkill) return false;
    return selectedSkill.fields
      .filter((f) => f.required)
      .every((f) => {
        const v = fieldValues[f.id];
        if (Array.isArray(v)) return v.length > 0;
        return v && (v as string).trim().length > 0;
      });
  };

  const handleRun = async () => {
    if (!selectedSkill || !canSubmit()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("chat-ai", {
        body: {
          messages: [{ role: "user", content: buildUserMessage() }],
          systemPrompt: selectedSkill.systemPrompt,
          maxTokens: selectedSkill.maxTokens,
          // extended thinking via model parameter — claude-sonnet-4-6 suporta thinking
          ...(selectedSkill.thinking && { model: "claude-sonnet-4-6" }),
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.content) throw new Error("Resposta inválida.");

      setResult(data.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao executar a skill.");
      toast.error("Erro ao executar skill.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success("Copiado!");
  };

  const handleDownload = () => {
    if (!result || !selectedSkill) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agentName}-${selectedSkill.id}-${clientName}.txt`.toLowerCase().replace(/\s+/g, "-");
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo baixado!");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        className="w-full flex overflow-hidden rounded-2xl"
        style={{
          maxWidth: selectedSkill ? 900 : 520,
          maxHeight: "90vh",
          background: "#0A0A14",
          border: `1px solid ${agentColor}30`,
          boxShadow: `0 0 80px -20px ${agentColor}40`,
          transition: "max-width 0.3s ease",
        }}
      >
        {/* ── Skill list (esquerda) ─────────────────────────── */}
        <div
          className="flex flex-col flex-shrink-0 overflow-hidden"
          style={{
            width: 260,
            borderRight: selectedSkill ? `1px solid rgba(255,255,255,0.06)` : "none",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: `${agentColor}18`, border: `1px solid ${agentColor}35`, color: agentColor }}
            >
              {agentName[0]}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate" style={{ color: s(0.9) }}>{agentName}</div>
              <div className="text-[10px]" style={{ color: agentColor }}>Super Agente</div>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-1 rounded-lg flex-shrink-0"
              style={{ color: s(0.25) }}
              onMouseEnter={(e) => { e.currentTarget.style.color = s(0.6); }}
              onMouseLeave={(e) => { e.currentTarget.style.color = s(0.25); }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Skill list */}
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
            <p className="text-[9px] uppercase tracking-widest font-semibold px-2 mb-2" style={{ color: s(0.2) }}>
              Skills disponíveis
            </p>
            {skills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => handleSelectSkill(skill)}
                className="w-full flex items-start gap-3 rounded-xl p-3 text-left transition-all"
                style={selectedSkill?.id === skill.id
                  ? { background: `${agentColor}12`, border: `1px solid ${agentColor}30` }
                  : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={(e) => {
                  if (selectedSkill?.id !== skill.id) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.045)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSkill?.id !== skill.id) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                  }
                }}
              >
                <span className="text-base flex-shrink-0">{skill.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-xs font-semibold truncate"
                    style={{ color: selectedSkill?.id === skill.id ? agentColor : s(0.78) }}
                  >
                    {skill.name}
                  </div>
                  <div className="text-[10px] mt-0.5 leading-snug" style={{ color: s(0.28) }}>
                    {skill.description}
                  </div>
                  {skill.thinking && (
                    <div
                      className="flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-md w-fit"
                      style={{ background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.2)" }}
                    >
                      <Brain className="w-2.5 h-2.5" style={{ color: "#B9FF4B" }} />
                      <span className="text-[9px] font-semibold" style={{ color: "#B9FF4B" }}>Deep Thinking</span>
                    </div>
                  )}
                </div>
                {selectedSkill?.id === skill.id && (
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: agentColor }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Skill form + output (direita) ──────────────────── */}
        <AnimatePresence>
          {selectedSkill && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="flex-1 flex flex-col overflow-hidden"
              style={{ minWidth: 0 }}
            >
              {/* Skill header */}
              <div
                className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-lg">{selectedSkill.emoji}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: s(0.9) }}>{selectedSkill.name}</div>
                  <div className="text-[10px]" style={{ color: s(0.3) }}>{selectedSkill.description}</div>
                </div>
                {selectedSkill.thinking && (
                  <div
                    className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.2)" }}
                  >
                    <Brain className="w-3.5 h-3.5" style={{ color: "#B9FF4B" }} />
                    <span className="text-[10px] font-semibold" style={{ color: "#B9FF4B" }}>Deep Thinking ativo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Form */}
                {!result && !loading && (
                  <div className="p-6 space-y-4">
                    {/* Client context (readonly) */}
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: `${agentColor}08`, border: `1px solid ${agentColor}20` }}
                    >
                      <span className="text-[10px] font-semibold" style={{ color: agentColor }}>Cliente:</span>
                      <span className="text-[10px]" style={{ color: s(0.6) }}>
                        {clientName}{clientNiche ? ` — ${clientNiche}` : ""}
                      </span>
                    </div>

                    {selectedSkill.fields.map((field) => (
                      <div key={field.id}>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: s(0.3) }}>
                          {field.label}
                          {field.required && <span style={{ color: agentColor }}> *</span>}
                        </label>

                        {field.type === "text" && (
                          <input
                            value={getFieldValue(field.id)}
                            onChange={(e) => setFieldValues((p) => ({ ...p, [field.id]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8) }}
                            onFocus={(e) => { e.target.style.borderColor = `${agentColor}50`; }}
                            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                          />
                        )}

                        {field.type === "textarea" && (
                          <textarea
                            value={getFieldValue(field.id)}
                            onChange={(e) => setFieldValues((p) => ({ ...p, [field.id]: e.target.value }))}
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none transition-colors"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8) }}
                            onFocus={(e) => { e.target.style.borderColor = `${agentColor}50`; }}
                            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                          />
                        )}

                        {field.type === "select" && field.options && (
                          <div className="flex flex-wrap gap-1.5">
                            {field.options.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setFieldValues((p) => ({ ...p, [field.id]: opt }))}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                                style={getFieldValue(field.id) === opt
                                  ? { background: `${agentColor}18`, color: agentColor, border: `1px solid ${agentColor}40` }
                                  : { background: "rgba(255,255,255,0.04)", color: s(0.4), border: "1px solid rgba(255,255,255,0.08)" }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {field.type === "multiselect" && field.options && (
                          <div className="flex flex-wrap gap-1.5">
                            {field.options.map((opt) => {
                              const selected = getMultiValue(field.id).includes(opt);
                              return (
                                <button
                                  key={opt}
                                  onClick={() => toggleMulti(field.id, opt)}
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                                  style={selected
                                    ? { background: `${agentColor}18`, color: agentColor, border: `1px solid ${agentColor}40` }
                                    : { background: "rgba(255,255,255,0.04)", color: s(0.4), border: "1px solid rgba(255,255,255,0.08)" }}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div
                      className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: agentColor, borderTopColor: "transparent" }}
                    />
                    <div className="text-center">
                      <p className="text-sm font-semibold" style={{ color: s(0.6) }}>
                        {agentName} está trabalhando...
                      </p>
                      {selectedSkill.thinking && (
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                          <Brain className="w-3.5 h-3.5" style={{ color: "#B9FF4B" }} />
                          <p className="text-xs" style={{ color: "rgba(185,255,75,0.6)" }}>
                            Deep Thinking ativo — pensando profundamente
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && !loading && (
                  <div className="p-6">
                    <div
                      className="rounded-xl p-4 flex items-start gap-3"
                      style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.15)" }}
                    >
                      <X className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#F87171" }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#F87171" }}>Erro</p>
                        <p className="text-xs mt-0.5" style={{ color: s(0.45) }}>{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result */}
                {result && !loading && (
                  <div className="p-6">
                    <div
                      className="prose prose-invert max-w-none text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="flex items-center gap-2 px-6 py-4 flex-shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                {result ? (
                  <>
                    <button
                      onClick={() => { setResult(null); setError(null); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{ background: `${agentColor}12`, color: agentColor, border: `1px solid ${agentColor}25` }}
                    >
                      <RefreshCw className="w-3 h-3" /> Refazer
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", color: s(0.5), border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", color: s(0.5), border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <Download className="w-3 h-3" /> Baixar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setSelectedSkill(null); setFieldValues({}); setResult(null); setError(null); }}
                      className="px-4 py-2 rounded-xl text-xs font-medium"
                      style={{ background: "rgba(255,255,255,0.05)", color: s(0.4), border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleRun}
                      disabled={loading || !canSubmit()}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                      style={{ background: agentColor, color: "#07080A" }}
                    >
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Executando...</>
                        : <><Sparkles className="w-4 h-4" /> Executar Skill</>}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
