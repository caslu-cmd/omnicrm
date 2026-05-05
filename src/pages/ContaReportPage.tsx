import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Receipt, Wallet, Plus, Trash2,
  FileBarChart, Bot, Loader2, Send, RefreshCw, ChevronDown,
  Users, Calendar, BarChart3, AlertCircle, CheckCircle2,
  Lock, Eye, EyeOff, UserCircle2, Sparkles, Paperclip, X, FileText, Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = "https://rico-api-production-b072.up.railway.app";
const RICO_PIN = "GN5247";
const SESSION_KEY = "rico_auth_gnx";

// ── Leitura de arquivos no browser (sem depender da API) ──────────────────────
async function extractFileText(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const MAX = 20000;

  // Texto puro: CSV, TXT, OFX, QIF, TSV
  if (["csv", "txt", "tsv", "ofx", "qif", "xml"].includes(ext)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(((e.target?.result as string) ?? "").slice(0, MAX));
      reader.onerror = () => reject(new Error("Falha ao ler arquivo de texto."));
      reader.readAsText(file, "UTF-8");
    });
  }

  // Excel: XLSX / XLS
  if (["xlsx", "xls"].includes(ext)) {
    const { read, utils } = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = read(buf, { type: "array" });
    const lines: string[] = [];
    for (const sheetName of wb.SheetNames) {
      lines.push(`=== ${sheetName} ===`);
      const rows: string[][] = utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" });
      rows.forEach(r => { if (r.some(c => c !== "")) lines.push(r.join("\t")); });
    }
    return lines.join("\n").slice(0, MAX);
  }

  // PDF
  if (ext === "pdf") {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
    ).toString();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((it: { str?: string }) => it.str ?? "").join(" "));
    }
    return pages.join("\n\n").slice(0, MAX);
  }

  throw new Error(`.${ext} não suportado. Use CSV, TXT, XLSX ou PDF.`);
}

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
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)} 40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)} 80%{transform:translateX(6px)}
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .pin-card { animation: fadeUp .35s ease-out both; }
      `}</style>
      <div className={cn(
        "pin-card w-full max-w-sm bg-gray-900 rounded-2xl p-8 space-y-6 border border-gray-800 shadow-2xl shadow-black/60",
        shake && "animate-[shake_0.4s_ease-in-out]"
      )}>
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">Rico · GNX</h2>
            <p className="text-sm text-gray-500 mt-0.5">Prestação de contas · Área restrita</p>
          </div>
        </div>

        {/* PIN input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-widest">Senha de acesso</label>
          <div className="relative">
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              value={pin}
              onChange={e => setPin(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === "Enter") tryUnlock(); }}
              placeholder="••••••"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 text-white text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 placeholder:tracking-normal placeholder:text-base transition-colors"
            />
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={tryUnlock}
          disabled={!pin}
          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-gray-950 font-bold text-sm transition-all"
        >
          Entrar
        </button>

        <div className="pt-1">
          <button
            onClick={() => navigate("/conta-colaborador")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/5 border border-gray-800 hover:border-emerald-500/30 transition-all"
          >
            <UserCircle2 className="w-4 h-4" />
            Sou colaborador — ver meus honorários
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
    if (!url) return;
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

// ── Input / Button primitivos ─────────────────────────────────────────────────
const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors";
const selectCls = inputCls + " appearance-none cursor-pointer";

function Btn({ onClick, disabled, loading: ld, children, variant = "primary", className = "" }: {
  onClick?: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; variant?: "primary" | "ghost" | "danger"; className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const vars = {
    primary: "bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-4 py-2.5",
    ghost: "text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2",
    danger: "text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1.5",
  };
  return (
    <button onClick={onClick} disabled={disabled || ld} className={cn(base, vars[variant], className)}>
      {ld ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex items-start gap-3">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-4 h-4 text-gray-950" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-lg font-bold text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── PeriodSelector ────────────────────────────────────────────────────────────
function PeriodSelector({ periods, selected, onChange, onNew }: {
  periods: Period[]; selected: number | null;
  onChange: (id: number) => void; onNew: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={selected ?? ""}
          onChange={e => onChange(Number(e.target.value))}
          className="appearance-none bg-gray-800 border border-gray-700 text-white rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="">Selecionar período…</option>
          {periods.map(p => (
            <option key={p.id} value={p.id}>{p.descricao}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
      </div>
      <Btn onClick={onNew} variant="ghost" className="border border-gray-700 hover:border-emerald-500/40">
        <Plus className="w-3.5 h-3.5" /> Período
      </Btn>
    </div>
  );
}

// ── Formulários ───────────────────────────────────────────────────────────────
function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
      {children}
    </div>
  );
}

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
        period_id: periodId, descricao: form.descricao, valor: parseFloat(form.valor),
        regra: form.regra, cliente: form.cliente || undefined, data: form.data || undefined,
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
    <FormCard title="Nova Receita">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className={inputCls} placeholder="Descrição *" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
        <input className={inputCls} placeholder="Valor (R$) *" type="number" step="0.01" value={form.valor} onChange={e => set("valor", e.target.value)} />
        <input className={inputCls} placeholder="Cliente" value={form.cliente} onChange={e => set("cliente", e.target.value)} />
        <input className={inputCls} type="date" value={form.data} onChange={e => set("data", e.target.value)} />
        <div className="relative">
          <select className={selectCls} value={form.regra} onChange={e => set("regra", e.target.value)}>
            {Object.entries(REGRAS).map(([k, v]) => <option key={k} value={k}>Regra {k} — {v}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select className={selectCls} value={form.resp_member_id} onChange={e => set("resp_member_id", e.target.value)}>
            <option value="">Responsável…</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
        {["2","3"].includes(form.regra) && (
          <div className="relative">
            <select className={selectCls} value={form.captacao_member_id} onChange={e => set("captacao_member_id", e.target.value)}>
              <option value="">Captação…</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>
        )}
        {["3","4"].includes(form.regra) && (
          <div className="relative">
            <select className={selectCls} value={form.aux1_member_id} onChange={e => set("aux1_member_id", e.target.value)}>
              <option value="">Auxiliar…</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>
        )}
      </div>
      <Btn onClick={submit} loading={saving} className="w-full">
        <Plus className="w-4 h-4" /> Registrar Receita
      </Btn>
    </FormCard>
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
    <FormCard title="Nova Despesa">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className={inputCls} placeholder="Descrição *" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
        <input className={inputCls} placeholder="Valor (R$) *" type="number" step="0.01" value={form.valor} onChange={e => set("valor", e.target.value)} />
        <input className={inputCls} type="date" value={form.data} onChange={e => set("data", e.target.value)} />
        <div className="relative">
          <select className={selectCls} value={form.member_id} onChange={e => set("member_id", e.target.value)}>
            <option value="">Membro (reembolso)…</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-gray-400 cursor-pointer select-none">
        <input
          type="checkbox" checked={form.reembolso}
          onChange={e => set("reembolso", e.target.checked)}
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500/30"
        />
        É reembolso (crédito para o membro)
      </label>
      <Btn onClick={submit} loading={saving} className="w-full">
        <Plus className="w-4 h-4" /> Registrar Despesa
      </Btn>
    </FormCard>
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
      toast.success("NF registrada!");
      setForm({ descricao: "", valor_nf: "", valor_imposto: "", cliente: "", data_emissao: "" });
      onSave();
    } catch { toast.error("Erro ao salvar imposto."); }
    finally { setSaving(false); }
  };

  return (
    <FormCard title="Nova NF / Imposto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className={inputCls} placeholder="Descrição *" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
        <input className={inputCls} placeholder="Cliente" value={form.cliente} onChange={e => set("cliente", e.target.value)} />
        <input className={inputCls} placeholder="Valor NF (R$) *" type="number" step="0.01" value={form.valor_nf} onChange={e => set("valor_nf", e.target.value)} />
        <input className={inputCls} placeholder="Valor Imposto (R$) *" type="number" step="0.01" value={form.valor_imposto} onChange={e => set("valor_imposto", e.target.value)} />
        <input className={inputCls} type="date" value={form.data_emissao} onChange={e => set("data_emissao", e.target.value)} />
      </div>
      <Btn onClick={submit} loading={saving} className="w-full">
        <Plus className="w-4 h-4" /> Registrar NF / Imposto
      </Btn>
    </FormCard>
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
    <FormCard title="Novo Adiantamento">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <select className={selectCls} value={form.member_id} onChange={e => set("member_id", e.target.value)}>
            <option value="">Membro *</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
        <input className={inputCls} placeholder="Valor (R$) *" type="number" step="0.01" value={form.valor} onChange={e => set("valor", e.target.value)} />
        <input className={inputCls} placeholder="Descrição" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
        <input className={inputCls} type="date" value={form.data} onChange={e => set("data", e.target.value)} />
      </div>
      <Btn onClick={submit} loading={saving} className="w-full">
        <Plus className="w-4 h-4" /> Registrar Adiantamento
      </Btn>
    </FormCard>
  );
}

// ── Tabela genérica dark ──────────────────────────────────────────────────────
function DataTable({ headers, children, empty }: {
  headers: string[]; children: React.ReactNode; empty?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {headers.map(h => (
                <th key={h} className={cn(
                  "px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider",
                  h === "" ? "" : "text-left"
                )}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {children}
          </tbody>
        </table>
        {!children || (Array.isArray(children) && children.every(c => !c)) ? (
          <p className="py-12 text-center text-sm text-gray-600">{empty || "Sem registros."}</p>
        ) : null}
      </div>
    </div>
  );
}

function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 text-gray-300", className)}>{children}</td>;
}

// ── Chat do Agente Rico ───────────────────────────────────────────────────────
interface ChatMsg { role: "user" | "assistant"; text: string; }

interface AttachedFile { name: string; text: string; size: number; }

function AgentChat() {
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [rawHistory, setRawHistory] = useState<object[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toolRunning, setToolRunning] = useState("");
  const [attached, setAttached] = useState<AttachedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, toolRunning]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const text = await extractFileText(file);
      setAttached({ name: file.name, text, size: file.size });
      toast.success(`${file.name} carregado`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao ler arquivo", { duration: 6000 });
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    const userText = input.trim();
    if (!userText && !attached) return;
    if (loading) return;

    const displayMsg = attached ? `📎 ${attached.name}${userText ? `\n${userText}` : ""}` : userText;
    const defaultFileInstruction =
      "Leia o arquivo acima e faça o seguinte:\n" +
      "1. Identifique TODOS os lançamentos (despesas, receitas, impostos, adiantamentos).\n" +
      "2. Apresente uma tabela com: descrição, valor (R$) e tipo de cada item.\n" +
      "3. Calcule o total por categoria.\n" +
      "4. Pergunte em qual período devo registrar e aguarde minha confirmação antes de gravar qualquer coisa.";

    const apiMsg = attached
      ? `[ARQUIVO ANEXADO: ${attached.name}]\n---\n${attached.text}\n---\n\n${userText || defaultFileInstruction}`
      : userText;

    setInput("");
    setAttached(null);
    setLoading(true);
    setHistory(h => [...h, { role: "user", text: displayMsg }]);
    let assistantText = "";
    setHistory(h => [...h, { role: "assistant", text: "" }]);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: rawHistory, message: apiMsg }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
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
              setHistory(h => { const c = [...h]; c[c.length-1] = { role: "assistant", text: assistantText }; return c; });
              setToolRunning("");
            } else if (ev.type === "tool_call") {
              setToolRunning(ev.name);
            } else if (ev.type === "tool_result" || ev.type === "done") {
              setToolRunning("");
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Erro de conexão";
      setHistory(h => { const c = [...h]; c[c.length-1] = { role: "assistant", text: `Erro: ${errMsg}` }; return c; });
    } finally {
      setLoading(false);
      setToolRunning("");
      setRawHistory(h => [...h, { role: "user", content: apiMsg }, { role: "assistant", content: assistantText }]);
    }
  };

  const SUGGESTIONS = ["Calcular relatório do mês atual", "Comparar últimos dois períodos", "Listar honorários dos membros"];

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[480px] bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800 bg-gray-900">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <span className="text-lg">💰</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Rico · Agente IA</p>
          <p className="text-xs text-gray-500">Especialista em prestação de contas GNX</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-500">online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-300">Olá, sou o Rico.</p>
              <p className="text-xs text-gray-600 mt-1 max-w-xs">
                Posso calcular relatórios, registrar lançamentos e analisar seus resultados financeiros.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-xs bg-gray-800 border border-gray-700 rounded-full px-3.5 py-2 hover:border-emerald-500/40 hover:text-emerald-400 text-gray-400 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs">💰</span>
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
              m.role === "user"
                ? "bg-emerald-500 text-gray-950 font-medium rounded-br-sm"
                : "bg-gray-800 text-gray-200 rounded-bl-sm"
            )}>
              {m.text || (m.role === "assistant" && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs">💰</span>
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs text-emerald-400 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              {toolRunning
                ? <span className="font-mono">{toolRunning}</span>
                : <span>Em andamento…</span>
              }
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 bg-gray-900/80">
        {/* Arquivo anexado */}
        {attached && (
          <div className="flex items-center gap-2 px-3 pt-2.5">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-xs text-emerald-400 max-w-xs">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{attached.name}</span>
              <span className="text-gray-600 flex-shrink-0">({(attached.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button onClick={() => setAttached(null)} className="text-gray-600 hover:text-red-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 p-3">
          {/* Upload */}
          <input ref={fileRef} type="file" className="hidden"
            accept=".pdf,.csv,.txt,.xlsx,.xls,.tsv,.ofx"
            onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || loading}
            title="Anexar arquivo (PDF, CSV, Excel, TXT)"
            className="p-2.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>
          <textarea
            className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 min-h-[42px] max-h-32 transition-colors"
            placeholder={attached ? "Mensagem sobre o arquivo (opcional)…" : "Pergunte ao Rico…"}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button
            onClick={send}
            disabled={loading || (!input.trim() && !attached)}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-700 pb-2">PDF · CSV · Excel · TXT · OFX</p>
      </div>
    </div>
  );
}

// ── Calculadora de Distribuição ───────────────────────────────────────────────
const REGRAS_CALC: Record<string, { agencia: number; responsavel: number; captacao?: number; auxiliar?: number }> = {
  "1": { agencia: 0.15, responsavel: 0.85 },
  "2": { agencia: 0.20, captacao: 0.10, responsavel: 0.70 },
  "3": { agencia: 0.15, captacao: 0.10, responsavel: 0.50, auxiliar: 0.25 },
  "4": { agencia: 0.20, responsavel: 0.50, auxiliar: 0.30 },
  "5": { agencia: 0.30, responsavel: 0.70 },
};

function DistribCalcModal({ onClose }: { onClose: () => void }) {
  const [valor, setValor] = useState("");
  const [regra, setRegra] = useState("1");

  const v = parseFloat(valor) || 0;
  const r = REGRAS_CALC[regra];

  const rows = [
    { label: "Agência", pct: r.agencia, color: "text-blue-400" },
    ...(r.captacao    ? [{ label: "Captação",    pct: r.captacao,    color: "text-purple-400" }] : []),
    ...(r.auxiliar    ? [{ label: "Auxiliar",    pct: r.auxiliar,    color: "text-amber-400"  }] : []),
    { label: "Responsável", pct: r.responsavel, color: "text-emerald-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl shadow-black/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Calc. de Distribuição</p>
              <p className="text-xs text-gray-500">Simule o rateio de uma receita</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Valor da receita (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">R$</span>
              <input
                type="number" step="0.01" value={valor}
                onChange={e => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Regra de distribuição</label>
            <div className="relative">
              <select
                value={regra} onChange={e => setRegra(e.target.value)}
                className="w-full appearance-none bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 pr-8"
              >
                {Object.keys(REGRAS_CALC).map(k => (
                  <option key={k} value={k}>Regra {k} — {REGRAS[k]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-gray-800/50 rounded-xl overflow-hidden divide-y divide-gray-800/80">
            {rows.map(({ label, pct, color }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-bold tabular-nums w-10", color)}>
                    {(pct * 100).toFixed(0)}%
                  </span>
                  <span className="text-sm text-gray-300">{label}</span>
                </div>
                <span className={cn("text-sm font-bold tabular-nums", color)}>
                  {fmt(v * pct)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800/60">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</span>
              <span className="text-sm font-bold text-white tabular-nums">{fmt(v)}</span>
            </div>
          </div>

          <button
            onClick={() => setValor("")}
            className="w-full py-2 rounded-xl text-xs text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-all"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Gate de PIN ───────────────────────────────────────────────────────────────
export default function ContaReportPage() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;
  return <ContaReportContent />;
}

// ── Conteúdo principal ────────────────────────────────────────────────────────
function ContaReportContent() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [showCalc, setShowCalc] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [newPeriod, setNewPeriod] = useState({ mes: "", ano: "", descricao: "" });
  const [showNewMember, setShowNewMember] = useState(false);
  const [newMemberNome, setNewMemberNome] = useState("");
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

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

  useEffect(() => {
    fetch(`${API}/healthz`).then(() => setApiOnline(true)).catch(() => setApiOnline(false));
  }, []);

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
      return toast.error("Preencha todos os campos.");
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
    if (!newMemberNome.trim()) return toast.error("Informe o nome.");
    try {
      await post("/api/members", { nome: newMemberNome.trim() });
      toast.success("Membro adicionado!");
      setNewMemberNome("");
      setShowNewMember(false);
      refetchMembers();
    } catch { toast.error("Erro ao criar membro."); }
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard",     label: "Dashboard",    icon: BarChart3 },
    { id: "receitas",      label: "Receitas",      icon: TrendingUp },
    { id: "despesas",      label: "Despesas",      icon: TrendingDown },
    { id: "impostos",      label: "Impostos",      icon: Receipt },
    { id: "adiantamentos", label: "Adiantamentos", icon: Wallet },
    { id: "relatorio",     label: "Relatório",     icon: FileBarChart },
    { id: "agente",        label: "Rico IA",        icon: Bot },
  ];

  const EmptyPeriod = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <Calendar className="w-10 h-10 text-gray-700" />
      <p className="text-sm text-gray-500">Selecione um período para continuar.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {showCalc && <DistribCalcModal onClose={() => setShowCalc(false)} />}

      {/* ── Header fixo ── */}
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">💰</span>
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-bold text-white leading-none">Prestação de Contas</p>
              <p className="text-xs text-gray-500 mt-0.5">GNX · {new Date().getFullYear()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
            {/* API status */}
            {apiOnline === false && (
              <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                <AlertCircle className="w-3 h-3" /> API offline
              </span>
            )}
            {apiOnline === true && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> online
              </span>
            )}

            {/* Calculadora */}
            <button
              onClick={() => setShowCalc(true)}
              title="Calculadora de distribuição"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-emerald-400 border border-gray-800 hover:border-emerald-500/30 transition-all"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calculadora</span>
            </button>

            {/* Colaboradores */}
            <button
              onClick={() => navigate("/conta-colaborador")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 transition-all"
            >
              <UserCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Colaboradores</span>
            </button>

            {/* Period selector */}
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

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
                  tab === t.id
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                )}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-5">

        {/* Modal novo período */}
        {showNewPeriod && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl shadow-black/40 space-y-4 max-w-sm">
            <h3 className="font-semibold text-sm text-white">Novo Período</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <input className={inputCls} placeholder="Mês (1-12)" type="number" min={1} max={12}
                value={newPeriod.mes} onChange={e => setNewPeriod(p => ({ ...p, mes: e.target.value }))} />
              <input className={inputCls} placeholder="Ano" type="number"
                value={newPeriod.ano} onChange={e => setNewPeriod(p => ({ ...p, ano: e.target.value }))} />
            </div>
            <input className={inputCls} placeholder="Descrição (ex: Maio/2025)"
              value={newPeriod.descricao} onChange={e => setNewPeriod(p => ({ ...p, descricao: e.target.value }))} />
            <div className="flex gap-2">
              <Btn onClick={createPeriod} className="flex-1">Criar</Btn>
              <Btn onClick={() => setShowNewPeriod(false)} variant="ghost" className="flex-1 border border-gray-700">Cancelar</Btn>
            </div>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div className="space-y-5">
            {!selectedPeriod ? <EmptyPeriod /> : loadingRel ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
            ) : relatorio ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label="Receitas" value={fmt(relatorio.total_receitas)} icon={TrendingUp} color="bg-emerald-500" />
                  <StatCard label="Despesas" value={fmt(relatorio.total_despesas)} icon={TrendingDown} color="bg-red-500" />
                  <StatCard label="Impostos" value={fmt(relatorio.total_impostos)} icon={Receipt} color="bg-amber-500" />
                  <StatCard label="Escritório" value={fmt(relatorio.total_escritorio)} icon={Wallet} color="bg-blue-500" />
                </div>

                {/* Saldo destacado */}
                <div className={cn(
                  "rounded-2xl p-5 border flex items-center justify-between",
                  relatorio.saldo_final >= 0
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-red-500/5 border-red-500/20"
                )}>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Saldo Final do Período</p>
                    <p className={cn("text-3xl font-bold tracking-tight mt-1", relatorio.saldo_final >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {fmt(relatorio.saldo_final)}
                    </p>
                  </div>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", relatorio.saldo_final >= 0 ? "bg-emerald-500/10" : "bg-red-500/10")}>
                    {relatorio.saldo_final >= 0 ? <TrendingUp className="w-6 h-6 text-emerald-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
                  </div>
                </div>

                {/* Tabela membros */}
                <DataTable headers={["Membro", "Honorários", "Desp.", "Adiant.", "Remb.", "Total"]}>
                  {relatorio.membros.map(m => (
                    <tr key={m.member_id} className="hover:bg-gray-800/30 transition-colors">
                      <Td><span className="font-semibold text-white">{m.nome}</span></Td>
                      <Td className="text-right text-emerald-400">{fmt(m.honorarios)}</Td>
                      <Td className="text-right text-red-400">{fmt(m.div_desp_escritorio)}</Td>
                      <Td className="text-right text-amber-400">{fmt(m.adiantamentos)}</Td>
                      <Td className="text-right text-blue-400">{fmt(m.reembolso)}</Td>
                      <Td className={cn("text-right font-bold", m.total >= 0 ? "text-emerald-300" : "text-red-300")}>{fmt(m.total)}</Td>
                    </tr>
                  ))}
                </DataTable>
              </>
            ) : null}

            {/* Membros */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" /> Membros da Equipe
                </h3>
                <Btn onClick={() => setShowNewMember(v => !v)} variant="ghost">
                  <Plus className="w-3.5 h-3.5" /> Membro
                </Btn>
              </div>
              {showNewMember && (
                <div className="flex gap-2 mb-4">
                  <input className={cn(inputCls, "flex-1")} placeholder="Nome do membro"
                    value={newMemberNome} onChange={e => setNewMemberNome(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") createMember(); }} />
                  <Btn onClick={createMember}>Adicionar</Btn>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {members?.map(m => (
                  <span key={m.id} className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border",
                    m.ativo
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-gray-800 text-gray-600 border-gray-700 line-through"
                  )}>
                    {m.nome}
                  </span>
                ))}
                {!members?.length && <p className="text-sm text-gray-600">Nenhum membro. Adicione o primeiro.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── RECEITAS ── */}
        {tab === "receitas" && (
          <div className="space-y-4">
            {selectedPeriod && members ? (
              <ReceitaForm periodId={selectedPeriod} members={members} onSave={refetchReceitas} />
            ) : <EmptyPeriod />}
            {selectedPeriod && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lançamentos</p>
                  <Btn onClick={refetchReceitas} variant="ghost"><RefreshCw className="w-3.5 h-3.5" /></Btn>
                </div>
                <DataTable headers={["Descrição", "Cliente", "Regra", "Valor", ""]} empty="Sem receitas neste período.">
                  {receitas?.map(r => (
                    <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                      <Td><span className="text-white font-medium">{r.descricao}</span></Td>
                      <Td className="text-gray-500">{r.cliente || "—"}</Td>
                      <Td><span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">R{r.regra}</span></Td>
                      <Td className="text-right font-semibold text-emerald-400">{fmt(r.valor)}</Td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={async () => { await del(`/api/receitas/${r.id}`); refetchReceitas(); toast.success("Removido"); }}
                          className="text-gray-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            )}
          </div>
        )}

        {/* ── DESPESAS ── */}
        {tab === "despesas" && (
          <div className="space-y-4">
            {selectedPeriod && members ? (
              <DespesaForm periodId={selectedPeriod} members={members} onSave={refetchDespesas} />
            ) : <EmptyPeriod />}
            {selectedPeriod && (
              <DataTable headers={["Descrição", "Tipo", "Valor", ""]} empty="Sem despesas neste período.">
                {despesas?.map(d => (
                  <tr key={d.id} className="hover:bg-gray-800/30 transition-colors">
                    <Td><span className="text-white font-medium">{d.descricao}</span></Td>
                    <Td>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", d.reembolso
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20")}>
                        {d.reembolso ? "Reembolso" : "Despesa"}
                      </span>
                    </Td>
                    <Td className={cn("text-right font-semibold", d.reembolso ? "text-blue-400" : "text-red-400")}>{fmt(d.valor)}</Td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={async () => { await del(`/api/despesas/${d.id}`); refetchDespesas(); toast.success("Removido"); }}
                        className="text-gray-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        )}

        {/* ── IMPOSTOS ── */}
        {tab === "impostos" && (
          <div className="space-y-4">
            {selectedPeriod ? (
              <ImpostoForm periodId={selectedPeriod} onSave={refetchImpostos} />
            ) : <EmptyPeriod />}
            {selectedPeriod && (
              <DataTable headers={["Descrição", "Cliente", "Valor NF", "Imposto", ""]} empty="Sem impostos neste período.">
                {impostos?.map(i => (
                  <tr key={i.id} className="hover:bg-gray-800/30 transition-colors">
                    <Td><span className="text-white font-medium">{i.descricao}</span></Td>
                    <Td className="text-gray-500">{i.cliente || "—"}</Td>
                    <Td className="text-right text-gray-300">{fmt(i.valor_nf)}</Td>
                    <Td className="text-right font-semibold text-amber-400">{fmt(i.valor_imposto)}</Td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={async () => { await del(`/api/impostos/${i.id}`); refetchImpostos(); toast.success("Removido"); }}
                        className="text-gray-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        )}

        {/* ── ADIANTAMENTOS ── */}
        {tab === "adiantamentos" && (
          <div className="space-y-4">
            {selectedPeriod && members ? (
              <AdiantamentoForm periodId={selectedPeriod} members={members} onSave={refetchAdiant} />
            ) : <EmptyPeriod />}
            {selectedPeriod && (
              <DataTable headers={["Membro", "Descrição", "Data", "Valor", ""]} empty="Sem adiantamentos neste período.">
                {adiantamentos?.map(a => (
                  <tr key={a.id} className="hover:bg-gray-800/30 transition-colors">
                    <Td><span className="text-white font-semibold">{members?.find(m => m.id === a.member_id)?.nome || `#${a.member_id}`}</span></Td>
                    <Td className="text-gray-400">{a.descricao}</Td>
                    <Td className="text-gray-500">{a.data || "—"}</Td>
                    <Td className="text-right font-semibold text-amber-400">{fmt(a.valor)}</Td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={async () => { await del(`/api/adiantamentos/${a.id}`); refetchAdiant(); toast.success("Removido"); }}
                        className="text-gray-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        )}

        {/* ── RELATÓRIO ── */}
        {tab === "relatorio" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Relatório Consolidado</p>
              <Btn onClick={loadRelatorio} variant="ghost"><RefreshCw className="w-3.5 h-3.5" /> Recalcular</Btn>
            </div>
            {!selectedPeriod ? <EmptyPeriod /> : loadingRel ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
            ) : relatorio ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: "Receitas", v: relatorio.total_receitas, c: "text-emerald-400" },
                    { label: "Despesas", v: relatorio.total_despesas, c: "text-red-400" },
                    { label: "Impostos", v: relatorio.total_impostos, c: "text-amber-400" },
                    { label: "Escritório", v: relatorio.total_escritorio, c: "text-blue-400" },
                    { label: "Saldo Final", v: relatorio.saldo_final, c: relatorio.saldo_final >= 0 ? "text-emerald-300" : "text-red-300" },
                  ].map(({ label, v, c }) => (
                    <div key={label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 text-center">
                      <p className="text-xs text-gray-600 uppercase tracking-wider">{label}</p>
                      <p className={cn("text-base font-bold mt-1", c)}>{fmt(v)}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-white">Demonstrativo dos Sócios</h3>
                    <button onClick={() => window.print()}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Imprimir PDF</button>
                  </div>
                  <DataTable headers={["Membro", "Honorários (+)", "Desp. (−)", "Adiant. (−)", "Remb. (+)", "TOTAL"]}>
                    {relatorio.membros.map(m => (
                      <tr key={m.member_id} className="hover:bg-gray-800/30 transition-colors">
                        <Td><span className="font-semibold text-white">{m.nome}</span></Td>
                        <Td className="text-right text-emerald-400">{fmt(m.honorarios)}</Td>
                        <Td className="text-right text-red-400">{fmt(m.div_desp_escritorio)}</Td>
                        <Td className="text-right text-amber-400">{fmt(m.adiantamentos)}</Td>
                        <Td className="text-right text-blue-400">{fmt(m.reembolso)}</Td>
                        <td className={cn("px-4 py-3 text-right font-bold text-base", m.total >= 0 ? "text-emerald-300" : "text-red-300")}>
                          {fmt(m.total)}
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-gray-600 py-12">Nenhum dado carregado.</p>
            )}
          </div>
        )}

        {/* ── AGENTE IA ── */}
        {tab === "agente" && <AgentChat />}

      </main>
    </div>
  );
}
