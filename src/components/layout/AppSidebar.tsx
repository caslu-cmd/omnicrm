import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Inbox, Users, GitBranch, Zap, Send, Calendar,
  Globe, GraduationCap, CreditCard, BarChart3, Puzzle, Settings,
  HelpCircle, Shield, ChevronLeft, ChevronRight, Sparkles, Phone,
  Palette, Bell, Crown, ArrowLeftRight, Star
} from "lucide-react";
import { motion } from "framer-motion";
import { useIsAdmin } from "@/hooks/useAdmin";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: "/agency", icon: Star, label: "Minha Agência" },
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inbox", icon: Inbox, label: "Inbox", badge: 12 },
  { to: "/contacts", icon: Users, label: "Contatos" },
  { to: "/pipelines", icon: GitBranch, label: "Pipelines" },
  { to: "/automations", icon: Zap, label: "Automações" },
  { to: "/campaigns", icon: Send, label: "Campanhas" },
  { to: "/scheduling", icon: Calendar, label: "Agendamentos" },
  { to: "/voice", icon: Phone, label: "Voz & Chamadas" },
  { to: "/sites", icon: Globe, label: "Sites & LPs" },
  { to: "/members", icon: GraduationCap, label: "Membros" },
  { to: "/payments", icon: CreditCard, label: "Pagamentos" },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
  { to: "/integrations", icon: Puzzle, label: "Integrações" },
  { to: "/import-export", icon: ArrowLeftRight, label: "Importar/Exportar" },
];

const adminItems = [
  { to: "/admin", icon: Shield, label: "Super Admin", section: true },
  { to: "/admin?tab=clients", icon: Palette, label: "Clientes WL" },
  { to: "/admin?tab=notifications", icon: Bell, label: "Notificações" },
  { to: "/admin?tab=billing", icon: Crown, label: "Faturamento" },
];

const bottomItems = [
  { to: "/settings", icon: Settings, label: "Configurações" },
  { to: "/help", icon: HelpCircle, label: "Ajuda" },
];

export const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const location = useLocation();
  const { isAdmin } = useIsAdmin();

  const renderNavItem = (item: { to: string; icon: any; label: string; badge?: number; section?: boolean }, idx: number) => {
    const isActive = item.to.includes("?")
      ? location.pathname + location.search === item.to
      : location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to) && !item.to.includes("?"));

    return (
      <NavLink
        key={item.to + idx}
        to={item.to}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative group",
          item.section && "mt-1",
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
        {!collapsed && (item as any).badge && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
            {(item as any).badge}
          </span>
        )}
        {collapsed && (item as any).badge && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-pulse-badge">
            {(item as any).badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative flex h-full flex-col bg-sidebar border-r border-sidebar-border overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-bold font-display text-sidebar-accent-foreground tracking-tight"
          >
            OmniCRM
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-0.5">
        {navItems.map((item, idx) => renderNavItem(item, idx))}

        {/* Admin section */}
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

      {/* Bottom */}
      <div className="border-t border-sidebar-border py-3 px-2 space-y-0.5">
        {bottomItems.map((item, idx) => renderNavItem(item, idx))}
      </div>

      {/* Collapse button */}
      <button
        onClick={onToggle}
        className="absolute top-5 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-card text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </motion.aside>
  );
};
