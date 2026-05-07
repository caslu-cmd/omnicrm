import caluLogo from "@/assets/calu-logo.png";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Inbox, Users, GitBranch, Zap, Send, Calendar, MessageSquare, BookUser,
  Globe, GraduationCap, CreditCard, BarChart3, Puzzle, Settings,
  HelpCircle, Shield, ChevronLeft, ChevronRight, Phone,
  Palette, Bell, Crown, ArrowLeftRight, Star,
  ArrowLeft, Megaphone, BarChart2, ExternalLink,
  Bot, Activity, Link2, ListTodo, Share2, Clapperboard, Mic, CalendarDays, Webhook, Layout, TrendingUp, FileBarChart, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useClients } from "@/contexts/ClientsContext";
import { supabase } from "@/integrations/supabase/client";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  hideToggle?: boolean;
}

// ── CRM default nav ───────────────────────────────────────────
const crmItems = [
  { to: "/agency", icon: Star, label: "Minha Agência" },
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inbox", icon: Inbox, label: "Inbox", badge: 12 },
  { to: "/whatsapp", icon: MessageSquare, label: "WhatsApp" },
  { to: "/groups",   icon: BookUser,     label: "Grupos" },
  { to: "/contacts", icon: Users,        label: "Contatos" },
  { to: "/pipelines", icon: GitBranch, label: "Pipelines" },
  { to: "/automations", icon: Zap, label: "Automações" },
  { to: "/campaigns", icon: Send, label: "Campanhas" },
  { to: "/scheduling", icon: Calendar, label: "Agendamentos" },
  { to: "/voice", icon: Phone, label: "Voz & Chamadas" },
  { to: "/video-editor", icon: Clapperboard, label: "Editor de Vídeo" },
  { to: "/tomas", icon: Layout, label: "Criador de LPs" },
  { to: "/ben", icon: TrendingUp, label: "Tendências — Ben" },
  { to: "/notebook", icon: BookOpen, label: "Notebook IA" },
  { to: "/sites", icon: Globe, label: "Sites & LPs" },
  { to: "/members", icon: GraduationCap, label: "Membros" },
  { to: "/payments", icon: CreditCard, label: "Pagamentos" },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
  { to: "/integrations", icon: Puzzle, label: "Integrações" },
  { to: "/import-export", icon: ArrowLeftRight, label: "Importar/Exportar" },
];

const adminItems = [
  { to: "/admin", icon: Shield, label: "Super Admin" },
  { to: "/admin?tab=clients", icon: Palette, label: "Clientes WL" },
  { to: "/admin?tab=notifications", icon: Bell, label: "Notificações" },
  { to: "/admin?tab=billing", icon: Crown, label: "Faturamento" },
];

const bottomItems = [
  { to: "/settings", icon: Settings, label: "Configurações" },
  { to: "/help", icon: HelpCircle, label: "Ajuda" },
];

// ── Client workspace tools ────────────────────────────────────
const clientTools = [
  { tab: "",             icon: LayoutDashboard, label: "Visão Geral" },
  { tab: "crm",          icon: Users,           label: "CRM" },
  { tab: "campaigns",    icon: Megaphone,       label: "Campanhas" },
  { tab: "agents",       icon: Bot,             label: "Agentes IA" },
  { tab: "activities",   icon: Activity,        label: "Atividades" },
  { tab: "tasks",        icon: ListTodo,        label: "O que fazer" },
  { tab: "social",      icon: Share2,       label: "Redes Sociais" },
  { tab: "calendario",  icon: CalendarDays, label: "Calendário Editorial" },
  { tab: "integrations", icon: Link2,        label: "Integrações" },
  { tab: "webhooks",     icon: Webhook,      label: "Webhooks" },
  { tab: "time",         icon: Users,        label: "Time do Cliente" },
];

export const AppSidebar = ({ collapsed, onToggle, hideToggle }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const { clients: CLIENTS } = useClients();
  const [openingPortal, setOpeningPortal] = useState(false);

  const openClientPortal = async (clientName: string, clientIndustry: string, clientStatus: string) => {
    if (!user) { toast.error("Você precisa estar logado."); return; }
    setOpeningPortal(true);
    try {
      const { data: existing } = await supabase
        .from("clients")
        .select("portal_token")
        .eq("user_id", user.id)
        .eq("name", clientName)
        .maybeSingle();
      if (existing?.portal_token) {
        window.open(`/portal/${existing.portal_token}`, "_blank");
        return;
      }
      const { data: created, error } = await supabase
        .from("clients")
        .insert({ user_id: user.id, name: clientName, segment: clientIndustry ?? null, status: clientStatus === "Ativo" ? "active" : "onboarding" })
        .select("portal_token")
        .single();
      if (error || !created?.portal_token) { toast.error("Erro ao gerar link do portal."); return; }
      window.open(`/portal/${created.portal_token}`, "_blank");
    } finally {
      setOpeningPortal(false);
    }
  };

  // Detect context
  const clientMatch = location.pathname.match(/^\/agency\/clients\/([^/]+)/);
  const clientId = clientMatch?.[1] ?? null;
  const isAgencyHome = location.pathname === "/agency";
  const isClientWorkspace = !!clientId;

  const client = clientId ? CLIENTS.find((c) => c.id === clientId) : null;
  const currentTab = new URLSearchParams(location.search).get("tab") ?? "";

  // ── Render a standard CRM nav item ─────────────────────────
  const renderNavItem = (item: { to: string; icon: any; label: string; badge?: number }, idx: number) => {
    const isActive =
      item.to.includes("?")
        ? location.pathname + location.search === item.to
        : location.pathname === item.to ||
          (item.to !== "/" && location.pathname.startsWith(item.to) && !item.to.includes("?"));

    return (
      <NavLink
        key={item.to + idx}
        to={item.to}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-muted")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  // ── CLIENT WORKSPACE SIDEBAR ────────────────────────────────
  const renderClientSidebar = () => {
    if (!client) return null;
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="client-sidebar"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.22 }}
          className="flex flex-col h-full"
          style={{}}
        >
          {/* Back button */}
          <button
            onClick={() => navigate("/agency")}
            className="flex items-center gap-2 px-4 py-3 text-xs transition-colors border-b border-sidebar-border"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {!collapsed && <span>Minha Agência</span>}
          </button>

          {/* Client identity */}
          {!collapsed && (
            <div className="px-4 py-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: `${client.color}22`, border: `1px solid ${client.color}40`, color: client.color }}
                >
                  {client.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {client.name}
                  </div>
                  <div className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {client.industry}
                  </div>
                </div>
              </div>
              <div
                className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: client.status === "Ativo" ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
                  color: client.status === "Ativo" ? "#34D399" : "#94A3B8",
                  border: `1px solid ${client.status === "Ativo" ? "rgba(16,185,129,0.25)" : "rgba(100,116,139,0.25)"}`,
                }}
              >
                {client.agentActive && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                )}
                {client.status}
              </div>
            </div>
          )}

          {/* Tool nav */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {[
              ...clientTools,
              { tab: "courses", icon: GraduationCap, label: "Cursos" },
            ].map((tool) => {
              const isActive = currentTab === tool.tab;
              const href = `/agency/clients/${client.id}${tool.tab ? `?tab=${tool.tab}` : ""}`;
              return (
                <NavLink
                  key={tool.tab}
                  to={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative"
                  )}
                  style={{
                    color: isActive ? client.color : "rgba(255,255,255,0.45)",
                    background: isActive ? `${client.color}14` : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="client-sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ background: client.color }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <tool.icon
                    className="h-5 w-5 shrink-0"
                    style={{ color: isActive ? client.color : "rgba(255,255,255,0.3)" }}
                  />
                  {!collapsed && <span className="truncate">{tool.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Portal link */}
          {!collapsed && (
            <div className="border-t border-sidebar-border p-3">
              <button
                onClick={() => openClientPortal(client.name, client.industry, client.status)}
                disabled={openingPortal}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.35)", opacity: openingPortal ? 0.5 : 1 }}
                onMouseEnter={(e) => { if (!openingPortal) e.currentTarget.style.color = client.color; }}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                {openingPortal
                  ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin flex-shrink-0" />
                  : <ExternalLink className="h-4 w-4 flex-shrink-0" />}
                <span className="truncate">Portal do cliente</span>
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  // ── AGENCY HOME SIDEBAR ─────────────────────────────────────
  const renderAgencySidebar = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key="agency-sidebar"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.22 }}
        className="flex flex-col h-full"
      >
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <NavLink
            to="/agency"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
              "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            <motion.div
              layoutId="sidebar-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary"
            />
            <Star className="h-5 w-5 shrink-0 text-sidebar-primary" />
            {!collapsed && <span>Painel da Agência</span>}
          </NavLink>

          {!collapsed && (
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-sidebar-muted">
                Clientes
              </p>
            </div>
          )}

          {CLIENTS.map((c) => (
            <NavLink
              key={c.id}
              to={`/agency/clients/${c.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: `${c.color}22`, color: c.color }}
              >
                {c.initials}
              </div>
              {!collapsed && (
                <span className="truncate text-xs">{c.name}</span>
              )}
              {!collapsed && c.agentActive && (
                <span className="ml-auto relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border py-3 px-2 space-y-0.5">
          {renderNavItem({ to: "/settings", icon: Settings, label: "Configurações" }, 0)}
          {renderNavItem({ to: "/help", icon: HelpCircle, label: "Ajuda" }, 1)}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  // ── DEFAULT CRM SIDEBAR ─────────────────────────────────────
  const renderCrmSidebar = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key="crm-sidebar"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.22 }}
        className="flex flex-col h-full"
      >
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-0.5">
          {crmItems.map((item, idx) => renderNavItem(item, idx))}
          {isAdmin && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-1 px-3">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-sidebar-muted">Super Admin</p>
                </div>
              )}
              {collapsed && <div className="my-2 mx-3 border-t border-sidebar-border" />}
              {adminItems.map((item, idx) => renderNavItem(item, idx))}
            </>
          )}
        </nav>
        <div className="border-t border-sidebar-border py-3 px-2 space-y-0.5">
          {bottomItems.map((item, idx) => renderNavItem(item, idx))}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative flex h-full flex-col bg-sidebar border-r border-sidebar-border overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border flex-shrink-0">
        {isClientWorkspace && client ? (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${client.color}22`, border: `1px solid ${client.color}40` }}
          >
            <span className="text-xs font-bold" style={{ color: client.color }}>{client.initials}</span>
          </div>
        ) : (
          <img src={caluLogo} alt="Calu Agência" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
        )}
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-sm font-bold tracking-tight truncate" style={{ color: "#F0F0F0" }}>
              {isClientWorkspace && client ? client.name : "Calu Agência"}
            </div>
            {!isClientWorkspace && (
              <div className="text-[10px]" style={{ color: "#B9FF4B", opacity: 0.6 }}>Super Admin</div>
            )}
          </motion.div>
        )}
      </div>

      {/* Context-aware nav */}
      <div className="flex-1 overflow-hidden">
        {isClientWorkspace
          ? renderClientSidebar()
          : isAgencyHome
          ? renderAgencySidebar()
          : renderCrmSidebar()}
      </div>

      {/* Collapse toggle (desktop only) */}
      {!hideToggle && (
        <button
          onClick={onToggle}
          className="absolute top-5 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-card text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      )}
    </motion.aside>
  );
};
