import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, GitBranch, Bot, Send, AlertCircle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

/**
 * Relatórios — só o que o banco sabe responder.
 *
 * Esta página mostrava receita, entregabilidade e taxa de conversão que não
 * saíam de lugar nenhum. Relatório inventado é pior que relatório vazio:
 * some com a diferença entre "não aconteceu" e "ninguém mediu".
 *
 * Paleta categórica validada (scripts/validate_palette.js do skill dataviz):
 * passa nas seis checagens em claro e escuro, com ΔE 18 no pior par adjacente.
 * A ordem é fixa. Nunca cicle as cores nem reordene por ranking.
 */
const CAT = ["#17a185", "#6d28d9", "#b45309", "#0b7399"];
const EIXO = "hsl(220, 9%, 46%)";

type Ponto = { rotulo: string; valor: number };
type Fatia = { nome: string; valor: number; cor: string };

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const brl = (n: number) => n >= 1000 ? `R$ ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `R$ ${n.toFixed(0)}`;

const caixaTooltip = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

const Kpi = ({ icon: Icon, valor, label, nota }: { icon: typeof Users; valor: string; label: string; nota: string }) => (
  <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
    className="rounded-xl bg-card border border-border p-5 shadow-card">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-2xl font-bold font-display text-foreground">{valor}</p>
    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    <p className="text-xs text-muted-foreground/70 mt-1">{nota}</p>
  </motion.div>
);

const Painel = ({ titulo, sub, vazio, children }: { titulo: string; sub?: string; vazio: boolean; children: React.ReactNode }) => (
  <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
    className="rounded-xl bg-card border border-border p-5 shadow-card">
    <h2 className="text-base font-semibold font-display text-foreground">{titulo}</h2>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    <div className="mt-4">
      {vazio ? <p className="text-sm text-muted-foreground py-12 text-center">Sem dado no período.</p> : children}
    </div>
  </motion.div>
);

const ReportsPage = () => {
  const [carregando, setCarregando] = useState(true);
  const [porMes, setPorMes] = useState<Ponto[]>([]);
  const [porCanal, setPorCanal] = useState<Fatia[]>([]);
  const [porEtapa, setPorEtapa] = useState<{ rotulo: string; valor: number; total: number }[]>([]);
  const [porStatus, setPorStatus] = useState<Ponto[]>([]);
  const [kpis, setKpis] = useState<{ icon: typeof Users; valor: string; label: string; nota: string }[]>([]);

  useEffect(() => {
    const db = supabase as any;
    const trinta = new Date(Date.now() - 30 * 864e5).toISOString();

    (async () => {
      const [contatos, negocios, runs, posts] = await Promise.all([
        db.from("contacts").select("created_at,channel").limit(5000),
        db.from("deals").select("stage,value"),
        db.from("orchestration_runs").select("status,created_at"),
        db.from("scheduled_posts").select("status,scheduled_at").gte("scheduled_at", trinta),
      ]);

      const listaContatos = contatos.data ?? [];
      const listaNegocios = negocios.data ?? [];
      const listaRuns = runs.data ?? [];
      const listaPosts = posts.data ?? [];

      // Contatos por mês, últimos 6 meses fechados mais o atual
      const balde = new Map<string, number>();
      const agora = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        balde.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
      }
      listaContatos.forEach((c: any) => {
        if (!c.created_at) return;
        const d = new Date(c.created_at);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        if (balde.has(k)) balde.set(k, (balde.get(k) || 0) + 1);
      });
      setPorMes([...balde.entries()].map(([k, v]) => ({ rotulo: MESES[Number(k.split("-")[1])], valor: v })));

      // Contatos por canal
      const canais = new Map<string, number>();
      listaContatos.forEach((c: any) => {
        const nome = (c.channel || "Sem canal").trim();
        canais.set(nome, (canais.get(nome) || 0) + 1);
      });
      setPorCanal([...canais.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([nome, valor], i) => ({ nome, valor, cor: CAT[i] })));

      // Negócios por etapa
      const etapas = new Map<string, { n: number; total: number }>();
      listaNegocios.forEach((d: any) => {
        const e = d.stage || "sem etapa";
        const at = etapas.get(e) || { n: 0, total: 0 };
        etapas.set(e, { n: at.n + 1, total: at.total + (Number(d.value) || 0) });
      });
      setPorEtapa([...etapas.entries()].map(([rotulo, v]) => ({ rotulo, valor: v.n, total: v.total })));

      // Produções do time por status
      const status = new Map<string, number>();
      listaRuns.forEach((r: any) => status.set(r.status || "sem status", (status.get(r.status || "sem status") || 0) + 1));
      setPorStatus([...status.entries()].map(([rotulo, valor]) => ({ rotulo, valor })));

      const novos = listaContatos.filter((c: any) => c.created_at && c.created_at >= trinta).length;
      const valorTotal = listaNegocios.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
      const runs30 = listaRuns.filter((r: any) => r.created_at >= trinta).length;
      const publicados = listaPosts.filter((p: any) => p.status === "published").length;

      setKpis([
        { icon: Users, valor: String(listaContatos.length), label: "Contatos", nota: `${novos} nos últimos 30 dias` },
        { icon: GitBranch, valor: valorTotal ? brl(valorTotal) : "R$ 0", label: "Valor no pipeline", nota: `${listaNegocios.length} negócio(s)` },
        { icon: Bot, valor: String(runs30), label: "Produções do time", nota: "nos últimos 30 dias" },
        { icon: Send, valor: String(listaPosts.length), label: "Posts agendados", nota: `${publicados} já publicado(s)` },
      ]);
      setCarregando(false);
    })();
  }, []);

  return (
    <motion.div initial="hidden" animate="show"
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
      className="p-3 md:p-6 space-y-6 min-w-0 break-words">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">O que o banco sabe responder hoje. Nada aqui é estimado.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {carregando
          ? [0, 1, 2, 3].map((i) => <div key={i} className="rounded-xl bg-card border border-border p-5 h-[140px] animate-pulse" />)
          : kpis.map((k) => <Kpi key={k.label} {...k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Painel titulo="Contatos por mês" sub="Últimos 6 meses" vazio={!carregando && porMes.every((p) => p.valor === 0)}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={porMes} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gradContatos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CAT[0]} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={CAT[0]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="rotulo" stroke={EIXO} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={EIXO} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={caixaTooltip} formatter={(v: number) => [`${v} contato(s)`, ""]} />
              <Area type="monotone" dataKey="valor" stroke={CAT[0]} strokeWidth={2} fill="url(#gradContatos)" />
            </AreaChart>
          </ResponsiveContainer>
        </Painel>

        <Painel titulo="Negócios por etapa" sub="Quantidade e valor em cada etapa do funil" vazio={!carregando && porEtapa.length === 0}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porEtapa} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" stroke={EIXO} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="rotulo" stroke={EIXO} fontSize={11} width={92} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={caixaTooltip}
                formatter={(v: number, _n, p: any) => [`${v} negócio(s) · ${brl(p.payload.total)}`, ""]} />
              <Bar dataKey="valor" fill={CAT[3]} radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList dataKey="valor" position="right" fontSize={11} fill="hsl(var(--muted-foreground))" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Painel>

        <Painel titulo="Contatos por canal" sub="De onde as pessoas chegam" vazio={!carregando && porCanal.length === 0}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={200} className="!w-full sm:!w-1/2">
              <PieChart>
                <Pie data={porCanal} cx="50%" cy="50%" innerRadius={52} outerRadius={78} dataKey="valor" paddingAngle={3} stroke="hsl(var(--card))" strokeWidth={2}>
                  {porCanal.map((f) => <Cell key={f.nome} fill={f.cor} />)}
                </Pie>
                <Tooltip contentStyle={caixaTooltip} formatter={(v: number, n) => [`${v} contato(s)`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full sm:w-1/2 space-y-2">
              {porCanal.map((f) => (
                <div key={f.nome} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-foreground min-w-0">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: f.cor }} />
                    <span className="truncate">{f.nome}</span>
                  </span>
                  <span className="text-sm font-semibold text-foreground shrink-0">{f.valor}</span>
                </div>
              ))}
            </div>
          </div>
        </Painel>

        <Painel titulo="Produções do time" sub="Execuções do pipeline de agentes, por status" vazio={!carregando && porStatus.length === 0}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porStatus} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" stroke={EIXO} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="rotulo" stroke={EIXO} fontSize={11} width={92} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={caixaTooltip} formatter={(v: number) => [`${v} execução(ões)`, ""]} />
              <Bar dataKey="valor" fill={CAT[2]} radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList dataKey="valor" position="right" fontSize={11} fill="hsl(var(--muted-foreground))" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Painel>
      </div>

      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl bg-card border border-border p-5 shadow-card">
        <h2 className="text-base font-semibold font-display text-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" /> Sem fonte conectada
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Estes números existiam nesta página, mas não vinham de lugar nenhum. Voltam quando a fonte estiver ligada.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>· <span className="text-foreground">Receita</span> — precisa de um financeiro ou gateway de pagamento ligado.</li>
          <li>· <span className="text-foreground">Entregabilidade de e-mail</span> — precisa do provedor de envio reportando entrega e bounce.</li>
          <li>· <span className="text-foreground">Desempenho de anúncio</span> — precisa das contas de Meta e Google conectadas em Integrações.</li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default ReportsPage;
