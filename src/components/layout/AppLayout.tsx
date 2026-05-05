import { useState, useEffect } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const FrozenOutlet = () => {
  const outlet = useOutlet();
  return <>{outlet}</>;
};

const FULL_SCREEN_PATHS = ["/conta-report", "/conta-colaborador"];

export const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  if (FULL_SCREEN_PATHS.includes(location.pathname)) {
    return <main className="h-screen overflow-auto bg-gray-950"><FrozenOutlet /></main>;
  }

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile navigation drawer */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 bg-sidebar border-r border-sidebar-border [&>button]:text-white/40 [&>button]:hover:text-white/70 [&>button]:top-3 [&>button]:right-3"
        >
          <SheetTitle className="sr-only">Navegação</SheetTitle>
          <AppSidebar
            collapsed={false}
            onToggle={() => setMobileSidebarOpen(false)}
            hideToggle
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar (hidden on mobile) */}
      <div className="hidden md:flex">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        {/* Main content — extra bottom padding on mobile so bottom nav doesn't obscure content */}
        <main className="flex-1 overflow-auto scrollbar-thin pb-16 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              className="h-full"
            >
              <FrozenOutlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav
        onOpenMenu={() => setMobileSidebarOpen(true)}
        inboxBadge={12}
      />
    </div>
  );
};
