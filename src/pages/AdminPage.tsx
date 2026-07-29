import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, CreditCard, Palette, Globe, Building,
  Plus, Eye, BarChart3, Crown, Layers, Save, Loader2,
  TrendingUp, DollarSign, UserCheck, UserX, Settings2, Trash2,
  Upload, Image as ImageIcon, X, Bell, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const tabs = [
  { key: "overview", label: "Dashboard", icon: BarChart3 },
  { key: "clients", label: "Clientes WL", icon: Palette },
  { key: "users", label: "Todos os Usuários", icon: Users },
  { key: "notifications", label: "Notificações", icon: Bell },
  { key: "my-whitelabel", label: "Minha Plataforma", icon: Settings2 },
  { key: "billing", label: "Faturamento", icon: CreditCard },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const AdminPage = () => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [wlSettings, setWlSettings] = useState({
    platform_name: "OmniCRM",
    primary_color: "#0B6E99",
    secondary_color: "#16A085",
    accent_color: "#F5A623",
    custom_domain: "",
    remove_branding: false,
    logo_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allWhiteLabel, setAllWhiteLabel] = useState<any[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [newNotif, setNewNotif] = useState({ title: "", message: "", target_user_id: "" });
  const [sendingNotif, setSendingNotif] = useState(false);

  useEffect(() => {
    if (!isAdmin || !user) return;

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
            logo_url: data.logo_url || "",
          });
        }
      });

    supabase.rpc("get_all_profiles").then(({ data }) => {
      if (data) setAllProfiles(data);
    });
    supabase.rpc("get_all_white_label_settings").then(({ data }) => {
      if (data) setAllWhiteLabel(data);
    });

    // Load notifications
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });

    // Realtime notifications
    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setNotifications(prev => [payload.new as any, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingLogo(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Erro ao enviar logo: " + uploadError.message);
      setUploadingLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    setWlSettings(p => ({ ...p, logo_url: urlData.publicUrl }));
    setUploadingLogo(false);
    toast.success("Logo enviado com sucesso!");
  };

  const saveWhiteLabel = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("white_label_settings")
      .upsert({ user_id: user.id, ...wlSettings }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Configurações salvas!");
  };

  const sendNotification = async () => {
    if (!newNotif.title.trim() || !newNotif.message.trim()) {
      toast.error("Título e mensagem são obrigatórios");
      return;
    }
    setSendingNotif(true);

    // If target is empty, send to all users
    const targetUsers = newNotif.target_user_id
      ? [newNotif.target_user_id]
      : allProfiles.map(p => p.user_id);

    const inserts = targetUsers.map(uid => ({
      user_id: uid,
      title: newNotif.title,
      message: newNotif.message,
      type: "admin",
    }));

    const { error } = await supabase.from("notifications").insert(inserts);
    setSendingNotif(false);
    if (error) toast.error("Erro ao enviar: " + error.message);
    else {
      toast.success(`Notificação enviada para ${targetUsers.length} usuário(s)`);
      setNewNotif({ title: "", message: "", target_user_id: "" });
    }
  };

  if (adminLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const totalClients = allWhiteLabel.length;
  const activeClients = allWhiteLabel.filter(wl => wl.custom_domain).length;
  const brandingRemoved = allWhiteLabel.filter(wl => wl.remove_branding).length;
  const totalUsers = allProfiles.length;

  const getOwnerName = (userId: string) => {
    const profile = allProfiles.find(p => p.user_id === userId);
    return profile?.display_name || "Sem nome";
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6 min-w-0 break-words">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Super Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão da plataforma White-Label e clientes</p>
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

          {/* ===== DASHBOARD OVERVIEW ===== */}
          {tab === "overview" && (
            <motion.div variants={item} className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Clientes White-Label", value: totalClients, icon: Palette, color: "text-primary", sub: "total cadastrados" },
                  { label: "Domínios Ativos", value: activeClients, icon: Globe, color: "text-secondary", sub: "com domínio customizado" },
                  { label: "Branding Removido", value: brandingRemoved, icon: Eye, color: "text-accent-foreground", sub: "plano premium" },
                  { label: "Usuários na Plataforma", value: totalUsers, icon: Users, color: "text-primary", sub: "total registrados" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between mb-3">
                      <s.icon className={cn("h-5 w-5", s.color)} />
                      <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-bold font-display text-foreground">Receita White-Label</h3>
                    <p className="text-xs text-muted-foreground">Estimativa baseada nos clientes ativos</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">R$ {(totalClients * 297).toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">MRR Estimado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">R$ {(totalClients * 297 * 12).toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">ARR Projetado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">R$ 297</p>
                    <p className="text-xs text-muted-foreground">Ticket Médio/mês</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Últimos Clientes White-Label</h3>
                  <button onClick={() => setTab("clients")} className="text-xs text-primary font-medium hover:underline">Ver todos →</button>
                </div>
                {allWhiteLabel.length === 0 ? (
                  <div className="text-center py-8">
                    <Palette className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum cliente white-label ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allWhiteLabel.slice(0, 5).map(wl => (
                      <div key={wl.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3">
                          {wl.logo_url ? (
                            <img src={wl.logo_url} alt="Logo" className="h-9 w-9 rounded-lg object-cover" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: wl.primary_color || "#0B6E99" }}>
                              {(wl.platform_name || "O")[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-foreground">{wl.platform_name || "OmniCRM"}</p>
                            <p className="text-xs text-muted-foreground">{getOwnerName(wl.user_id)} · {wl.custom_domain || "sem domínio"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {wl.remove_branding && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary/10 text-secondary">Premium</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{new Date(wl.updated_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== CLIENTS WHITE LABEL ===== */}
          {tab === "clients" && (
            <motion.div variants={item} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" /> {allWhiteLabel.length} Clientes White-Label
                </h3>
              </div>
              {allWhiteLabel.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-10 shadow-card text-center">
                  <Palette className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-foreground font-medium">Nenhum cliente ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allWhiteLabel.map(wl => (
                    <div key={wl.id} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4 hover:border-primary/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {wl.logo_url ? (
                            <img src={wl.logo_url} alt="Logo" className="h-12 w-12 rounded-xl object-cover" />
                          ) : (
                            <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: wl.primary_color || "#0B6E99" }}>
                              {(wl.platform_name || "O")[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-base font-bold text-foreground">{wl.platform_name || "OmniCRM"}</p>
                            <p className="text-xs text-muted-foreground">{getOwnerName(wl.user_id)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {wl.remove_branding ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-secondary/10 text-secondary">Premium</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">Standard</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-muted-foreground mb-0.5">Domínio</p>
                          <p className="font-medium text-foreground">{wl.custom_domain || "Não configurado"}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-muted-foreground mb-0.5">Branding</p>
                          <p className="font-medium text-foreground">{wl.remove_branding ? "Removido ✓" : "Ativo"}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-muted-foreground mb-0.5">Atualizado</p>
                          <p className="font-medium text-foreground">{new Date(wl.updated_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {[
                          { label: "Primária", color: wl.primary_color },
                          { label: "Secundária", color: wl.secondary_color },
                          { label: "Acento", color: wl.accent_color },
                        ].map(c => (
                          <div key={c.label} className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded border border-border" style={{ backgroundColor: c.color || "#ccc" }} />
                            <div>
                              <p className="text-[10px] text-muted-foreground">{c.label}</p>
                              <p className="text-[10px] font-mono text-foreground">{c.color || "—"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-lg border border-border p-3 bg-muted/20">
                        <p className="text-[10px] text-muted-foreground mb-2">Preview</p>
                        <div className="flex items-center gap-2 mb-2">
                          {wl.logo_url ? (
                            <img src={wl.logo_url} alt="Logo" className="h-7 w-7 rounded object-cover" />
                          ) : (
                            <div className="h-7 w-7 rounded flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: wl.primary_color || "#0B6E99" }}>
                              {(wl.platform_name || "O")[0]}
                            </div>
                          )}
                          <span className="text-sm font-bold text-foreground">{wl.platform_name}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="h-6 rounded px-3 flex items-center text-white text-[10px] font-medium" style={{ backgroundColor: wl.primary_color }}>Primário</div>
                          <div className="h-6 rounded px-3 flex items-center text-white text-[10px] font-medium" style={{ backgroundColor: wl.secondary_color }}>Secundário</div>
                          <div className="h-6 rounded px-3 flex items-center text-white text-[10px] font-medium" style={{ backgroundColor: wl.accent_color }}>Acento</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== ALL USERS ===== */}
          {tab === "users" && (
            <motion.div variants={item} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold font-display text-foreground">{allProfiles.length} Usuários Registrados</h3>
                <button onClick={() => toast.info("Convites por e-mail em breve")} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  <Plus className="h-4 w-4" /> Convidar
                </button>
              </div>
              <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Usuário</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">ID</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">White-Label</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProfiles.map(u => {
                      const hasWL = allWhiteLabel.some(wl => wl.user_id === u.user_id);
                      return (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-foreground">{u.display_name || "Sem nome"}</p>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{u.user_id?.slice(0, 8)}...</td>
                          <td className="px-5 py-3">
                            {hasWL ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary/10 text-secondary">Ativo</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {tab === "notifications" && (
            <motion.div variants={item} className="space-y-6">
              {/* Send notification */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" /> Enviar Notificação
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Título *</label>
                    <input
                      value={newNotif.title}
                      onChange={e => setNewNotif(p => ({ ...p, title: e.target.value }))}
                      placeholder="Título da notificação"
                      className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Destinatário</label>
                    <select
                      value={newNotif.target_user_id}
                      onChange={e => setNewNotif(p => ({ ...p, target_user_id: e.target.value }))}
                      className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                    >
                      <option value="">Todos os usuários</option>
                      {allProfiles.map(p => (
                        <option key={p.user_id} value={p.user_id}>{p.display_name || p.user_id.slice(0, 8)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Mensagem *</label>
                  <textarea
                    value={newNotif.message}
                    onChange={e => setNewNotif(p => ({ ...p, message: e.target.value }))}
                    placeholder="Escreva a mensagem da notificação..."
                    rows={3}
                    className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                  />
                </div>
                <button
                  onClick={sendNotification}
                  disabled={sendingNotif}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {sendingNotif ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar
                </button>
              </div>

              {/* Recent notifications */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold text-foreground">Notificações Recentes</h3>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma notificação enviada</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                    {notifications.map(n => (
                      <div key={n.id} className={cn("p-3 rounded-lg border border-border", n.read ? "bg-muted/20" : "bg-primary/5 border-primary/20")}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-foreground">{n.title}</p>
                          <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Para: {getOwnerName(n.user_id)} · {n.read ? "Lida ✓" : "Não lida"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== MY WHITE LABEL CONFIG ===== */}
          {tab === "my-whitelabel" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" /> Minha Plataforma
                </h3>

                {/* Logo upload */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Logotipo</label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                      {wlSettings.logo_url ? (
                        <img src={wlSettings.logo_url} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingLogo ? "Enviando..." : "Enviar Logo"}
                      </button>
                      {wlSettings.logo_url && (
                        <button
                          onClick={() => setWlSettings(p => ({ ...p, logo_url: "" }))}
                          className="flex items-center gap-1 text-xs text-destructive hover:underline"
                        >
                          <X className="h-3 w-3" /> Remover
                        </button>
                      )}
                      <p className="text-[10px] text-muted-foreground">PNG, JPG ou SVG. Recomendado 200×200px.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Nome da Plataforma</label>
                    <input value={wlSettings.platform_name} onChange={e => setWlSettings(p => ({ ...p, platform_name: e.target.value }))} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Domínio Customizado</label>
                    <input value={wlSettings.custom_domain} onChange={e => setWlSettings(p => ({ ...p, custom_domain: e.target.value }))} placeholder="app.seucrm.com.br" className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
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
                        <input type="color" value={wlSettings[c.key]} onChange={e => setWlSettings(p => ({ ...p, [c.key]: e.target.value }))} className="h-8 w-8 rounded-lg border border-border cursor-pointer" />
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
                    <p className="text-sm font-medium text-foreground">Remover branding</p>
                    <p className="text-[10px] text-muted-foreground">Remove "Powered by OmniCRM"</p>
                  </div>
                  <button onClick={() => setWlSettings(p => ({ ...p, remove_branding: !p.remove_branding }))} className={cn("relative h-6 w-11 rounded-full transition-colors", wlSettings.remove_branding ? "bg-primary" : "bg-muted")}>
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow-sm transition-transform", wlSettings.remove_branding ? "left-[22px]" : "left-0.5")} />
                  </button>
                </div>

                {/* Live preview */}
                <div className="rounded-lg border border-border p-4 bg-muted/20">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Preview da Marca</p>
                  <div className="flex items-center gap-3 mb-3">
                    {wlSettings.logo_url ? (
                      <img src={wlSettings.logo_url} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: wlSettings.primary_color }}>
                        {wlSettings.platform_name[0]}
                      </div>
                    )}
                    <span className="text-lg font-bold text-foreground">{wlSettings.platform_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 rounded-lg px-4 flex items-center text-white text-xs font-medium" style={{ backgroundColor: wlSettings.primary_color }}>Primário</div>
                    <div className="h-8 rounded-lg px-4 flex items-center text-white text-xs font-medium" style={{ backgroundColor: wlSettings.secondary_color }}>Secundário</div>
                    <div className="h-8 rounded-lg px-4 flex items-center text-white text-xs font-medium" style={{ backgroundColor: wlSettings.accent_color }}>Acento</div>
                  </div>
                </div>

                <button onClick={saveWhiteLabel} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== BILLING ===== */}
          {tab === "billing" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-bold font-display text-foreground">Receita da Plataforma</h3>
                    <p className="text-xs text-muted-foreground">Resumo financeiro dos clientes white-label</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Clientes Ativos", value: String(totalClients) },
                    { label: "MRR", value: `R$ ${(totalClients * 297).toLocaleString("pt-BR")}` },
                    { label: "ARR", value: `R$ ${(totalClients * 297 * 12).toLocaleString("pt-BR")}` },
                    { label: "Ticket Médio", value: "R$ 297" },
                  ].map(f => (
                    <div key={f.label} className="text-center">
                      <p className="text-lg font-bold text-foreground">{f.value}</p>
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-3">
                <h3 className="text-base font-semibold text-foreground">Clientes por Plano</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border text-center">
                    <p className="text-2xl font-bold text-foreground">{totalClients - brandingRemoved}</p>
                    <p className="text-xs text-muted-foreground">Standard (com branding)</p>
                  </div>
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-center">
                    <p className="text-2xl font-bold text-primary">{brandingRemoved}</p>
                    <p className="text-xs text-muted-foreground">Premium (branding removido)</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;
