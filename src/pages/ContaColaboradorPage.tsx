import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt, ChevronDown, Loader2, Lock, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API = "http://localhost:8900";

interface Period  { id: number; mes: number; ano: number; descricao: string; }
interface Member  { id: number; nome: string; ativo: boolean; }
interface MembroRelatorio {
  member_id: number; nome: string; honorarios: number;
  div_desp_escritorio: number; adiantamentos: number; reembolso: number; total: number;
}
interface Relatorio {
  period: Period; membros: MembroRelatorio[];
  total_receitas: number; total_despesas: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MESES = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ── Tela de seleção de membro ─────────────────────────────────────────────────
function MemberSelect({
  members, onSelect,
}: { members: Member[]; onSelect: (m: Member) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">💰</span>
          </div>
          <h1 className="text-xl font-bold text-white">GNX · Colaboradores</h1>
          <p className="text-sm text-gray-400">Selecione seu nome para ver seus honorários</p>
        </div>

        {/* Member list */}
        <div className="space-y-2">
          {members.filter(m => m.ativo).map(m => (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-gray-200 group-hover:text-white">{m.nome}</span>
              <span className="ml-auto text-gray-600 group-hover:text-emerald-500 text-lg">→</span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-600">
          Área restrita — acesso apenas para membros cadastrados
        </p>
      </div>
    </div>
  );
}

// ── Visão pessoal do colaborador ──────────────────────────────────────────────
function ColaboradorView({ member, periods }: { member: Member; periods: Period[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(
    periods.length ? periods[0].id : null
  );
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedPeriod) return;
    setLoading(true);
    fetch(`${API}/api/relatorio/${selectedPeriod}`)
      .then(r => r.json())
      .then(data => setRelatorio(data))
      .catch(() => toast.error("Não foi possível carregar os dados."))
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  const meusDados = relatorio?.membros.find(m => m.member_id === member.id);
  const periodo = periods.find(p => p.id === selectedPeriod);

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{member.nome}</h2>
            <p className="text-xs text-gray-500">GNX · Prestação de Contas</p>
          </div>
        </div>

        {/* Period selector */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider font-medium block mb-1.5">
            Período
          </label>
          <div className="relative">
            <select
              value={selectedPeriod ?? ""}
              onChange={e => setSelectedPeriod(Number(e.target.value))}
              className="w-full appearance-none bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 pr-10"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.descricao}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        ) : !meusDados ? (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center space-y-2">
            <Calendar className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm text-gray-400">Sem lançamentos neste período.</p>
          </div>
        ) : (
          <>
            {/* Total card — destaque */}
            <div className={cn(
              "rounded-2xl p-5 border",
              meusDados.total >= 0
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-red-500/5 border-red-500/20"
            )}>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                Total a receber — {periodo?.descricao}
              </p>
              <p className={cn(
                "text-4xl font-bold tracking-tight",
                meusDados.total >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {fmt(meusDados.total)}
              </p>
            </div>

            {/* Breakdown */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800 overflow-hidden">
              {[
                { label: "Honorários brutos", value: meusDados.honorarios, icon: TrendingUp, positive: true, color: "text-emerald-400" },
                { label: "Despesas do escritório (rateio)", value: -meusDados.div_desp_escritorio, icon: TrendingDown, positive: false, color: "text-red-400" },
                { label: "Adiantamentos", value: -meusDados.adiantamentos, icon: Receipt, positive: false, color: "text-orange-400" },
                { label: "Reembolsos", value: meusDados.reembolso, icon: Wallet, positive: true, color: "text-blue-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                value !== 0 && (
                  <div key={label} className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("w-4 h-4", color)} />
                      <span className="text-sm text-gray-300">{label}</span>
                    </div>
                    <span className={cn("text-sm font-semibold tabular-nums", color)}>
                      {value >= 0 ? "+" : ""}{fmt(value)}
                    </span>
                  </div>
                )
              ))}
            </div>

            {/* History — últimos 3 períodos */}
            {periods.length > 1 && (
              <PeriodoHistorico member={member} periods={periods.slice(0, 4)} currentPeriodId={selectedPeriod} />
            )}
          </>
        )}

        <p className="text-center text-xs text-gray-700 pb-4">
          Dúvidas? Fale com a administração da GNX.
        </p>
      </div>
    </div>
  );
}

// ── Mini histórico dos últimos períodos ───────────────────────────────────────
function PeriodoHistorico({ member, periods, currentPeriodId }: {
  member: Member; periods: Period[]; currentPeriodId: number | null;
}) {
  const [data, setData] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const outros = periods.filter(p => p.id !== currentPeriodId).slice(0, 3);
    if (!outros.length) return;
    setLoading(true);
    Promise.all(outros.map(p =>
      fetch(`${API}/api/relatorio/${p.id}`)
        .then(r => r.json())
        .then((rel: Relatorio) => {
          const m = rel.membros.find(x => x.member_id === member.id);
          return { id: p.id, total: m?.total ?? 0 };
        })
        .catch(() => ({ id: p.id, total: 0 }))
    )).then(results => {
      const map: Record<number, number> = {};
      results.forEach(r => { map[r.id] = r.total; });
      setData(map);
    }).finally(() => setLoading(false));
  }, [member.id, currentPeriodId]);

  const outros = periods.filter(p => p.id !== currentPeriodId).slice(0, 3);
  if (!outros.length) return null;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Períodos anteriores</h3>
      {loading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-gray-600" /></div>
      ) : (
        <div className="space-y-2">
          {outros.map(p => {
            const v = data[p.id];
            return (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{p.descricao}</span>
                <span className={cn("text-sm font-semibold tabular-nums", v === undefined ? "text-gray-600" : v >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {v === undefined ? "—" : fmt(v)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Página raiz ───────────────────────────────────────────────────────────────
export default function ContaColaboradorPage() {
  const [members, setMembers]       = useState<Member[] | null>(null);
  const [periods, setPeriods]       = useState<Period[] | null>(null);
  const [selected, setSelected]     = useState<Member | null>(null);
  const [apiOnline, setApiOnline]   = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API}/healthz`)
      .then(() => {
        setApiOnline(true);
        Promise.all([
          fetch(`${API}/api/members`).then(r => r.json()),
          fetch(`${API}/api/periods`).then(r => r.json()),
        ]).then(([m, p]) => { setMembers(m); setPeriods(p); });
      })
      .catch(() => setApiOnline(false));
  }, []);

  if (apiOnline === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="text-center space-y-3">
          <Lock className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400">Sistema temporariamente indisponível.</p>
          <p className="text-xs text-gray-600">Tente novamente em instantes.</p>
        </div>
      </div>
    );
  }

  if (!members || !periods) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!selected) {
    return <MemberSelect members={members} onSelect={setSelected} />;
  }

  return <ColaboradorView member={selected} periods={periods} />;
}
