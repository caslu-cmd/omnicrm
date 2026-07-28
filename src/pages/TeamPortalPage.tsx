import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Users, LogOut, Search, Phone, Mail, Building2, KanbanSquare, FileInput, MessageCircle } from "lucide-react";
import LeadsKanbanTab from "@/components/LeadsKanbanTab";
import FormGenerator from "@/components/FormGenerator";
import InboxTab from "@/components/InboxTab";
import { papelDoMembro } from "@/lib/teamRoles";

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
    });
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      .select("id, name, email, phone, company, source, score, created_at")
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

  const filtered = contacts.filter(c => {
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
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 4 }}>
          {TABS.map(t => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 16px", background: "transparent",
                  border: "none", borderBottom: `2px solid ${active ? accent : "transparent"}`, cursor: "pointer",
                  color: active ? "#F0F0F0" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: active ? 600 : 500 }}>
                <Icon style={{ width: 15, height: 15, color: active ? accent : "rgba(255,255,255,0.4)" }} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
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
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>Contatos</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{filtered.length} contatos</p>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 100px", gap: 12, padding: "6px 16px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>
                  <span>Nome</span><span>Contato</span><span>Empresa</span><span>Origem</span><span>Score</span>
                </div>
                {filtered.map(c => {
                  const src = c.source ? SOURCES[c.source] : null;
                  return (
                    <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 100px", gap: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name || "—"}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                        {c.company && <Building2 style={{ width: 12, height: 12, flexShrink: 0 }} />}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.company ?? "—"}</span>
                      </div>
                      <div>
                        {src ? (
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: `${src.color}15`, color: src.color, fontWeight: 600 }}>{src.label}</span>
                        ) : <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{c.source ?? "—"}</span>}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${c.score}%`, background: c.score >= 70 ? "#F97316" : c.score >= 40 ? "#F59E0B" : "#60A5FA", borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", minWidth: 24, textAlign: "right" }}>{c.score}</span>
                        </div>
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
