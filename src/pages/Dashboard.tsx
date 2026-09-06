import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, Users, GitBranch, Bot, Mail, Calendar, Clock, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dashboard — tudo aqui vem do banco.
 *
 * Não existe número de exemplo nesta página. Bloco sem dado mostra o que
 * fazer para ele existir, porque dashboard que inventa número é pior que
 * dashboard vazio: some com a diferença entre "não aconteceu" e "não medi".
 */

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const colorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent-foreground",
};

const brl = (n: number) =>
  n >= 1000 ? `R$ ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `R$ ${n.toFixed(0)}`;

const desde = (iso: string) => {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ontem" : `${d} dias`;
};

const iniciais = (nome: string) =>
  (nome || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

type Stat = { label: string; value: string; nota: string; icon: typeof Users; color: string; rota: string };
type Atividade = { id: string; texto: string; quando: string; avatar: string; rota: string };
type Deal = { id: string; name: string; company: string | null; stage: string; value: number; dias: number | null };
type Evento = { id: string; title: string; event_date: string; event_time: string | null };

const Vazio = ({ texto }: { texto: string }) => (
  <p className="text-sm text-muted-foreground py-6 text-center">{texto}</p>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);
  const [atividade, setAtividade] = useState<Atividade[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    const db = supabase as any;
    const trintaDias = new Date(Date.now() - 30 * 864e5).toISOString();
    const hoje = new Date().toISOString().slice(0, 10);

    (async () => {
      const [contatos, novos, conversas, negocios, execucoes, ativ, agenda] = await Promise.all([
        db.from("contacts").select("id", { count: "exact", head: true }),
        db.from("contacts").select("id", { count: "exact", head: true }).gte("created_at", trintaDias),
        db.from("inbox_conversations").select("unread").gt("unread", 0),
        db.from("deals").select("id,name,company,stage,value,days_in_stage").order("value", { ascending: false }),
        db.from("orchestration_runs").select("status").gte("created_at", trintaDias),
        db.from("contact_activities").select("id,type,content,created_at,contacts(name)").order("created_at", { ascending: false }).limit(6),
        db.from("client_calendar_events").select("id,title,event_date,event_time").gte("event_date", hoje).order("event_date").limit(3),
      ]);

      const listaDeals: Deal[] = (negocios.data ?? []).map((d: any) => ({
        id: d.id, name: d.name, company: d.company, stage: d.stage,
        value: Number(d.value) || 0, dias: d.days_in_stage,
      }));
      const totalPipeline = listaDeals.reduce((s, d) => s + d.value, 0);
      const naoLidas = (conversas.data ?? []).reduce((s: number, c: any) => s + (c.unread || 0), 0);
      const runs = execucoes.data ?? [];
      const concluidas = runs.filter((r: any) => r.status === "done").length;

      setStats([
        {
          label: "Mensagens não lidas", value: String(naoLidas),
          nota: `${(conversas.data ?? []).length} conversa(s) esperando`,
          icon: MessageSquare, color: "primary", rota: "/inbox",
        },
        {
          label: "Contatos", value: String(contatos.count ?? 0),
          nota: `${novos.count ?? 0} nos últimos 30 dias`,
          icon: Users, color: "secondary", rota: "/contacts",
        },
        {
          label: "Valor no pipeline", value: totalPipeline ? brl(totalPipeline) : "R$ 0",
          nota: `${listaDeals.length} negócio(s) aberto(s)`,
          icon: GitBranch, color: "primary", rota: "/pipelines",
        },
        {
          label: "Produções do time", value: String(runs.length),
          nota: `${concluidas} concluída(s) em 30 dias`,
          icon: Bot, color: "accent", rota: "/agency",
        },
      ]);

      setAtividade((ativ.data ?? []).map((a: any) => ({
        id: a.id,
        texto: `${a.contacts?.name ? a.contacts.name + ": " : ""}${a.content || a.type}`,
        quando: desde(a.created_at),
        avatar: iniciais(a.contacts?.name || a.type),
        rota: "/contacts",
      })));
      setDeals(listaDeals.slice(0, 3));
      setEventos((agenda.data ?? []) as Evento[]);
      setCarregando(false);
    })();
  }, []);

  const ctaActions: Record<string, () => void> = {
    "Novo contato": () => navigate("/contacts"),
    "Nova automação": () => navigate("/automations"),
    "Nova campanha": () => navigate("/campaigns"),
  };

  const dataDeHoje = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6 min-w-0 break-words">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da operação — {dataDeHoje}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(carregando ? [] : stats).map((s) => (
          <motion.div key={s.label} variants={item} onClick={() => navigate(s.rota)}
            className="rounded-xl bg-card border border-border p-5 shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[s.color]}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{s.nota}</p>
          </motion.div>
        ))}
        {carregando && [0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-5 h-[132px] animate-pulse" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 rounded-xl bg-card border border-border p-5 shadow-card">
          <h2 className="text-base font-semibold font-display text-foreground mb-4">Atividade recente</h2>
          <div className="space-y-3">
            {!carregando && atividade.length === 0 && (
              <Vazio texto="Nenhuma interação registrada ainda. Toda conversa e nota lançada em um contato aparece aqui." />
            )}
            {atividade.map((a) => (
              <div key={a.id} onClick={() => navigate(a.rota)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {a.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{a.texto}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {a.quando}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={item} className="rounded-xl bg-card border border-border p-5 shadow-card">
            <h2 className="text-base font-semibold font-display text-foreground mb-4">Maiores negócios</h2>
            <div className="space-y-3">
              {!carregando && deals.length === 0 && (
                <Vazio texto="Nenhum negócio no pipeline. Crie o primeiro em Pipelines." />
              )}
              {deals.map((d) => (
                <div key={d.id} onClick={() => navigate("/pipelines")}
                  className="flex items-center justify-between flex-wrap gap-4 p-3 rounded-lg bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[d.company, d.stage].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{brl(d.value)}</p>
                    {d.dias != null && (
                      <p className="text-[10px] text-muted-foreground mt-1">{d.dias} dia(s) na etapa</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="rounded-xl bg-card border border-border p-5 shadow-card">
            <h2 className="text-base font-semibold font-display text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Próximos compromissos
            </h2>
            <div className="space-y-2.5">
              {!carregando && eventos.length === 0 && (
                <Vazio texto="Agenda vazia. Eventos criados no workspace do cliente aparecem aqui." />
              )}
              {eventos.map((e) => (
                <div key={e.id} onClick={() => navigate("/scheduling")}
                  className="flex items-center justify-between flex-wrap gap-4 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.title}</p>
                    {e.event_time && <p className="text-xs text-muted-foreground">{e.event_time}</p>}
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {new Date(e.event_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Novo contato", desc: "Criar contato e colocar no pipeline", color: "primary" },
          { icon: Zap, label: "Nova automação", desc: "Escolher modelo ou criar do zero", color: "secondary" },
          { icon: Mail, label: "Nova campanha", desc: "Enviar por e-mail ou WhatsApp", color: "accent" },
        ].map((cta) => (
          <button key={cta.label} onClick={() => ctaActions[cta.label]()}
            className="flex items-center gap-4 rounded-xl bg-card border border-border p-5 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all text-left group">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[cta.color]} group-hover:scale-105 transition-transform`}>
              <cta.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{cta.label}</p>
              <p className="text-xs text-muted-foreground">{cta.desc}</p>
            </div>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
