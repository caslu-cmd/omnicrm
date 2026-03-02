import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, CreditCard, Palette, Globe, Building, ChevronRight,
  Plus, CheckCircle2, Settings2, Eye, Copy, Download, BarChart3,
  Server, Crown, Layers, Save, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const tabs = [
  { key: "overview", label: "Visão Geral", icon: BarChart3 },
  { key: "users", label: "Usuários & Roles", icon: Users },
  { key: "whitelabel", label: "Meu White-Label", icon: Palette },
  { key: "whitelabel-all", label: "White-Label (Todos)", icon: Eye },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "reseller", label: "Programa Reseller", icon: Building },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const AdminPage = () => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({ contacts: 0, deals: 0, automations: 0, integrations: 0 });
  const [wlSettings, setWlSettings] = useState({
    platform_name: "OmniCRM",
    primary_color: "#0B6E99",
    secondary_color: "#16A085",
    accent_color: "#F5A623",
    custom_domain: "",
    remove_branding: false,
  });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [allWhiteLabel, setAllWhiteLabel] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin || !user) return;

    // Load stats
    Promise.all([
      supabase.from("contacts").select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }),
      supabase.from("automations").select("id", { count: "exact", head: true }),
      supabase.from("integrations").select("id", { count: "exact", head: true }).eq("connected", true),
    ]).then(([c, d, a, i]) => {
      setStats({
        contacts: c.count || 0,
        deals: d.count || 0,
        automations: a.count || 0,
        integrations: i.count || 0,
      });
    });

    // Load white label settings
    supabase
      .from("white_label_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setWlSettings({
            platform_name: data.platform_name || "OmniCRM",
            primary_color: data.primary_color || "#0B6E99",
            secondary_color: data.secondary_color || "#16A085",
            accent_color: data.accent_color || "#F5A623",
            custom_domain: data.custom_domain || "",
            remove_branding: data.remove_branding || false,
          });
        }
      });

    // Load all profiles via RPC (super admin)
    supabase.rpc("get_all_profiles").then(({ data }) => {
      if (data) {
        setUsers(data);
        setAllProfiles(data);
      }
    });

    // Load ALL white label settings via RPC (super admin)
    supabase.rpc("get_all_white_label_settings").then(({ data }) => {
      if (data) setAllWhiteLabel(data);
    });
  }, [isAdmin, user]);

  const saveWhiteLabel = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("white_label_settings")
      .upsert({
        user_id: user.id,
        ...wlSettings,
      }, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Configurações White-Label salvas!");
    }
  };

  if (adminLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Painel Administrativo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão completa da plataforma, white-label e usuários</p>
      </motion.div>

      <div className="flex gap-6">
        <motion.div variants={item} className="w-52 shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left", tab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </motion.div>

        <div className="flex-1 space-y-6">
          {/* Overview */}
          {tab === "overview" && (
            <motion.div variants={item} className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Contatos", value: stats.contacts, icon: Users, color: "text-primary" },
                  { label: "Deals Ativos", value: stats.deals, icon: BarChart3, color: "text-secondary" },
                  { label: "Automações", value: stats.automations, icon: Layers, color: "text-accent-foreground" },
                  { label: "Integrações", value: stats.integrations, icon: Globe, color: "text-primary" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between mb-2">
                      <s.icon className={cn("h-5 w-5", s.color)} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="text-base font-semibold text-foreground mb-4">Informações do Admin</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">E-mail:</span> <span className="font-medium text-foreground">{user?.email}</span></p>
                  <p><span className="text-muted-foreground">Role:</span> <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">Admin</span></p>
                  <p><span className="text-muted-foreground">Último login:</span> <span className="text-foreground">{new Date().toLocaleDateString("pt-BR")}</span></p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Users */}
          {tab === "users" && (
            <motion.div variants={item} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold font-display text-foreground">{users.length} Usuários</h3>
                <button onClick={() => toast.info("Convites por e-mail em breve")} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  <Plus className="h-4 w-4" /> Convidar
                </button>
              </div>
              <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Usuário</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">ID</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-foreground">{u.display_name || "Sem nome"}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{u.user_id?.slice(0, 8)}...</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* White Label */}
          {tab === "whitelabel" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" /> Personalização da Marca
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Nome da Plataforma</label>
                    <input
                      value={wlSettings.platform_name}
                      onChange={e => setWlSettings(p => ({ ...p, platform_name: e.target.value }))}
                      className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Domínio Customizado</label>
                    <input
                      value={wlSettings.custom_domain}
                      onChange={e => setWlSettings(p => ({ ...p, custom_domain: e.target.value }))}
                      placeholder="app.seucrm.com.br"
                      className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Logo</label>
                  <div className="mt-1 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {wlSettings.platform_name?.[0] || "O"}
                    </div>
                    <button onClick={() => toast.info("Upload de logo em breve")} className="px-3 py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary">
                      Upload Logo
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cores da Marca</label>
                  <div className="flex gap-4 mt-2">
                    {([
                      { label: "Primária", key: "primary_color" as const },
                      { label: "Secundária", key: "secondary_color" as const },
                      { label: "Acento", key: "accent_color" as const },
                    ] as const).map(c => (
                      <div key={c.key} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={wlSettings[c.key]}
                          onChange={e => setWlSettings(p => ({ ...p, [c.key]: e.target.value }))}
                          className="h-8 w-8 rounded-lg border border-border cursor-pointer"
                        />
                        <div>
                          <p className="text-[10px] text-muted-foreground">{c.label}</p>
                          <p className="text-xs font-mono text-foreground">{wlSettings[c.key]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Remover marca "Powered by OmniCRM"</p>
                    <p className="text-[10px] text-muted-foreground">Sua plataforma com sua marca</p>
                  </div>
                  <button
                    onClick={() => setWlSettings(p => ({ ...p, remove_branding: !p.remove_branding }))}
                    className={cn("relative h-6 w-11 rounded-full transition-colors", wlSettings.remove_branding ? "bg-primary" : "bg-muted")}
                  >
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow-sm transition-transform", wlSettings.remove_branding ? "left-[22px]" : "left-0.5")} />
                  </button>
                </div>
                <button
                  onClick={saveWhiteLabel}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Configurações
                </button>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold text-foreground">Preview</h3>
                <div className="rounded-lg border border-border p-4 bg-muted/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: wlSettings.primary_color }}>
                      {wlSettings.platform_name?.[0] || "O"}
                    </div>
                    <span className="text-lg font-bold text-foreground">{wlSettings.platform_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 rounded-lg px-4 flex items-center text-white text-xs font-medium" style={{ backgroundColor: wlSettings.primary_color }}>Botão Primário</div>
                    <div className="h-8 rounded-lg px-4 flex items-center text-white text-xs font-medium" style={{ backgroundColor: wlSettings.secondary_color }}>Secundário</div>
                    <div className="h-8 rounded-lg px-4 flex items-center text-white text-xs font-medium" style={{ backgroundColor: wlSettings.accent_color }}>Acento</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* White Label - Todos os usuários */}
          {tab === "whitelabel-all" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Configurações White-Label de Todos os Usuários
                  </h3>
                  <span className="text-xs text-muted-foreground">{allWhiteLabel.length} configuração(ões)</span>
                </div>
                {allWhiteLabel.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma configuração white-label encontrada.</p>
                ) : (
                  <div className="space-y-4">
                    {allWhiteLabel.map((wl) => {
                      const ownerProfile = allProfiles.find(p => p.user_id === wl.user_id);
                      return (
                        <div key={wl.id} className="rounded-xl border border-border p-5 space-y-3 hover:border-primary/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: wl.primary_color || "#0B6E99" }}>
                                {(wl.platform_name || "O")[0]}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{wl.platform_name || "OmniCRM"}</p>
                                <p className="text-xs text-muted-foreground">{ownerProfile?.display_name || "Usuário desconhecido"} · {wl.user_id?.slice(0, 8)}...</p>
                              </div>
                            </div>
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", wl.remove_branding ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground")}>
                              {wl.remove_branding ? "Branding removido" : "Com branding"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">Domínio:</span>{" "}
                              <span className="font-medium text-foreground">{wl.custom_domain || "—"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Atualizado:</span>{" "}
                              <span className="font-medium text-foreground">{new Date(wl.updated_at).toLocaleDateString("pt-BR")}</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            {[
                              { label: "Primária", color: wl.primary_color },
                              { label: "Secundária", color: wl.secondary_color },
                              { label: "Acento", color: wl.accent_color },
                            ].map(c => (
                              <div key={c.label} className="flex items-center gap-1.5">
                                <div className="h-5 w-5 rounded border border-border" style={{ backgroundColor: c.color || "#ccc" }} />
                                <span className="text-[10px] text-muted-foreground">{c.label}</span>
                                <span className="text-[10px] font-mono text-foreground">{c.color || "—"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Billing */}
          {tab === "billing" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-bold font-display text-foreground">Plano Enterprise</h3>
                    <p className="text-xs text-muted-foreground">Faturamento anual · Próxima renovação: 1 Mar 2027</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Usuários", value: "Ilimitados" },
                    { label: "Contatos", value: "500.000" },
                    { label: "E-mails/mês", value: "1.000.000" },
                    { label: "Armazenamento", value: "500 GB" },
                  ].map(f => (
                    <div key={f.label} className="text-center">
                      <p className="text-lg font-bold text-foreground">{f.value}</p>
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Reseller */}
          {tab === "reseller" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <Building className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-bold font-display text-foreground">Programa de Parceiros</h3>
                    <p className="text-xs text-muted-foreground">Revenda com sua marca para seus clientes</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Clientes Ativos", value: "0" },
                    { label: "MRR Total", value: "R$ 0" },
                    { label: "Comissão Mensal", value: "R$ 0" },
                    { label: "Taxa", value: "20%" },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <p className="text-sm text-muted-foreground">Nenhum cliente reseller cadastrado ainda. Comece convidando seu primeiro cliente.</p>
                <button onClick={() => toast.info("Programa reseller em breve")} className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" /> Novo Cliente
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;
