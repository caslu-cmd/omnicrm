import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Receipt, Wallet, Plus, Trash2,
  FileBarChart, Bot, Loader2, Send, RefreshCw, ChevronDown,
  Users, Calendar, BarChart3, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, UserCircle2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = "http://localhost:8900";
const RICO_PIN = "GN5247";
const SESSION_KEY = "rico_auth_gnx";

// ── Tela de bloqueio ──────────────────────────────────────────────────────────
function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const tryUnlock = () => {
    if (pin === RICO_PIN) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onUnlock();
    } else {
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 500);
      toast.error("Senha incorreta.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className={cn(
        "w-full max-w-sm bg-gray-900 rounded-2xl p-8 space-y-6 border border-gray-800 shadow-2xl transition-transform",
        shake && "animate-[shake_0.4s_ease-in-out]"
      )}>
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)}
            60%{transform:translateX(-6px)}
            80%{transform:translateX(6px)}
          }
        `}</style>
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">Prestação de Contas</h2>
            <p className="text-sm text-gray-400 mt-0.5">GNX · Área restrita</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Senha de acesso</label>
          <div className="relative">
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              value={pin}
              onChange={e => setPin(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === "Enter") tryUnlock(); }}
              placeholder="••••••"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg tracking-[0.4em] font-mono focus:outline-none focus:border-emerald-500 placeholder:tracking-normal placeholder:text-base"
            />
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={tryUnlock}
          disabled={!pin}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
        >
          Entrar
        </button>

        <div className="border-t border-gray-800 pt-4">
          <button
            onClick={() => navigate("/conta-colaborador")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/5 border border-gray-800 hover:border-emerald-500/30 transition-all"
          >
            <UserCircle2 className="w-4 h-4" />
            Sou colaborador — acessar meus honorários
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Period { id: number; mes: number; ano: number; descricao: string; }
interface Member { id: number; nome: string; ativo: boolean; }
interface Receita {
  id: number; period_id: number; descricao: string; valor: number;
  regra: string; cliente?: string; data?: string; resp_member_id?: number;
  aux1_member_id?: number; captacao_member_id?: number;
}
interface Despesa {
  id: number; period_id: number; descricao: string; valor: number;
  reembolso: boolean; member_id?: number; data?: string;
}
interface Imposto {
  id: number; period_id: number; descricao: string;
  valor_nf: number; valor_imposto: number; cliente?: string; data_emissao?: string;
}
interface Adiantamento {
  id: number; period_id: number; member_id: number;
  descricao: string; valor: number; data?: string;
}
interface MembroRelatorio {
  member_id: number; nome: string; honorarios: number;
  div_desp_escritorio: number; adiantamentos: number; reembolso: number; total: number;
}
interface Relatorio {
  period: Period; membros: MembroRelatorio[];
  total_receitas: number; total_despesas: number; total_impostos: number;
  total_escritorio: number; total_rendimentos: number; saldo_final: number;
}
type Tab = "dashboard" | "receitas" | "despesas" | "impostos" | "adiantamentos" | "relatorio" | "agente";

// ── Utilitários ───────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const REGRAS: Record<string, string> = {
  "1": "Agência 15% / Resp 85%",
  "2": "Agência 20% / Cap 10% / Resp 70%",
  "3": "Agência 15% / Cap 10% / Resp 50% / Aux 25%",
  "4": "Agência 20% / Resp 50% / Aux 30%",
  "5": "Agência 30% / Resp 70%",
};

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useApi<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(url);
      if (!r.ok) return;
      setData(await r.json());
    } catch { /* api offline */ }
    finally { setLoading(false); }
  }, [url]);

  useEffect(() => { fetch_(); }, deps);
  return { data, loading, refetch: fetch_ };
}

async function post(path: string, body: object) {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function del(path: string) {
  await fetch(`${API}${path}`, { method: "DELETE" });
}

// ── Componentes auxiliares ────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PeriodSelector({
  periods, selected, onChange, onNew
}: {
  periods: Period[]; selected: number | null;
  onChange: (id: number) => void; onNew: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={selected ?? ""}
          onChange={e => onChange(Number(e.target.value))}
          className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
        >
          <option value="">Selecionar período…</option>
          {periods.map(p => (
            <option key={p.id} value={p.id}>{p.descricao}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        <Plus className="w-4 h-4" /> Período
      </button>
    </div>
  );
}

// ── Formulários ───────────────────────────────────────────────────────────────
function ReceitaForm({ periodId, members, onSave }: {
  periodId: number; members: Member[]; onSave: () => void;
}) {
  const [form, setForm] = useState({
    descricao: "", valor: "", regra: "1", cliente: "", data: "",
    resp_member_id: "", captacao_member_id: "", aux1_member_id: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.descricao || !form.valor) return toast.error("Preencha descrição e valor.");
    setSaving(true);
    try {
      await post("/api/receitas", {
        period_id: periodId,
        descricao: form.descricao,
        valor: parseFloat(form.valor),
        regra: form.regra,
        cliente: form.cliente || undefined,
        data: form.data || undefined,
        resp_member_id: form.resp_member_id ? Number(form.resp_member_id) : undefined,
        captacao_member_id: form.captacao_member_id ? Number(form.captacao_member_id) : undefined,
        aux1_member_id: form.aux1_member_id ? Number(form.aux1_member_id) : undefined,
      });
      toast.success("Receita registrada!");
      setForm({ descricao: "", valor: "", regra: "1", cliente: "", data: "", resp_member_id: "", captacao_member_id: "", aux1_member_id: "" });
      onSave();
    } catch { toast.error("Erro ao salvar receita."); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700">Nova Receita</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className="input-field" placeholder="Descrição *" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
        <input className="input-field" placeholder="Valor (R$) *" type="number" step="0.01" value={form.valor} onChange={e => set("valor", e.target.value)} />
        <input className="input-field" placeholder="Cliente" value={form.cliente} onChange={e => set("cliente", e.target.value)} />
        <input className="input-field" type="date" value={form.data} onChange={e => set("data", e.target.value)} />
        <select className="input-field" value={form.regra} onChange={e => set("regra", e.target.value)}>
          {Object.entries(REGRAS).map(([k, v]) => <option key={k} value={k}>Regra {k} — {v}</option>)}
        </select>
        <select className="input-field" value={form.resp_member_id} onChange={e => set("resp_member_id", e.target.value)}>
          <option value="">Responsável…</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        {["2","3"].includes(form.regra) && (
          <select className="input-field" value={form.captacao_member_id} onChange={e => set("captacao_member_id", e.target.value)}>
            <option value="">Captação…</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        )}
        {["3","4"].includes(form.regra) && (
          <select className="input-field" value={form.aux1_member_id} onChange={e => set("aux1_member_id", e.target.value)}>
            <option value="">Auxiliar…</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        )}
      </div>
      <button onClick={submit} disabled={saving} className="btn-primary w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <Plus className="w-4 h-4 inline mr-2" />}
        Registrar Receita
      </button>
    </div>
  );
}

function DespesaForm({ periodId, members, onSave }: {
  periodId: number; members: Member[]; onSave: () => void;
}) {
  const [form, setForm] = useState({ descricao: "", valor: "", reembolso: false, member_id: "", data: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.descricao || !form.valor) return toast.error("Preencha descrição e valor.");
    setSaving(true);
    try {
      await post("/api/despesas", {
        period_id: periodId, descricao: form.descricao, valor: parseFloat(form.valor),
        reembolso: form.reembolso, data: form.data || undefined,
        member_id: form.member_id ? Number(form.member_id) : undefined,
      });
      toast.success("Despesa registrada!");
      setForm({ descricao: "", valor: "", reembolso: false, member_id: "", data: "" });
      onSave();
    } catch { toast.error("Erro ao salvar despesa."); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700">Nova Despesa</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className="input-field" placeholder="Descrição *" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
        <input className="input-field" placeholder="Valor (R$) *" type="number" step="0.01" value={form.valor} onChange={e => set("valor", e.target.value)} />
        <input className="input-field" type="date" value={form.data} onChange={e => set("data", e.target.value)} />
        <select className="input-field" value={form.member_id} onChange={e => set("member_id", e.target.value)}>
          <option value="">Membro (reembolso)…</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.reembolso} onChange={e => set("reembolso", e.target.checked)}
          className="rounded" />
        É reembolso (crédito para o membro)
      </label>
      <button onClick={submit} disabled={saving} className="btn-primary w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <Plus className="w-4 h-4 inline mr-2" />}
        Registrar Despesa
      </button>
    </div>
  );
}

function ImpostoForm({ periodId, onSave }: { periodId: number; onSave: () => void; }) {
  const [form, setForm] = useState({ descricao: "", valor_nf: "", valor_imposto: "", cliente: "", data_emissao: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.descricao || !form.valor_nf || !form.valor_imposto) return toast.error("Preencha os campos obrigatórios.");
    setSaving(true);
    try {
      await post("/api/impostos", {
        period_id: periodId, descricao: form.descricao,
        valor_nf: parseFloat(form.valor_nf), valor_imposto: parseFloat(form.valor_imposto),
        cliente: form.cliente || undefined, data_emissao: form.data_emissao || undefined,
      });
      toast.success("Imposto registrado!");
      setForm({ descricao: "", valor_nf: "", valor_imposto: "", cliente: "", data_emissao: "" });
      onSave();
    } catch { toast.error("Erro ao salvar imposto."); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700">Nova NF / Imposto</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className="input-field" placeholder="Descrição *" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
        <input className="input-field" placeholder="Cliente" value={form.cliente} onChange={e => set("cliente", e.target.value)} />
        <input className="input-field" placeholder="Valor NF (R$) *" type="number" step="0.01" value={form.valor_nf} onChange={e => set("valor_nf", e.target.value)} />
        <input className="input-field" placeholder="Valor Imposto (R$) *" type="number" step="0.01" value={form.valor_imposto} onChange={e => set("valor_imposto", e.target.value)} />
        <input className="input-field" type="date" value={form.data_emissao} onChange={e => set("data_emissao", e.target.value)} />
      </div>
      <button onClick={submit} disabled={saving} className="btn-primary w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <Plus className="w-4 h-4 inline mr-2" />}
        Registrar NF / Imposto
      </button>
    </div>
  );
}

function AdiantamentoForm({ periodId, members, onSave }: {
  periodId: number; members: Member[]; onSave: () => void;
}) {
  const [form, setForm] = useState({ member_id: "", descricao: "", valor: "", data: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.member_id || !form.valor) return toast.error("Selecione membro e valor.");
    setSaving(true);
    try {
      await post("/api/adiantamentos", {
        period_id: periodId, member_id: Number(form.member_id),
        descricao: form.descricao || "Adiantamento",
        valor: parseFloat(form.valor), data: form.data || undefined,
      });
      toast.success("Adiantamento registrado!");
      setForm({ member_id: "", descricao: "", valor: "", data: "" });
      onSave();
    } catch { toast.error("Erro ao salvar adiantamento."); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700">Novo Adiantamento</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select className="input-field" value={form.member_id} onChange={e => set("member_id", e.target.value)}>
          <option value="">Membro *</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        <input className="input-field" placeholder="Valor (R$) *" type="number" step="0.01" value={form.valor} onChange={e => set("valor", e.target.value)} />
        <input className="input-field" placeholder="Descrição" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
        <input className="input-field" type="date" value={form.data} onChange={e => set("data", e.target.value)} />
      </div>
      <button onClick={submit} disabled={saving} className="btn-primary w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <Plus className="w-4 h-4 inline mr-2" />}
        Registrar Adiantamento
      </button>
    </div>
  );
}

// ── Chat do Agente ────────────────────────────────────────────────────────────
interface ChatMsg { role: "user" | "assistant"; text: string; }

function AgentChat() {
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [rawHistory, setRawHistory] = useState<object[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toolRunning, setToolRunning] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, toolRunning]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setLoading(true);
    setHistory(h => [...h, { role: "user", text: msg }]);

    let assistantText = "";
    setHistory(h => [...h, { role: "assistant", text: "" }]);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: rawHistory, message: msg }),
      });
      if (!res.body) throw new Error("no body");

      const reader = res.body.getReader();
      readerRef.current = reader;
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "text") {
              assistantText += ev.text;
              setHistory(h => {
                const copy = [...h];
                copy[copy.length - 1] = { role: "assistant", text: assistantText };
                return copy;
              });
              setToolRunning("");
            } else if (ev.type === "tool_call") {
              setToolRunning(ev.name);
            } else if (ev.type === "tool_result") {
              setToolRunning("");
            } else if (ev.type === "done") {
              setToolRunning("");
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Erro de conexão";
      setHistory(h => {
        const copy = [...h];
        copy[copy.length - 1] = { role: "assistant", text: `Erro: ${errMsg}` };
        return copy;
      });
    } finally {
      setLoading(false);
      setToolRunning("");
      setRawHistory(h => [
        ...h,
        { role: "user", content: msg },
        { role: "assistant", content: assistantText },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Conta IA</p>
          <p className="text-xs text-white/70">Especialista em Prestação de Contas</p>
        </div>
        <div className="ml-auto w-2 h-2 rounded-full bg-green-400" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {history.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Olá! Sou a Conta IA.</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Posso calcular relatórios, registrar lançamentos e analisar seus resultados financeiros.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {["Calcular relatório do período atual", "Listar membros da equipe", "Comparar últimos dois períodos"].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:border-purple-400 hover:text-purple-600 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
              m.role === "user"
                ? "bg-purple-600 text-white rounded-br-sm"
                : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
            )}>
              {m.text || (m.role === "assistant" && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />)}
            </div>
          </div>
        ))}
        {toolRunning && (
          <div className="flex justify-start">
            <div className="bg-white border border-purple-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs text-purple-600 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Executando: <span className="font-mono">{toolRunning}</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[40px] max-h-32"
            placeholder="Pergunte à Conta IA…"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ContaReportPage() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  return <ContaReportContent />;
}

function ContaReportContent() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [newPeriod, setNewPeriod] = useState({ mes: "", ano: "", descricao: "" });
  const [showNewMember, setShowNewMember] = useState(false);
  const [newMemberNome, setNewMemberNome] = useState("");
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Data
  const { data: periods, refetch: refetchPeriods } = useApi<Period[]>(`${API}/api/periods`, []);
  const { data: members, refetch: refetchMembers } = useApi<Member[]>(`${API}/api/members`, []);
  const { data: receitas, refetch: refetchReceitas } = useApi<Receita[]>(
    selectedPeriod ? `${API}/api/receitas?period_id=${selectedPeriod}` : "", [selectedPeriod]
  );
  const { data: despesas, refetch: refetchDespesas } = useApi<Despesa[]>(
    selectedPeriod ? `${API}/api/despesas?period_id=${selectedPeriod}` : "", [selectedPeriod]
  );
  const { data: impostos, refetch: refetchImpostos } = useApi<Imposto[]>(
    selectedPeriod ? `${API}/api/impostos?period_id=${selectedPeriod}` : "", [selectedPeriod]
  );
  const { data: adiantamentos, refetch: refetchAdiant } = useApi<Adiantamento[]>(
    selectedPeriod ? `${API}/api/adiantamentos?period_id=${selectedPeriod}` : "", [selectedPeriod]
  );
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [loadingRel, setLoadingRel] = useState(false);

  // Check API health
  useEffect(() => {
    fetch(`${API}/healthz`).then(() => setApiOnline(true)).catch(() => setApiOnline(false));
  }, []);

  // Auto-select first period
  useEffect(() => {
    if (periods?.length && !selectedPeriod) setSelectedPeriod(periods[0].id);
  }, [periods]);

  const loadRelatorio = async () => {
    if (!selectedPeriod) return;
    setLoadingRel(true);
    try {
      const r = await fetch(`${API}/api/relatorio/${selectedPeriod}`);
      if (r.ok) setRelatorio(await r.json());
    } catch { /* api offline */ }
    finally { setLoadingRel(false); }
  };

  useEffect(() => {
    if (tab === "relatorio" || tab === "dashboard") loadRelatorio();
  }, [tab, selectedPeriod]);

  const createPeriod = async () => {
    if (!newPeriod.mes || !newPeriod.ano || !newPeriod.descricao)
      return toast.error("Preencha todos os campos do período.");
    try {
      const p = await post("/api/periods", {
        mes: Number(newPeriod.mes), ano: Number(newPeriod.ano), descricao: newPeriod.descricao,
      });
      toast.success("Período criado!");
      setNewPeriod({ mes: "", ano: "", descricao: "" });
      setShowNewPeriod(false);
      await refetchPeriods();
      setSelectedPeriod(p.id);
    } catch { toast.error("Erro ao criar período."); }
  };

  const createMember = async () => {
    if (!newMemberNome.trim()) return toast.error("Informe o nome do membro.");
    try {
      await post("/api/members", { nome: newMemberNome.trim() });
      toast.success("Membro adicionado!");
      setNewMemberNome("");
      setShowNewMember(false);
      refetchMembers();
    } catch { toast.error("Erro ao criar membro."); }
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard",    label: "Dashboard",   icon: BarChart3 },
    { id: "receitas",     label: "Receitas",     icon: TrendingUp },
    { id: "despesas",     label: "Despesas",     icon: TrendingDown },
    { id: "impostos",     label: "Impostos",     icon: Receipt },
    { id: "adiantamentos",label: "Adiantamentos",icon: Wallet },
    { id: "relatorio",    label: "Relatório",    icon: FileBarChart },
    { id: "agente",       label: "Agente IA",    icon: Bot },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Estilos inline */}
      <style>{`
        .input-field { @apply w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white; }
        .btn-primary { @apply flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50; }
        .btn-ghost  { @apply flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prestação de Contas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestão financeira e relatórios mensais</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/conta-colaborador")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <UserCircle2 className="w-3.5 h-3.5" /> Acesso Colaboradores
          </button>
          {apiOnline === false && (
            <span className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" /> API offline — rode iniciar_api.bat
            </span>
          )}
          {apiOnline === true && (
            <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> API online
            </span>
          )}
          {periods && (
            <PeriodSelector
              periods={periods}
              selected={selectedPeriod}
              onChange={setSelectedPeriod}
              onNew={() => setShowNewPeriod(true)}
            />
          )}
        </div>
      </div>

      {/* New Period Modal */}
      {showNewPeriod && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg space-y-3 max-w-sm">
          <h3 className="font-semibold text-sm">Novo Período</h3>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder="Mês (1-12)" type="number" min={1} max={12}
              value={newPeriod.mes} onChange={e => setNewPeriod(p => ({ ...p, mes: e.target.value }))} />
            <input className="input-field" placeholder="Ano" type="number"
              value={newPeriod.ano} onChange={e => setNewPeriod(p => ({ ...p, ano: e.target.value }))} />
          </div>
          <input className="input-field" placeholder="Descrição (ex: Maio/2025)"
            value={newPeriod.descricao} onChange={e => setNewPeriod(p => ({ ...p, descricao: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={createPeriod} className="btn-primary flex-1">Criar</button>
            <button onClick={() => setShowNewPeriod(false)} className="btn-ghost flex-1">Cancelar</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-100 pb-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              tab === t.id
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === "dashboard" && (
        <div className="space-y-4">
          {!selectedPeriod ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Selecione um período para ver o dashboard</p>
            </div>
          ) : loadingRel ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
          ) : relatorio ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Receitas" value={fmt(relatorio.total_receitas)} icon={TrendingUp} color="bg-emerald-500" />
                <StatCard label="Despesas" value={fmt(relatorio.total_despesas)} icon={TrendingDown} color="bg-red-500" />
                <StatCard label="Impostos" value={fmt(relatorio.total_impostos)} icon={Receipt} color="bg-amber-500" />
                <StatCard label="Escritório" value={fmt(relatorio.total_escritorio)} icon={Wallet} color="bg-blue-500" />
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Resumo por Membro</h3>
                  <span className={cn("text-sm font-bold", relatorio.saldo_final >= 0 ? "text-emerald-600" : "text-red-600")}>
                    Saldo: {fmt(relatorio.saldo_final)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">Membro</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Honorários</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Desp. (-)</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Adiant. (-)</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Remb. (+)</th>
                        <th className="px-4 py-2.5 text-right font-bold text-gray-700 bg-gray-100">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {relatorio.membros.map(m => (
                        <tr key={m.member_id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{m.nome}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600">{fmt(m.honorarios)}</td>
                          <td className="px-4 py-2.5 text-right text-red-500">{fmt(m.div_desp_escritorio)}</td>
                          <td className="px-4 py-2.5 text-right text-orange-500">{fmt(m.adiantamentos)}</td>
                          <td className="px-4 py-2.5 text-right text-blue-500">{fmt(m.reembolso)}</td>
                          <td className={cn("px-4 py-2.5 text-right font-bold bg-gray-50", m.total >= 0 ? "text-emerald-700" : "text-red-700")}>
                            {fmt(m.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── RECEITAS ── */}
      {tab === "receitas" && (
        <div className="space-y-4">
          {selectedPeriod && members ? (
            <ReceitaForm periodId={selectedPeriod} members={members} onSave={refetchReceitas} />
          ) : <p className="text-sm text-gray-400">Selecione um período.</p>}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Lançamentos</h3>
              <button onClick={refetchReceitas} className="btn-ghost text-xs"><RefreshCw className="w-3 h-3" /></button>
            </div>
            {!receitas?.length ? (
              <p className="p-8 text-center text-sm text-gray-400">Sem receitas neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Descrição</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Cliente</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Regra</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Valor</th>
                    <th className="px-4 py-2.5" />
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {receitas.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-800">{r.descricao}</td>
                        <td className="px-4 py-2.5 text-gray-500">{r.cliente || "—"}</td>
                        <td className="px-4 py-2.5"><span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">R{r.regra}</span></td>
                        <td className="px-4 py-2.5 text-right font-medium text-emerald-600">{fmt(r.valor)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={async () => { await del(`/api/receitas/${r.id}`); refetchReceitas(); toast.success("Removido"); }}
                            className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DESPESAS ── */}
      {tab === "despesas" && (
        <div className="space-y-4">
          {selectedPeriod && members ? (
            <DespesaForm periodId={selectedPeriod} members={members} onSave={refetchDespesas} />
          ) : <p className="text-sm text-gray-400">Selecione um período.</p>}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-sm">Lançamentos</h3>
            </div>
            {!despesas?.length ? (
              <p className="p-8 text-center text-sm text-gray-400">Sem despesas neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Descrição</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Tipo</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Valor</th>
                    <th className="px-4 py-2.5" />
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {despesas.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-800">{d.descricao}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", d.reembolso ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700")}>
                            {d.reembolso ? "Reembolso" : "Despesa"}
                          </span>
                        </td>
                        <td className={cn("px-4 py-2.5 text-right font-medium", d.reembolso ? "text-blue-600" : "text-red-500")}>{fmt(d.valor)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={async () => { await del(`/api/despesas/${d.id}`); refetchDespesas(); toast.success("Removido"); }}
                            className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── IMPOSTOS ── */}
      {tab === "impostos" && (
        <div className="space-y-4">
          {selectedPeriod ? (
            <ImpostoForm periodId={selectedPeriod} onSave={refetchImpostos} />
          ) : <p className="text-sm text-gray-400">Selecione um período.</p>}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-sm">NFs / Impostos</h3>
            </div>
            {!impostos?.length ? (
              <p className="p-8 text-center text-sm text-gray-400">Sem impostos neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Descrição</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Cliente</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Valor NF</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Imposto</th>
                    <th className="px-4 py-2.5" />
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {impostos.map(i => (
                      <tr key={i.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-800">{i.descricao}</td>
                        <td className="px-4 py-2.5 text-gray-500">{i.cliente || "—"}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{fmt(i.valor_nf)}</td>
                        <td className="px-4 py-2.5 text-right text-amber-600 font-medium">{fmt(i.valor_imposto)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={async () => { await del(`/api/impostos/${i.id}`); refetchImpostos(); toast.success("Removido"); }}
                            className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADIANTAMENTOS ── */}
      {tab === "adiantamentos" && (
        <div className="space-y-4">
          {selectedPeriod && members ? (
            <AdiantamentoForm periodId={selectedPeriod} members={members} onSave={refetchAdiant} />
          ) : <p className="text-sm text-gray-400">Selecione um período.</p>}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-sm">Adiantamentos</h3>
            </div>
            {!adiantamentos?.length ? (
              <p className="p-8 text-center text-sm text-gray-400">Sem adiantamentos neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Membro</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Descrição</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Data</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Valor</th>
                    <th className="px-4 py-2.5" />
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {adiantamentos.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          {members?.find(m => m.id === a.member_id)?.nome || `#${a.member_id}`}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{a.descricao}</td>
                        <td className="px-4 py-2.5 text-gray-500">{a.data || "—"}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-orange-600">{fmt(a.valor)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={async () => { await del(`/api/adiantamentos/${a.id}`); refetchAdiant(); toast.success("Removido"); }}
                            className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RELATÓRIO ── */}
      {tab === "relatorio" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Relatório Consolidado</h2>
            <button onClick={loadRelatorio} className="btn-ghost text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Recalcular
            </button>
          </div>
          {!selectedPeriod ? (
            <p className="text-sm text-gray-400 text-center py-12">Selecione um período.</p>
          ) : loadingRel ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
          ) : relatorio ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Receitas", v: relatorio.total_receitas, c: "text-emerald-600" },
                  { label: "Despesas", v: relatorio.total_despesas, c: "text-red-500" },
                  { label: "Impostos", v: relatorio.total_impostos, c: "text-amber-600" },
                  { label: "Escritório", v: relatorio.total_escritorio, c: "text-blue-600" },
                  { label: "Saldo Final", v: relatorio.saldo_final, c: relatorio.saldo_final >= 0 ? "text-emerald-700" : "text-red-700" },
                ].map(({ label, v, c }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={cn("text-base font-bold mt-0.5", c)}>{fmt(v)}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Demonstrativo dos Sócios</h3>
                  <button onClick={() => window.print()} className="btn-ghost text-xs">Imprimir PDF</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">Membro</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Honorários (+)</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Desp. (-)</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Adiant. (-)</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Remb. (+)</th>
                        <th className="px-4 py-2.5 text-right font-bold text-gray-700 bg-gray-100">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {relatorio.membros.map(m => (
                        <tr key={m.member_id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{m.nome}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600">{fmt(m.honorarios)}</td>
                          <td className="px-4 py-2.5 text-right text-red-500">{fmt(m.div_desp_escritorio)}</td>
                          <td className="px-4 py-2.5 text-right text-orange-500">{fmt(m.adiantamentos)}</td>
                          <td className="px-4 py-2.5 text-right text-blue-500">{fmt(m.reembolso)}</td>
                          <td className={cn("px-4 py-2.5 text-right font-bold bg-gray-50", m.total >= 0 ? "text-emerald-700" : "text-red-700")}>
                            {fmt(m.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-gray-400 py-8">Nenhum dado carregado.</p>
          )}
        </div>
      )}

      {/* ── AGENTE IA ── */}
      {tab === "agente" && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700">
            O agente tem acesso completo aos dados de prestação de contas. Pode consultar, calcular relatórios
            e registrar lançamentos por chat.
          </div>
          <AgentChat />
        </div>
      )}

      {/* ── MEMBROS (flutuante no dashboard) ── */}
      {tab === "dashboard" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" /> Membros da Equipe
            </h3>
            <button onClick={() => setShowNewMember(v => !v)} className="btn-ghost text-xs">
              <Plus className="w-3.5 h-3.5" /> Membro
            </button>
          </div>
          {showNewMember && (
            <div className="flex gap-2 mb-3">
              <input className="input-field flex-1" placeholder="Nome do membro"
                value={newMemberNome} onChange={e => setNewMemberNome(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") createMember(); }} />
              <button onClick={createMember} className="btn-primary px-3">Adicionar</button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {members?.map(m => (
              <span key={m.id} className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                m.ativo ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400 line-through"
              )}>
                {m.nome}
              </span>
            ))}
            {!members?.length && <p className="text-sm text-gray-400">Nenhum membro. Adicione o primeiro.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
