import { useLocation, useNavigate } from "react-router-dom";
import { Star, LayoutDashboard, Inbox, Users, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const LIME = "#B9FF4B";

interface MobileBottomNavProps {
  onOpenMenu: () => void;
  inboxBadge?: number;
}

const navItems = [
  { icon: Star,            label: "Agência",   to: "/agency" },
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: Inbox,           label: "Inbox",     to: "/inbox",    badge: true },
  { icon: Users,           label: "Contatos",  to: "/contacts" },
];

export const MobileBottomNav = ({ onOpenMenu, inboxBadge = 0 }: MobileBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "rgba(10,10,16,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="flex items-stretch justify-around"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
      >
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="flex flex-col items-center justify-center gap-1 flex-1 pt-2 pb-1 relative"
            >
              {/* Active indicator pill */}
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full"
                  style={{ background: LIME }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative">
                <item.icon
                  className="h-5 w-5 transition-colors duration-200"
                  style={{ color: active ? LIME : "rgba(255,255,255,0.38)" }}
                />
                {item.badge && inboxBadge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold px-1"
                    style={{ background: "#EF4444", color: "#fff" }}
                  >
                    {inboxBadge > 9 ? "9+" : inboxBadge}
                  </span>
                )}
              </div>

              <span
                className="text-[10px] font-medium transition-colors duration-200"
                style={{ color: active ? LIME : "rgba(255,255,255,0.3)" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center gap-1 flex-1 pt-2 pb-1"
        >
          <MoreHorizontal className="h-5 w-5" style={{ color: "rgba(255,255,255,0.38)" }} />
          <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
};
