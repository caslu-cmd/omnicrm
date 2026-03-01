import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Clock, Video, MapPin,
  User, ExternalLink, Settings2, Copy, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const events: Event[] = [
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
const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const typeColors: Record<string, string> = {
  meeting: "border-l-primary bg-primary/5",
  call: "border-l-secondary bg-secondary/5",
  demo: "border-l-accent bg-accent/5",
};

const bookingLinks = [
  { name: "Demo 30min", url: "book.omnicrm.app/demo-30", slots: 12 },
  { name: "Consultoria 1h", url: "book.omnicrm.app/consultoria", slots: 8 },
  { name: "Quick Call 15min", url: "book.omnicrm.app/quick", slots: 20 },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const SchedulingPage = () => {
  const [selectedDay, setSelectedDay] = useState(1);

  const todayEvents = events.filter(e => e.day === selectedDay);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Agendamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Março 2026 · {events.length} eventos esta semana</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Novo Evento
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 space-y-4">
          {/* Week header */}
          <motion.div variants={item} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ChevronLeft className="h-5 w-5" /></button>
              <h2 className="text-base font-semibold font-display text-foreground">1 — 5 Março, 2026</h2>
              <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-muted text-sm font-medium text-muted-foreground hover:text-foreground">Hoje</button>
          </motion.div>

          {/* Week grid */}
          <motion.div variants={item} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-5 border-b border-border">
              {weekDays.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(dates[i])}
                  className={cn(
                    "py-3 text-center border-r last:border-r-0 border-border transition-colors",
                    selectedDay === dates[i] ? "bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  <p className="text-xs text-muted-foreground">{d}</p>
                  <p className={cn("text-lg font-bold font-display mt-0.5", selectedDay === dates[i] ? "text-primary" : "text-foreground")}>
                    {dates[i]}
                  </p>
                  {events.filter(e => e.day === dates[i]).length > 0 && (
                    <div className="flex justify-center gap-1 mt-1">
                      {events.filter(e => e.day === dates[i]).map(e => (
                        <div key={e.id} className="h-1.5 w-1.5 rounded-full bg-primary" />
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Events for selected day */}
            <div className="p-4 space-y-2 min-h-[300px]">
              {todayEvents.length > 0 ? todayEvents.map(e => (
                <div key={e.id} className={cn("flex items-center gap-4 p-4 rounded-lg border-l-4", typeColors[e.type])}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                    {e.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">{e.title}</h4>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {e.time} · {e.duration}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {e.contact}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-muted text-primary"><Video className="h-4 w-4" /></button>
                    <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Bell className="h-4 w-4" /></button>
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

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Booking Links */}
          <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-primary" /> Links de Booking
            </h3>
            {bookingLinks.map(l => (
              <div key={l.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{l.name}</p>
                  <p className="text-[11px] text-primary">{l.url}</p>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Copy className="h-3.5 w-3.5" /></button>
                  <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Settings2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <button className="w-full py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary">
              + Novo Link
            </button>
          </motion.div>

          {/* Availability */}
          <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Disponibilidade
            </h3>
            {["Seg-Sex", "Sáb"].map(d => (
              <div key={d} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{d}</span>
                <span className="font-medium text-foreground">{d === "Sáb" ? "Indisponível" : "09:00 — 18:00"}</span>
              </div>
            ))}
            <button className="text-xs text-primary font-medium hover:underline">Editar regras</button>
          </motion.div>

          {/* Connected Calendars */}
          <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Calendários Conectados</h3>
            {["Google Calendar", "Outlook"].map((c, i) => (
              <div key={c} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-sm text-foreground">{c}</span>
                <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", i === 0 ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground")}>
                  {i === 0 ? "Conectado" : "Desconectado"}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SchedulingPage;
