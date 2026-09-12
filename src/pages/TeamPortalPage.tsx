import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Users, LogOut, Search, Phone, Mail, Building2, KanbanSquare, FileInput, MessageCircle, Plus } from "lucide-react";
import LeadsKanbanTab from "@/components/LeadsKanbanTab";
import FormGenerator from "@/components/FormGenerator";
import InboxTab from "@/components/InboxTab";
import { papelDoMembro } from "@/lib/teamRoles";
import { COURSE_PIPELINE_STAGES } from "@/lib/funnelStages";
import { toast } from "sonner";

const SOURCES: Record<string, { label: string; color: string }> = {
  instagram: { label: "Instagram", color: "#E1306C" },
  facebook:  { label: "Facebook",  color: "#1877F2" },
  whatsapp:  { label: "WhatsApp",  color: "#25D366" },
  website:   { label: "Website",   color: "#8B5CF6" },
  indicacao: { label: "Indicação", color: "#F59E0B" },
  linkedin:  { label: "LinkedIn",  color: "#0A66C2" },
};

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  score: number;
  funnel_stage: string | null;
  created_at: string;
}

interface MemberInfo {
  role: string;
  member_name: string | null;
  member_email: string;
}

type Tab = "funil" | "inbox" | "contatos" | "captacao";

const accent = "#B9FF4B";

export default function TeamPortalPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [member, setMember]     = useState<MemberInfo | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("funil");
  const [crmLists, setCrmLists] = useState<{ id: string; name: string }[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>("Todos");
  const [showNewTable, setShowNewTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");

  // Se o papel não dá acesso à aba atual, cai na primeira que ele pode ver.
  useEffect(() => {
    const permitidas = papelDoMembro(member?.role).tabs;
    if (permitidas.length && !permitidas.includes(tab)) setTab(permitidas[0]);
  }, [member?.role, tab]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate(`/entrar`, { state: { from: location } }); return; }
      setAuthLoading(false);
      loadMember(session.user.id);
      loadContacts();
      loadCrmLists();
    });
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCrmLists = async () => {
    const { data } = await (supabase as any)
      .from("crm_lists").select("id, name")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });
    if (data) setCrmLists(data);
  };

  // Colaborador cria uma tabela nova (ex.: "Inscritos - Curso X")
  const createTable = async () => {
    const nome = newTableName.trim();
    if (!nome) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await (supabase as any).from("crm_lists").insert({
      user_id: session.user.id, client_id: clientId, name: nome,
    });
    if (error) { toast.error("Não foi possível criar a tabela"); return; }
    setNewTableName(""); setShowNewTable(false);
    await loadCrmLists();
    setActiveSegment(nome);
  };

  // Colaborador marca em qual etapa do funil o contato está
  const updateStage = async (contactId: string, stage: string) => {
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, funnel_stage: stage || null } : c));
    const { error } = await (supabase as any).from("contacts")
      .update({ funnel_stage: stage || null }).eq("id", contactId);
    if (error) toast.error("Não foi possível salvar a etapa");
  };

  const loadMember = async (userId: string) => {
    const { data } = await (supabase as any)
      .from("client_members")
      .select("role, member_name, member_email")
      .eq("member_user_id", userId)
      .eq("client_id", clientId)
      .eq("accepted", true)
      .single();
    setMember(data ?? null);
  };

  const loadContacts = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("contacts")
      .select("id, name, email, phone, company, source, score, funnel_stage, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setContacts(data);
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#07080A" }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(185,255,75,.15)", borderTopColor: accent, borderRadius: "50%", animation: "spin .75s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const papel = papelDoMembro(member?.role);
  const roleLabel = papel.label;

  const segments: string[] = ["Todos", ...Array.from(new Set([
    ...crmLists.map((l) => l.name),
    ...contacts.map((c) => c.source).filter(Boolean) as string[],
  ]))];

  const filtered = contacts.filter(c => {
    const matchSegment = activeSegment === "Todos" || c.source === activeSegment;
    if (!matchSegment) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q) || c.company?.toLowerCase().includes(q));
  });

  // Só as abas que o papel do convidado permite.
  const TABS: { id: Tab; label: string; icon: typeof KanbanSquare }[] = ([
    { id: "funil",    label: "Funil de Leads", icon: KanbanSquare },
    { id: "inbox",    label: "Inbox",          icon: MessageCircle },
    { id: "contatos", label: "Contatos",       icon: Users },
    { id: "captacao", label: "Captação",       icon: FileInput },
  ] as const).filter((t) => papel.tabs.includes(t.id)) as { id: Tab; label: string; icon: typeof KanbanSquare }[];

  return (
    <div style={{ minHeight: "100vh", background: "#07080A", color: "#F0F0F0" }}>
      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap style={{ width: 17, height: 17, color: "#07080A" }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Seu CRM</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 20 }}>por Calu Agência</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {member && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ lineHeight: 1.2, textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{member.member_name ?? member.member_email}</div>
                  <div style={{ fontSize: 10, color: accent }}>{roleLabel}</div>
                </div>
              </div>
            )}
            <button onClick={signOut}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>
              <LogOut style={{ width: 13, height: 13 }} /> Sair
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 16px" }}>
        {/* rola na horizontal no celular em vez de espremer as abas */}
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map(t => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 16px", background: "transparent", whiteSpace: "nowrap", flexShrink: 0,
                  border: "none", borderBottom: `2px solid ${active ? accent : "transparent"}`, cursor: "pointer",
                  color: active ? "#F0F0F0" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: active ? 600 : 500 }}>
                <Icon style={{ width: 15, height: 15, color: active ? accent : "rgba(255,255,255,0.4)" }} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px" }}>
        {/* ── Funil (kanban) ── */}
        {tab === "funil" && clientId && (
          <LeadsKanbanTab clientId={clientId} clientColor={accent} />
        )}

        {/* ── Inbox omnichannel ── */}
        {tab === "inbox" && clientId && (
          <InboxTab clientId={clientId} accent={accent} />
        )}

        {/* ── Captação (formulários) ── */}
        {tab === "captacao" && clientId && (
          <FormGenerator clientId={clientId} accent={accent} />
        )}

        {/* ── Contatos ── */}
        {tab === "contatos" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>Contatos</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{filtered.length} contatos</p>
            </div>

            {/* Tabelas (segmentos) — ex.: "Inscritos - Curso X" */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {segments.map((seg) => {
                const count = seg === "Todos" ? contacts.length : contacts.filter((c) => c.source === seg).length;
                const active = activeSegment === seg;
                return (
                  <button key={seg} onClick={() => setActiveSegment(seg)}
                    style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                      background: active ? `${accent}22` : "rgba(255,255,255,0.04)", color: active ? accent : "rgba(255,255,255,0.4)",
                      border: `1px solid ${active ? accent + "40" : "rgba(255,255,255,0.07)"}` }}>
                    {seg} <span style={{ opacity: 0.6 }}>({count})</span>
                  </button>
                );
              })}
              {showNewTable ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input autoFocus value={newTableName} onChange={(e) => setNewTableName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createTable(); if (e.key === "Escape") { setShowNewTable(false); setNewTableName(""); } }}
                    placeholder="Ex.: Inscritos - Curso X"
                    style={{ width: 190, padding: "6px 10px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${accent}40`, color: "#F0F0F0", outline: "none" }} />
                  <button onClick={createTable} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: accent, color: "#07080A", border: "none" }}>Criar</button>
                  <button onClick={() => { setShowNewTable(false); setNewTableName(""); }} style={{ padding: "6px 8px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.4)", border: "none" }}>✕</button>
                </div>
              ) : (
                <button onClick={() => setShowNewTable(true)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px dashed rgba(255,255,255,0.18)" }}>
                  <Plus style={{ width: 12, height: 12 }} /> Nova tabela
                </button>
              )}
            </div>

            <div style={{ position: "relative", marginBottom: 20 }}>
              <Search style={{ width: 15, height: 15, position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail, telefone ou empresa..."
                style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
                <div style={{ width: 28, height: 28, border: "2px solid rgba(185,255,75,.2)", borderTopColor: accent, borderRadius: "50%", animation: "spin .75s linear infinite", margin: "0 auto 12px" }} />
                Carregando contatos...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Users style={{ width: 40, height: 40, color: "rgba(255,255,255,0.15)", margin: "0 auto 12px" }} />
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>{search ? "Nenhum resultado" : "Nenhum contato ainda"}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowX: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.4fr 1fr 1.2fr 0.7fr 78px", gap: 12, padding: "6px 16px", minWidth: 760, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>
                  <span>Nome</span><span>Contato</span><span>Empresa</span><span>Etapa do funil</span><span>Score</span><span style={{ textAlign: "right" }}>Ações</span>
                </div>
                {filtered.map(c => {
                  const src = c.source ? SOURCES[c.source] : null;
                  const waPhone = c.phone ? c.phone.replace(/\D/g, "") : "";
                  return (
                    <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.7fr 1.4fr 1fr 1.2fr 0.7fr 78px", gap: 12, padding: "14px 16px", minWidth: 760, borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name || "—"}</div>
                        {c.source && (
                          <span style={{ display: "inline-block", marginTop: 4, fontSize: 9, padding: "2px 7px", borderRadius: 20, fontWeight: 600, background: src ? `${src.color}15` : "rgba(255,255,255,0.05)", color: src ? src.color : "rgba(255,255,255,0.4)" }}>{src ? src.label : c.source}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        {c.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                            <Mail style={{ width: 11, height: 11, flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                            <Phone style={{ width: 11, height: 11, flexShrink: 0 }} /><span>{c.phone}</span>
                          </div>
                        )}
                        {!c.email && !c.phone && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>—</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.45)", minWidth: 0 }}>
                        {c.company && <Building2 style={{ width: 12, height: 12, flexShrink: 0 }} />}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.company ?? "—"}</span>
                      </div>
                      {/* Etapa do funil — colaborador marca direto na linha */}
                      <div>
                        <select value={c.funnel_stage ?? ""} onChange={(e) => updateStage(c.id, e.target.value)}
                          style={{ width: "100%", maxWidth: 150, fontSize: 11, padding: "5px 8px", borderRadius: 8, cursor: "pointer", outline: "none",
                            background: c.funnel_stage ? `${accent}14` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${c.funnel_stage ? accent + "30" : "rgba(255,255,255,0.09)"}`,
                            color: c.funnel_stage ? accent : "rgba(255,255,255,0.45)" }}>
                          <option value="">— sem etapa —</option>
                          {COURSE_PIPELINE_STAGES.map((s) => (
                            <option key={s.key} value={s.key} style={{ color: "#111" }}>{s.emoji} {s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${c.score}%`, background: c.score >= 70 ? "#F97316" : c.score >= 40 ? "#F59E0B" : "#60A5FA", borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", minWidth: 20, textAlign: "right" }}>{c.score}</span>
                        </div>
                      </div>
                      {/* Ações: WhatsApp + E-mail */}
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                        {waPhone && (
                          <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" title="Abrir WhatsApp"
                            style={{ display: "flex", padding: 6, borderRadius: 8, color: "#25D366", background: "rgba(37,211,102,0.1)" }}>
                            <MessageCircle style={{ width: 14, height: 14 }} />
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} title="Enviar e-mail"
                            style={{ display: "flex", padding: 6, borderRadius: 8, color: "#60A5FA", background: "rgba(96,165,250,0.1)" }}>
                            <Mail style={{ width: 14, height: 14 }} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
