import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Clock, Video, MapPin,
  User, ExternalLink, Settings2, Copy, Bell, X, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Event {
  id: number;
  title: string;
  time: string;
  duration: string;
  type: "meeting" | "call" | "demo";
  contact: string;
  avatar: string;
  location: string;
  day: number;
}

const initialEvents: Event[] = [
  { id: 1, title: "Demo OmniCRM", time: "09:00", duration: "30min", type: "demo", contact: "Maria Silva", avatar: "MS", location: "Zoom", day: 1 },
  { id: 2, title: "Follow-up Tech Corp", time: "10:30", duration: "15min", type: "call", contact: "João Pereira", avatar: "JP", location: "Telefone", day: 1 },
  { id: 3, title: "Onboarding Mega SA", time: "14:00", duration: "1h", type: "meeting", contact: "Carlos Mendes", avatar: "CM", location: "Google Meet", day: 1 },
  { id: 4, title: "Estratégia Q2", time: "16:00", duration: "45min", type: "meeting", contact: "Equipe Interna", avatar: "EI", location: "Sala 3", day: 2 },
  { id: 5, title: "Demo Plano Pro", time: "11:00", duration: "30min", type: "demo", contact: "Ana Costa", avatar: "AC", location: "Zoom", day: 3 },
  { id: 6, title: "Review Pipeline", time: "09:30", duration: "30min", type: "meeting", contact: "Equipe Vendas", avatar: "EV", location: "Slack Huddle", day: 4 },
  { id: 7, title: "Kick-off Innovation", time: "15:00", duration: "1h", type: "meeting", contact: "Innovation Ltd", avatar: "IL", location: "Google Meet", day: 5 },
];

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const dates = [1, 2, 3, 4, 5];

const typeColors: Record<string, string> = {
  meeting: "border-l-primary bg-primary/5",
  call: "border-l-secondary bg-secondary/5",
  demo: "border-l-accent bg-accent/5",
};

const initialBookingLinks = [
  { name: "Demo 30min", url: "book.omnicrm.app/demo-30", slots: 12 },
  { name: "Consultoria 1h", url: "book.omnicrm.app/consultoria", slots: 8 },
  { name: "Quick Call 15min", url: "book.omnicrm.app/quick", slots: 20 },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const SchedulingPage = () => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [events, setEvents] = useState(initialEvents);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [calConnected, setCalConnected] = useState([true, false]);

  const todayEvents = events.filter(e => e.day === selectedDay);

  const handleCreateEvent = () => {
    if (!newTitle.trim()) { toast.error("Título é obrigatório"); return; }
    const newEvent: Event = { id: Date.now(), title: newTitle, time: newTime, duration: "30min", type: "meeting", contact: "Novo", avatar: "N", location: "Google Meet", day: selectedDay };
    setEvents(prev => [...prev, newEvent]);
    setShowNewEvent(false);
    setNewTitle("");
    toast.success(`Evento "${newTitle}" criado!`);
  };

  const handleDeleteEvent = (id: number) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Evento removido");
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6">
      <motion.div variants={item} className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Agendamentos</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Março 2026 · {events.length} eventos esta semana</p>
        </div>
        <button onClick={() => setShowNewEvent(true)} className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Novo Evento</span>
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <motion.div variants={item} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => toast.info("Semana anterior")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ChevronLeft className="h-5 w-5" /></button>
              <h2 className="text-base font-semibold font-display text-foreground">1 — 5 Março, 2026</h2>
              <button onClick={() => toast.info("Próxima semana")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <button onClick={() => setSelectedDay(1)} className="px-3 py-1.5 rounded-lg bg-muted text-sm font-medium text-muted-foreground hover:text-foreground">Hoje</button>
          </motion.div>

          <motion.div variants={item} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="grid grid-cols-5 border-b border-border">
              {weekDays.map((d, i) => (
                <button key={d} onClick={() => setSelectedDay(dates[i])} className={cn("py-3 text-center border-r last:border-r-0 border-border transition-colors", selectedDay === dates[i] ? "bg-primary/5" : "hover:bg-muted/50")}>
                  <p className="text-xs text-muted-foreground">{d}</p>
                  <p className={cn("text-lg font-bold font-display mt-0.5", selectedDay === dates[i] ? "text-primary" : "text-foreground")}>{dates[i]}</p>
                  {events.filter(e => e.day === dates[i]).length > 0 && (
                    <div className="flex justify-center gap-1 mt-1">{events.filter(e => e.day === dates[i]).map(e => (<div key={e.id} className="h-1.5 w-1.5 rounded-full bg-primary" />))}</div>
                  )}
                </button>
              ))}
            </div>
            <div className="p-4 space-y-2 min-h-[300px]">
              {todayEvents.length > 0 ? todayEvents.map(e => (
                <div key={e.id} className={cn("flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg border-l-4 min-w-0", typeColors[e.type])}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">{e.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground break-words">{e.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {e.time} · {e.duration}</span>
                      <span className="flex items-center gap-1 min-w-0"><User className="h-3 w-3 shrink-0" /> <span className="truncate">{e.contact}</span></span>
                      <span className="flex items-center gap-1 min-w-0"><MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{e.location}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toast.info(`Abrindo ${e.location}...`)} className="p-2 rounded-lg hover:bg-muted text-primary"><Video className="h-4 w-4" /></button>
                    <button onClick={() => toast.success(`Lembrete definido para ${e.title}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hidden sm:inline-flex"><Bell className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteEvent(e.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-5">
          <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><ExternalLink className="h-4 w-4 text-primary" /> Links de Booking</h3>
            {initialBookingLinks.map(l => (
              <div key={l.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div><p className="text-sm font-medium text-foreground">{l.name}</p><p className="text-[11px] text-primary">{l.url}</p></div>
                <div className="flex gap-1">
                  <button onClick={() => { navigator.clipboard.writeText(l.url); toast.success("Link copiado!"); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Copy className="h-3.5 w-3.5" /></button>
                  <button onClick={() => toast.info(`Configurando ${l.name}`)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Settings2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <button onClick={() => toast.info("Criando novo link de booking...")} className="w-full py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary">+ Novo Link</button>
          </motion.div>

          <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Disponibilidade</h3>
            {["Seg-Sex", "Sáb"].map(d => (
              <div key={d} className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{d}</span><span className="font-medium text-foreground">{d === "Sáb" ? "Indisponível" : "09:00 — 18:00"}</span></div>
            ))}
            <button onClick={() => toast.info("Abrindo editor de disponibilidade")} className="text-xs text-primary font-medium hover:underline">Editar regras</button>
          </motion.div>

          <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Calendários Conectados</h3>
            {["Google Calendar", "Outlook"].map((c, i) => (
              <div key={c} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-sm text-foreground">{c}</span>
                <button onClick={() => { setCalConnected(prev => prev.map((v, j) => j === i ? !v : v)); toast.success(calConnected[i] ? `${c} desconectado` : `${c} conectado!`); }} className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full cursor-pointer", calConnected[i] ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary")}>
                  {calConnected[i] ? "Conectado" : "Conectar"}
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {showNewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold font-display text-foreground">Novo Evento</h2><button onClick={() => setShowNewEvent(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button></div>
            <div><label className="text-xs font-medium text-muted-foreground">Título *</label><input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Horário</label><input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewEvent(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={handleCreateEvent} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Criar</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SchedulingPage;
