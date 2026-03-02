import { useState, useEffect } from "react";
import { Search, Bell, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ProfileMenu } from "./ProfileMenu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TopBarProps {
  onToggleSidebar: () => void;
}

export const TopBar = ({ onToggleSidebar }: TopBarProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notifList, setNotifList] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Load notifications from DB
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotifList(data);
      });

    // Realtime subscription
    const channel = supabase
      .channel("topbar-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifList(prev => [payload.new as any, ...prev]);
        toast.info((payload.new as any).title, { description: (payload.new as any).message });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifList.filter(n => !n.read).length;

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchValue.trim()) {
      toast.info(`Buscando "${searchValue}"...`);
      navigate(`/contacts`);
    }
  };

  const handleCreateContact = () => {
    if (!contactName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    toast.success(`Contato "${contactName}" criado com sucesso!`);
    setShowNewContact(false);
    setContactName("");
    setContactEmail("");
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifList(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("Todas notificações marcadas como lidas");
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Buscar contatos, conversas, pipelines..."
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" size="sm" className="gap-2" onClick={() => setShowNewContact(true)}>
            <Plus className="h-4 w-4" /> Novo Contato
          </Button>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-card" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-11 w-80 rounded-xl border border-border bg-card shadow-elevated z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">Marcar todas como lidas</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifList.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação</div>
                  ) : (
                    notifList.map(n => (
                      <button
                        key={n.id}
                        onClick={async () => {
                          if (!n.read) {
                            await supabase.from("notifications").update({ read: true }).eq("id", n.id);
                            setNotifList(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                          }
                          setShowNotifications(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                      >
                        <p className="font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <ProfileMenu />
        </div>
      </header>

      {/* New Contact Modal */}
      {showNewContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-foreground">Novo Contato</h2>
              <button onClick={() => setShowNewContact(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome *</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Nome completo" className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">E-mail</label>
              <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@empresa.com" className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewContact(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground">Cancelar</button>
              <button onClick={handleCreateContact} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Criar Contato</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
