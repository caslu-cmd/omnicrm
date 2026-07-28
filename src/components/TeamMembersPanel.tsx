import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Copy, Trash2, Users, CheckCircle, Clock, Crown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { TEAM_ROLES, papelDoMembro } from "@/lib/teamRoles";

const APP_URL = "https://caluagencia.com.br";

// Papéis e o que cada um enxerga vêm de um lugar só (src/lib/teamRoles.ts),
// o mesmo que o portal usa para montar as abas — assim o que é prometido aqui
// é exatamente o que a pessoa recebe lá.
const ICONES: Record<string, typeof Crown> = {
  gestor: Crown,
  comercial: TrendingUp,
  atendimento: Users,
};

const ROLES = TEAM_ROLES.map((r) => ({ ...r, icon: ICONES[r.id] ?? Users }));

interface Member {
  id: string;
  member_email: string;
  member_name: string | null;
  role: string;
  invite_token: string;
  accepted: boolean;
  created_at: string;
}

export default function TeamMembersPanel({ clientId }: { clientId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "comercial" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("client_members")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (data) setMembers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [clientId]);

  const inviteUrl = (token: string) => `${APP_URL}/invite/${token}`;

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(inviteUrl(token));
    toast.success("Link de convite copiado!");
  };

  const invite = async () => {
    if (!form.email.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const { error } = await (supabase as any).from("client_members").insert({
      agency_user_id: session.user.id,
      client_id: clientId,
      member_email: form.email.trim().toLowerCase(),
      member_name: form.name.trim() || null,
      role: form.role,
    });

    if (error) {
      toast.error(error.code === "23505" ? "Este e-mail já foi convidado" : "Erro ao convidar");
    } else {
      toast.success("Convite criado! Copie o link e envie.");
      setForm({ email: "", name: "", role: "comercial" });
      setShowForm(false);
      load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    await (supabase as any).from("client_members").delete().eq("id", id);
    load();
    toast.success("Membro removido");
  };

  const accent = "#B9FF4B";
  const G = "rgba(185,255,75,";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Time do Cliente</h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Convide o comercial e financeiro para acessar o portal deste cliente
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: accent, color: "#07080A" }}>
          <Plus className="w-4 h-4" /> Convidar membro
        </button>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map(r => (
          <div key={r.id} className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${r.color}20` }}>
            <div className="flex items-center gap-2 mb-1">
              <r.icon className="w-4 h-4" style={{ color: r.color }} />
              <span className="text-sm font-semibold" style={{ color: r.color }}>{r.label}</span>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Invite form */}
      {showForm && (
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: `${G}0.04)`, border: `1px solid ${G}0.15)` }}>
          <p className="text-sm font-semibold" style={{ color: accent }}>Novo convite</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>E-mail *</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="nome@empresa.com.br" type="email"
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>Nome (opcional)</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="João Silva"
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold mb-2 block" style={{ color: "rgba(255,255,255,0.4)" }}>Função</label>
            <div className="flex gap-3">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setForm(f => ({ ...f, role: r.id }))}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: form.role === r.id ? `${r.color}15` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${form.role === r.id ? r.color + "40" : "rgba(255,255,255,0.08)"}`,
                    color: form.role === r.id ? r.color : "rgba(255,255,255,0.5)"
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
              Cancelar
            </button>
            <button onClick={invite} disabled={saving || !form.email.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: accent, color: "#07080A" }}>
              {saving ? "Gerando..." : "Gerar link de convite"}
            </button>
          </div>
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div className="text-center py-10" style={{ color: "rgba(255,255,255,0.3)" }}>
          <div className="h-5 w-5 rounded-full border-2 animate-spin mx-auto mb-2" style={{ borderColor: accent, borderTopColor: "transparent" }} />
          Carregando...
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Nenhum membro convidado</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Convide o time comercial e financeiro do cliente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(m => {
            // resolve inclusive papéis antigos (ex.: "financeiro")
            const papel = papelDoMembro(m.role);
            const roleInfo = ROLES.find(r => r.id === papel.id) ?? ROLES[0];
            return (
              <div key={m.id} className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: `${roleInfo.color}15`, color: roleInfo.color }}>
                    {(m.member_name ?? m.member_email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                        {m.member_name ?? m.member_email}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${roleInfo.color}15`, color: roleInfo.color }}>
                        {roleInfo.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1`}
                        style={{
                          background: m.accepted ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.06)",
                          color: m.accepted ? "#34D399" : "rgba(255,255,255,0.4)"
                        }}>
                        {m.accepted ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        {m.accepted ? "Ativo" : "Pendente"}
                      </span>
                    </div>
                    {m.member_name && (
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{m.member_email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!m.accepted && (
                      <button onClick={() => copyLink(m.invite_token)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: `${G}0.1)`, color: accent, border: `1px solid ${G}0.2)` }}>
                        <Copy className="w-3 h-3" /> Copiar link
                      </button>
                    )}
                    {m.accepted && (
                      <button onClick={() => window.open(`/team-portal/${clientId}`, "_blank")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                        Ver portal
                      </button>
                    )}
                    <button onClick={() => remove(m.id)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#F87171")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {!m.accepted && (
                  <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <code className="text-[10px] flex-1 truncate font-mono px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.4)" }}>
                      {inviteUrl(m.invite_token)}
                    </code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
