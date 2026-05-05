import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Receipt, ChevronDown,
  Loader2, Lock, User, Calendar, Calculator, X,
} from "lucide-react";
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

const parseBRL = (s: string) => {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

// ── Calculadora de Honorários ─────────────────────────────────────────────────
function CalcModal({
  onClose,
  prefill,
}: {
  onClose: () => void;
  prefill?: MembroRelatorio | null;
}) {
  const [honorarios, setHonorarios]       = useState(String(prefill?.honorarios ?? ""));
  const [despesas,   setDespesas]         = useState(String(prefill?.div_desp_escritorio ?? ""));
  const [adiantamentos, setAdiantamentos] = useState(String(prefill?.adiantamentos ?? ""));
  const [reembolsos, setReembolsos]       = useState(String(prefill?.reembolso ?? ""));

  const h = parseBRL(honorarios);
  const d = parseBRL(despesas);
  const a = parseBRL(adiantamentos);
  const r = parseBRL(reembolsos);
  const total = h - d - a + r;

  const numInput = (label: string, value: string, onChange: (v: string) => void, color: string) => (
    <div className="space-y-1">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">R$</span>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0,00"
          className={cn(
            "w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors tabular-nums",
            color
          )}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Calculadora</p>
              <p className="text-xs text-gray-500">Verifique seus honorários</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-5 space-y-3">
          {numInput("(+) Honorários brutos", honorarios, setHonorarios, "text-emerald-400")}
          {numInput("(−) Rateio de despesas do escritório", despesas, setDespesas, "text-red-400")}
          {numInput("(−) Adiantamentos", adiantamentos, setAdiantamentos, "text-amber-400")}
          {numInput("(+) Reembolsos", reembolsos, setReembolsos, "text-blue-400")}

          {/* Divisor */}
          <div className="border-t border-gray-800 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total a receber</span>
              <span className={cn(
                "text-2xl font-bold tabular-nums",
                total >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {fmt(total)}
              </span>
            </div>
          </div>

          {/* Breakdown */}
          {(h > 0 || d > 0 || a > 0 || r > 0) && (
            <div className="bg-gray-800/50 rounded-xl p-3 space-y-1.5 text-xs">
              {h > 0 && <div className="flex justify-between"><span className="text-gray-500">Honorários</span><span className="text-emerald-400 tabular-nums">+ {fmt(h)}</span></div>}
              {d > 0 && <div className="flex justify-between"><span className="text-gray-500">Rateio despesas</span><span className="text-red-400 tabular-nums">− {fmt(d)}</span></div>}
              {a > 0 && <div className="flex justify-between"><span className="text-gray-500">Adiantamentos</span><span className="text-amber-400 tabular-nums">− {fmt(a)}</span></div>}
              {r > 0 && <div className="flex justify-between"><span className="text-gray-500">Reembolsos</span><span className="text-blue-400 tabular-nums">+ {fmt(r)}</span></div>}
            </div>
          )}

          <button
            onClick={() => { setHonorarios(""); setDespesas(""); setAdiantamentos(""); setReembolsos(""); }}
            className="w-full py-2 rounded-xl text-xs text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-all"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tela de seleção de membro ─────────────────────────────────────────────────
function MemberSelect({ members, onSelect }: { members: Member[]; onSelect: (m: Member) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">💰</span>
          </div>
          <h1 className="text-xl font-bold text-white">GNX · Colaboradores</h1>
          <p className="text-sm text-gray-400">Selecione seu nome para ver seus honorários</p>
        </div>
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
  const [showCalc, setShowCalc] = useState(false);

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
      {showCalc && (
        <CalcModal onClose={() => setShowCalc(false)} prefill={meusDados} />
      )}

      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{member.nome}</h2>
              <p className="text-xs text-gray-500">GNX · Prestação de Contas</p>
            </div>
          </div>
          <button
            onClick={() => setShowCalc(true)}
            title="Calculadora de honorários"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-gray-400 hover:text-emerald-400 text-xs font-medium transition-all"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calculadora</span>
          </button>
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
            {/* Total card */}
            <div className={cn(
              "rounded-2xl p-5 border",
              meusDados.total >= 0
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-red-500/5 border-red-500/20"
            )}>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                Total a receber — {periodo?.descricao}
              </p>
              <div className="flex items-end justify-between gap-3">
                <p className={cn(
                  "text-4xl font-bold tracking-tight",
                  meusDados.total >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {fmt(meusDados.total)}
                </p>
                <button
                  onClick={() => setShowCalc(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900/60 border border-gray-700 text-xs text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all mb-0.5"
                >
                  <Calculator className="w-3 h-3" /> verificar
                </button>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800 overflow-hidden">
              {[
                { label: "Honorários brutos", value: meusDados.honorarios, icon: TrendingUp, color: "text-emerald-400", signal: "+" },
                { label: "Despesas do escritório (rateio)", value: meusDados.div_desp_escritorio, icon: TrendingDown, color: "text-red-400", signal: "−" },
                { label: "Adiantamentos", value: meusDados.adiantamentos, icon: Receipt, color: "text-amber-400", signal: "−" },
                { label: "Reembolsos", value: meusDados.reembolso, icon: Wallet, color: "text-blue-400", signal: "+" },
              ].map(({ label, value, icon: Icon, color, signal }) => (
                value !== 0 && (
                  <div key={label} className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("w-4 h-4", color)} />
                      <span className="text-sm text-gray-300">{label}</span>
                    </div>
                    <span className={cn("text-sm font-semibold tabular-nums", color)}>
                      {signal} {fmt(value)}
                    </span>
                  </div>
                )
              ))}
            </div>

            {/* History */}
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
                <span className={cn("text-sm font-semibold tabular-nums",
                  v === undefined ? "text-gray-600" : v >= 0 ? "text-emerald-400" : "text-red-400")}>
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
  const [members, setMembers]     = useState<Member[] | null>(null);
  const [periods, setPeriods]     = useState<Period[] | null>(null);
  const [selected, setSelected]   = useState<Member | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

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
