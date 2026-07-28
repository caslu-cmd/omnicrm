import caluLogo from "@/assets/calu-logo.png";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Inbox, Users, GitBranch, Zap, Send, Calendar, MessageSquare, BookUser,
  Globe, GraduationCap, CreditCard, BarChart3, Puzzle, Settings,
  HelpCircle, Shield, ChevronLeft, ChevronRight, Phone,
  Palette, Bell, Crown, ArrowLeftRight, Star,
  ArrowLeft, Megaphone, BarChart2, ExternalLink,
  Bot, Activity, Link2, ListTodo, Share2, Clapperboard, Mic, CalendarDays, Webhook, Layout, TrendingUp, FileBarChart, BookOpen,
  ChevronDown, Code2, Filter, FileText, FormInput, Images
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useClients } from "@/contexts/ClientsContext";
import { supabase } from "@/integrations/supabase/client";
import { PIXEL_API } from "@/lib/agentApis";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  hideToggle?: boolean;
}

// ── Menu da agência, agrupado por nível de uso ────────────────
// Antes era uma lista corrida de 25 itens misturando o negócio da agência
// (clientes, dinheiro, conexões) com ferramentas de produção. Agora cada
// grupo responde a uma pergunta: "onde está meu negócio", "com que eu
// produzo", "onde falo com as pessoas", "o que é da casa".
const crmGroups: { titulo: string; itens: { to: string; icon: any; label: string; badge?: number }[] }[] = [
  {
    titulo: "Minha Agência",
    itens: [
      { to: "/agency", icon: Star, label: "Clientes" },
      { to: "/", icon: LayoutDashboard, label: "Painel" },
      { to: "/reports", icon: BarChart3, label: "Relatórios" },
      { to: "/payments", icon: CreditCard, label: "Pagamentos" },
      { to: "/propostas", icon: FileText, label: "Propostas" },
    ],
  },
  {
    titulo: "Atendimento",
    itens: [
      { to: "/inbox", icon: Inbox, label: "Inbox" },
      { to: "/whatsapp", icon: MessageSquare, label: "WhatsApp" },
      { to: "/groups", icon: BookUser, label: "Grupos" },
      { to: "/contacts", icon: Users, label: "Contatos" },
      { to: "/pipelines", icon: GitBranch, label: "Pipelines" },
      { to: "/voice", icon: Phone, label: "Voz & Chamadas" },
    ],
  },
  {
    titulo: "Produção",
    itens: [
      { to: "/campaigns", icon: Send, label: "Campanhas" },
      { to: "/scheduling", icon: Calendar, label: "Agendamentos" },
      { to: "/video-editor", icon: Clapperboard, label: "Editor de Vídeo" },
      { to: "/tomas", icon: Layout, label: "Criador de LPs" },
      { to: "/pages", icon: Globe, label: "Landing Pages" },
      { to: "/forms", icon: FormInput, label: "Formulários" },
      { to: "/wordpress", icon: Globe, label: "WordPress" },
      { to: "/automations", icon: Zap, label: "Automações" },
    ],
  },
  {
    titulo: "Agentes de IA",
    itens: [
      { to: "/ben", icon: TrendingUp, label: "Tendências — Ben" },
      { to: "/fisco", icon: FileBarChart, label: "Contabilidade — Fisco" },
      { to: "/notebook", icon: BookOpen, label: "Notebook IA" },
    ],
  },
  {
    titulo: "Casa",
    itens: [
      { to: "/members", icon: GraduationCap, label: "Membros" },
      { to: "/integrations", icon: Puzzle, label: "Integrações" },
      { to: "/import-export", icon: ArrowLeftRight, label: "Importar/Exportar" },
    ],
  },
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

// ── Ferramentas dentro do cliente, agrupadas pelo que a pessoa vai fazer ──
// `equipe: true` = também aparece para membro convidado do cliente; o resto
// (dinheiro, conexões, agentes) é só da agência.
const clientToolGroups: {
  titulo: string;
  itens: { tab: string; icon: any; label: string; equipe?: boolean }[];
}[] = [
  {
    titulo: "Acompanhar",
    itens: [
      { tab: "",           icon: LayoutDashboard, label: "Visão Geral", equipe: true },
      { tab: "activities", icon: Activity,        label: "Atividades",  equipe: true },
      { tab: "tasks",      icon: ListTodo,        label: "O que fazer", equipe: true },
    ],
  },
  {
    titulo: "Relacionamento",
    itens: [
      { tab: "crm",    icon: Users,        label: "CRM",             equipe: true },
      { tab: "leads",  icon: Filter,       label: "Funil de Leads",  equipe: true },
      { tab: "portal", icon: ExternalLink, label: "Portal do Cliente" },
      { tab: "time",   icon: Users,        label: "Time do Cliente" },
    ],
  },
  {
    titulo: "Conteúdo",
    itens: [
      { tab: "carrossel",  icon: Images,       label: "Carrossel & Posts",    equipe: true },
      { tab: "calendario", icon: CalendarDays, label: "Calendário Editorial", equipe: true },
      { tab: "social",     icon: Share2,       label: "Redes Sociais" },
      { tab: "campaigns",  icon: Megaphone,    label: "Campanhas" },
      { tab: "brand",      icon: Palette,      label: "Identidade Visual",    equipe: true },
    ],
  },
  {
    titulo: "Produção",
    itens: [
      { tab: "teo",          icon: Code2,  label: "Site — Teo" },
      { tab: "agents",       icon: Bot,    label: "Agentes IA" },
      { tab: "sales-agents", icon: Zap,    label: "Agentes Autônomos" },
      { tab: "agent-links",  icon: Share2, label: "Links Compartilhados" },
    ],
  },
  {
    titulo: "Configuração",
    itens: [
      { tab: "integrations", icon: Link2,   label: "Integrações" },
      { tab: "webhooks",     icon: Webhook, label: "Webhooks" },
    ],
  },
];

interface WPSite { id: string; name: string; url: string; client_name?: string; }

export const AppSidebar = ({ collapsed, onToggle, hideToggle }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const { clients: CLIENTS } = useClients();
  const [openingPortal, setOpeningPortal] = useState(false);
  const [wpSites, setWpSites] = useState<WPSite[]>([
    { id: "grupo-licita", name: "Grupo Licita", url: "http://grupolicita.com.br", client_name: "Grupo Licita" }
  ]);

  useEffect(() => {
    // Sem o Pixel publicado, fica a lista padrão em vez de bater num endereço
    // que só existe na máquina da agência.
    if (!PIXEL_API) return;
    fetch(`${PIXEL_API}/api/sites`)
      .then(r => r.json())
      .then(data => setWpSites(data))
      .catch(() => {});
  }, []);

  const openClientPortal = async (clientName: string, clientIndustry: string, clientStatus: string) => {
    if (!user) { toast.error("Você precisa estar logado."); return; }
    setOpeningPortal(true);
    const clientMatch2 = location.pathname.match(/^\/agency\/clients\/([^/]+)/);
    const wsId = clientMatch2?.[1] ?? null;
    try {
      const { data: existing } = await (supabase as any)
        .from("clients")
        .select("portal_token, workspace_id")
        .eq("user_id", user.id)
        .eq("name", clientName)
        .maybeSingle();
      if (existing?.portal_token) {
        if (!existing.workspace_id && wsId) {
          await (supabase as any).from("clients").update({ workspace_id: wsId }).eq("user_id", user.id).eq("name", clientName);
        }
        window.open(`/portal/${existing.portal_token}`, "_blank");
        return;
      }
      const { data: created, error } = await (supabase as any)
        .from("clients")
        .insert({ user_id: user.id, name: clientName, segment: clientIndustry ?? null, status: clientStatus === "Ativo" ? "active" : "onboarding", workspace_id: wsId } as any)
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
            {clientToolGroups.flatMap((grupo, gi) => [
              !collapsed ? (
                <div key={`t-${grupo.titulo}`} className={cn("px-3 pb-1", gi === 0 ? "" : "pt-3")}>
                  <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {grupo.titulo}
                  </p>
                </div>
              ) : gi > 0 ? (
                <div key={`t-${grupo.titulo}`} className="my-2 mx-3 border-t border-sidebar-border" />
              ) : null,
              ...grupo.itens,
            ]).concat(
              client.name.toLowerCase().includes("licita")
                ? [{ tab: "courses", icon: GraduationCap, label: "Cursos" }]
                : [],
              wpSites.find(s => s.client_name?.toLowerCase() === client.name.toLowerCase())
                ? [{ tab: "pixel", icon: Globe, label: "Pixel — WordPress" }]
                : [],
            ).map((tool: any) => {
              // separadores de grupo já vêm prontos como elemento
              if (!tool || !("tab" in tool)) return tool;
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
          {crmGroups.map((grupo, gi) => (
            <div key={grupo.titulo} className={gi === 0 ? "" : "pt-3"}>
              {!collapsed && (
                <div className="pb-1 px-3">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-sidebar-muted">{grupo.titulo}</p>
                </div>
              )}
              {collapsed && gi > 0 && <div className="my-2 mx-3 border-t border-sidebar-border" />}
              <div className="space-y-0.5">
                {grupo.itens.map((item, idx) => renderNavItem(item, gi * 100 + idx))}
              </div>
            </div>
          ))}

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
