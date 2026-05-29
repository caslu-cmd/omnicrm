import { useState, useEffect, useCallback } from "react";
import {
  Users, Phone, MapPin, Calendar, DollarSign,
  RefreshCw, CheckCircle2, Clock, XCircle, Filter,
  ExternalLink, AlertTriangle, Loader2, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────────
type Status = "novo" | "em_contato" | "contratado" | "nao_qualificado";

interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  posto_fiscal: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  anos_lotacao: number | null;
  codigo_156: string | null;
  valor_estimado_min: number | null;
  valor_estimado_max: number | null;
  canal: string | null;
  status: Status;
  observacoes: string | null;
  created_at: string;
}

// ── Config de status ───────────────────────────────────────────
const STATUS_CFG: Record<Status, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  novo:            { label: "Novo",           color: "#B9FF4B", bg: "rgba(185,255,75,0.1)",   icon: Clock },
  em_contato:      { label: "Em contato",     color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   icon: Phone },
  contratado:      { label: "Contratado",     color: "#34D399", bg: "rgba(52,211,153,0.1)",   icon: CheckCircle2 },
  nao_qualificado: { label: "Não qualificado",color: "#9CA3AF", bg: "rgba(156,163,175,0.08)", icon: XCircle },
};

const STATUS_ORDER: Status[] = ["novo", "em_contato", "contratado", "nao_qualificado"];

function fmt(v: number | null) {
  if (!v) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function waLink(n: string) {
  const digits = n.replace(/\D/g, "");
  const num = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${num}`;
}

// ── Componente principal ───────────────────────────────────────
export default function TriagemSefazPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "todos">("todos");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [obsEdit, setObsEdit] = useState<Record<string, string>>({});

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("triagem_sefaz_leads" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar leads");
    } else {
      setLeads((data as Lead[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function updateStatus(id: string, status: Status) {
    setUpdatingId(id);
    const { error } = await supabase
      .from("triagem_sefaz_leads" as any)
      .update({ status })
      .eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      toast.success("Status atualizado");
    }
    setUpdatingId(null);
  }

  async function saveObs(id: string) {
    const obs = obsEdit[id] ?? "";
    const { error } = await supabase
      .from("triagem_sefaz_leads" as any)
      .update({ observacoes: obs })
      .eq("id", id);
    if (error) toast.error("Erro ao salvar observação");
    else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, observacoes: obs } : l));
      toast.success("Observação salva");
    }
  }

  const visible = filter === "todos" ? leads : leads.filter(l => l.status === filter);

  // ── Stats ──────────────────────────────────────────────────
  const today = new Date().toDateString();
  const novosHoje = leads.filter(l => new Date(l.created_at).toDateString() === today).length;
  const totalMin = leads.reduce((s, l) => s + (l.valor_estimado_min ?? 0), 0);
  const totalMax = leads.reduce((s, l) => s + (l.valor_estimado_max ?? 0), 0);
  const countByStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  return (
    <div style={{ minHeight: "100vh", background: "#07080A", color: "#fff", fontFamily: "Inter, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚖️</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Triagem SEFAZ/CE</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "rgba(249,115,22,0.15)", color: "#F97316", border: "1px solid rgba(249,115,22,0.3)" }}>
              Prazo: 05/06/2026
            </span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
            Leads capturados pelo agente de triagem — Adicional Noturno SEFAZ
          </p>
        </div>
        <button
          onClick={fetchLeads}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer" }}>
          <RefreshCw size={13} />
          Atualizar
        </button>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total de leads", value: leads.length, icon: "👥", color: "#B9FF4B" },
            { label: "Novos hoje", value: novosHoje, icon: "🆕", color: "#60A5FA" },
            { label: "Contratados", value: countByStatus.contratado, icon: "✅", color: "#34D399" },
            { label: "Valor estimado (mín)", value: fmt(totalMin), icon: "💰", color: "#F59E0B", small: true },
            { label: "Valor estimado (máx)", value: fmt(totalMax), icon: "💎", color: "#A78BFA", small: true },
          ].map(s => (
            <div key={s.label} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: s.small ? 13 : 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filtros de status ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilter("todos")}
            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: filter === "todos" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${filter === "todos" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"}`, color: filter === "todos" ? "#fff" : "rgba(255,255,255,0.5)" }}>
            Todos ({leads.length})
          </button>
          {STATUS_ORDER.map(s => {
            const cfg = STATUS_CFG[s];
            const active = filter === s;
            return (
              <button key={s} onClick={() => setFilter(s)}
                style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: active ? cfg.bg : "rgba(255,255,255,0.03)", border: `1px solid ${active ? cfg.color + "50" : "rgba(255,255,255,0.07)"}`, color: active ? cfg.color : "rgba(255,255,255,0.45)" }}>
                {cfg.label} ({countByStatus[s]})
              </button>
            );
          })}
        </div>

        {/* ── Lista de leads ── */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.25)" }}>
            <Users size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Nenhum lead ainda</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Os leads aparecerão aqui assim que o agente capturar os primeiros contatos</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map(lead => {
              const cfg = STATUS_CFG[lead.status ?? "novo"];
              const StatusIcon = cfg.icon;
              return (
                <div key={lead.id} style={{ borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>

                  {/* Linha principal */}
                  <div style={{ padding: "14px 18px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>

                    {/* Nome + status */}
                    <div style={{ minWidth: 200, flex: "1 1 200px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 4 }}>{lead.nome}</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 6, background: cfg.bg, border: `1px solid ${cfg.color}30`, fontSize: 11, color: cfg.color }}>
                        <StatusIcon size={10} />
                        {cfg.label}
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div style={{ minWidth: 140, flex: "0 0 auto" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>WhatsApp</div>
                      <a href={waLink(lead.whatsapp)} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#34D399", textDecoration: "none", fontWeight: 600 }}>
                        {lead.whatsapp}
                        <ExternalLink size={11} />
                      </a>
                    </div>

                    {/* Posto + período */}
                    <div style={{ minWidth: 160, flex: "1 1 160px" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Posto Fiscal</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{lead.posto_fiscal || "—"}</div>
                      {(lead.periodo_inicio || lead.periodo_fim) && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                          {lead.periodo_inicio} – {lead.periodo_fim}
                          {lead.anos_lotacao ? ` · ${lead.anos_lotacao} anos` : ""}
                        </div>
                      )}
                    </div>

                    {/* Valor estimado */}
                    <div style={{ minWidth: 140, flex: "0 0 auto" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Valor estimado</div>
                      {lead.valor_estimado_min || lead.valor_estimado_max ? (
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>
                          {fmt(lead.valor_estimado_min)} – {fmt(lead.valor_estimado_max)}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>A calcular</div>
                      )}
                      {lead.codigo_156 && (
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                          Cód. 156: {lead.codigo_156}
                        </div>
                      )}
                    </div>

                    {/* Data */}
                    <div style={{ minWidth: 110, flex: "0 0 auto", textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Entrada</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{fmtDate(lead.created_at)}</div>
                    </div>
                  </div>

                  {/* Rodapé: mudar status + observações */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "10px 18px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
                      {STATUS_ORDER.filter(s => s !== lead.status).map(s => {
                        const c = STATUS_CFG[s];
                        return (
                          <button key={s} disabled={updatingId === lead.id}
                            onClick={() => updateStatus(lead.id, s)}
                            style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontWeight: 500, background: c.bg, border: `1px solid ${c.color}25`, color: c.color, opacity: updatingId === lead.id ? 0.5 : 1 }}>
                            → {c.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Observações */}
                    <div style={{ display: "flex", gap: 6, flex: "1 1 200px", minWidth: 200 }}>
                      <input
                        placeholder="Observação..."
                        value={obsEdit[lead.id] ?? (lead.observacoes ?? "")}
                        onChange={e => setObsEdit(prev => ({ ...prev, [lead.id]: e.target.value }))}
                        style={{ flex: 1, padding: "4px 10px", borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, outline: "none" }}
                      />
                      <button onClick={() => saveObs(lead.id)}
                        style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.25)", color: "#B9FF4B", fontSize: 11, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Aviso prazo */}
        <div style={{ marginTop: 24, padding: "12px 16px", borderRadius: 12, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", display: "flex", gap: 10, alignItems: "center" }}>
          <AlertTriangle size={14} style={{ color: "#F97316", flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>
            <strong style={{ color: "#F97316" }}>Prazo fatal: 05/06/2026.</strong> Leads com status "Novo" precisam ser contatados urgentemente.
          </p>
        </div>
      </div>
    </div>
  );
}
