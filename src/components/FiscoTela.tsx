import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, RefreshCw, Copy, Loader2, AlertCircle, Receipt,
  ChevronRight, MessageSquare, ClipboardCheck, Share2, Trash2, Paperclip, X, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FiscoDiagnostico, { PERGUNTAS } from "@/components/FiscoDiagnostico";
import { supabase } from "@/integrations/supabase/client";
import {
  listarClientes, salvarCliente, removerCliente, contextoDoCliente,
  type ClienteFisco,
} from "@/lib/fiscoClientes";

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

const API = `${SUPABASE_URL}/functions/v1/fisco`;

// ── Types ──────────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  streaming?: boolean;
}

// ── Cor do tema ────────────────────────────────────────────────────────────────
const GOLD = "#F59E0B";
const GOLD_DIM = "#F59E0B22";
const GOLD_BORDER = "#F59E0B44";

// ── Perfis de atendimento ──────────────────────────────────────────────────────
// O Fisco fala com três públicos e isso muda o que ele assume que a pessoa já
// sabe. As perguntas rápidas seguem o perfil: as antigas só serviam a empresa
// de Fortaleza e não faziam sentido para quem só quer declarar o IRPF.
export type PerfilId = "pessoa" | "empresa" | "contabilidade";

const PERFIS: { id: PerfilId; label: string; desc: string; perguntas: string[] }[] = [
  {
    id: "pessoa",
    label: "Pessoa física",
    desc: "IRPF, autônomo, INSS, venda de bens",
    perguntas: [
      "Sou obrigado a declarar o Imposto de Renda este ano?",
      "Trabalho por conta própria: preciso pagar carnê-leão?",
      "Vendi um imóvel — vou pagar imposto sobre o lucro?",
      "Quais despesas posso deduzir na declaração?",
      "Quanto preciso contribuir para o INSS como autônomo?",
      "Vale mais a pena abrir CNPJ ou continuar como pessoa física?",
    ],
  },
  {
    id: "empresa",
    label: "Empresa",
    desc: "Regime, DAS, notas, obrigações",
    perguntas: [
      "Qual regime tributário é melhor para a minha empresa?",
      "Quanto minha empresa paga de imposto por mês?",
      "Quais obrigações mensais eu não posso perder?",
      "Como funciona pró-labore e distribuição de lucros?",
      "Quando vence o DAS do Simples Nacional?",
      "Como emitir NFS-e em Fortaleza?",
    ],
  },
  {
    id: "contabilidade",
    label: "Contabilidade",
    desc: "Técnico, com base legal — para quem é da área",
    perguntas: [
      "Como fica o Fator R no Anexo V com pró-labore no limite?",
      "Cronograma da CBS/IBS: o que muda na rotina do escritório em 2026?",
      "Quais adições e exclusões costumam ser questionadas no LALUR?",
      "EFD-Reinf x eSocial: onde as retenções se sobrepõem?",
      "Reenquadramento de regime no meio do ano: quando cabe?",
      "Distribuição de lucros acima da presunção: qual o risco atual?",
    ],
  },
];

/**
 * O `context_note` do link foi escrito à mão ("pessoa física", "contabilidade")
 * e não bate com o id do perfil. Sem normalizar, o link da pessoa física abria
 * como empresa.
 */
export function perfilDoTexto(texto: string | null | undefined): PerfilId | null {
  const t = (texto ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  if (!t) return null;
  if (t.startsWith("pessoa")) return "pessoa";
  if (t.startsWith("contab")) return "contabilidade";
  if (t.startsWith("empresa")) return "empresa";
  return null;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copiado!");
}

function uid() {
  return Math.random().toString(36).slice(2);
}

/**
 * Painel de links compartilhados — só aparece para a Carol, dentro da agência.
 * Cada perfil tem seu link, e a senha é gravada como hash pela RPC
 * `definir_senha_link`: não dá para exibir a atual, só trocar.
 */
interface LinkFisco {
  token: string;
  context_note: string | null;
  senha_hash: string | null;
}

function PainelLinks() {
  const [links, setLinks] = useState<LinkFisco[]>([]);
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("agent_links")
      .select("token, context_note, senha_hash")
      .eq("agent_id", "fisco").eq("active", true)
      .order("created_at");
    setLinks((data ?? []) as LinkFisco[]);
  }, []);

  useEffect(() => { if (aberto) carregar(); }, [aberto, carregar]);

  const salvarSenha = async (token: string) => {
    setSalvando(token);
    try {
      const { error } = await (supabase as any).rpc("definir_senha_link", {
        p_token: token,
        p_senha: (senha[token] ?? "").trim(),
      });
      if (error) throw error;
      toast.success((senha[token] ?? "").trim() ? "Senha salva." : "Senha removida — o link ficou aberto.");
      setSenha((s) => ({ ...s, [token]: "" }));
      await carregar();
    } catch {
      toast.error("Não consegui salvar a senha.");
    } finally {
      setSalvando(null);
    }
  };

  const url = (token: string) => `https://www.caluagencia.com.br/fisco/${token}`;

  return (
    <div className="px-5 pt-4">
      <button
        onClick={() => setAberto((a) => !a)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold"
        style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#9999AA" }}
      >
        <span className="flex items-center gap-2"><Share2 className="w-3.5 h-3.5" /> Compartilhar o Fisco</span>
        <span style={{ color: "#55556A" }}>{aberto ? "−" : "+"}</span>
      </button>

      {aberto && (
        <div className="flex flex-col gap-3 mt-2">
          {links.length === 0 && (
            <p className="text-[11px]" style={{ color: "#55556A" }}>Nenhum link criado ainda.</p>
          )}
          {links.map((l) => {
            const rotulo = PERFIS.find((p) => p.id === perfilDoTexto(l.context_note))?.label
              ?? "Link único — a pessoa escolhe o perfil";
            return (
              <div key={l.token} className="rounded-xl p-3" style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold" style={{ color: "#C0C0D0" }}>{rotulo}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: l.senha_hash ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
                      color: l.senha_hash ? "#34D399" : "#FBBF24",
                    }}>
                    {l.senha_hash ? "com senha" : "sem senha"}
                  </span>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(url(l.token));
                    setCopiado(l.token);
                    setTimeout(() => setCopiado(null), 2000);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-mono truncate mb-2"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: copiado === l.token ? GOLD : "#77778A" }}
                >
                  {copiado === l.token ? "Link copiado!" : `caluagencia.com.br/fisco/${l.token.slice(0, 10)}…`}
                </button>

                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={senha[l.token] ?? ""}
                    onChange={(e) => setSenha((s) => ({ ...s, [l.token]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") salvarSenha(l.token); }}
                    placeholder={l.senha_hash ? "Nova senha (substitui a atual)" : "Definir senha"}
                    className="flex-1 rounded-lg px-2 py-1.5 text-[11px] outline-none"
                    style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                  />
                  <button
                    onClick={() => salvarSenha(l.token)}
                    disabled={salvando === l.token}
                    className="px-2.5 rounded-lg text-[11px] font-bold"
                    style={{ background: GOLD, color: "#07080A" }}
                  >
                    {salvando === l.token ? "…" : "Salvar"}
                  </button>
                </div>
                {l.senha_hash && (
                  <p className="text-[9px] mt-1.5 leading-relaxed" style={{ color: "#55556A" }}>
                    A senha atual não pode ser exibida (fica criptografada). Digite outra para substituir, ou salve em branco para abrir o link.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Componente ─────────────────────────────────────────────────────────────────
/**
 * A mesma tela serve dois lugares: dentro da agência (com a barra lateral do
 * OmniCRM em volta) e no link compartilhado, onde ela é a página inteira. No
 * link, o público já vem definido pelo link — quem recebe não escolhe o perfil.
 */
interface Props {
  /** Link dedicado a um público: trava o perfil e some com o seletor. */
  perfilFixo?: PerfilId;
  /** Link único: começa no que a pessoa escolheu, mas ela pode trocar. */
  perfilInicial?: PerfilId;
  /** Só na agência: painel para gerar link e definir a senha de acesso. */
  gerenciarLinks?: boolean;
}

export default function FiscoTela({ perfilFixo, perfilInicial, gerenciarLinks = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [perfil, setPerfil] = useState<PerfilId>(() => {
    if (perfilFixo) return perfilFixo;
    if (perfilInicial) return perfilInicial;
    const salvo = localStorage.getItem("fisco-perfil");
    return (salvo === "pessoa" || salvo === "empresa" || salvo === "contabilidade") ? salvo : "empresa";
  });
  // Duas formas de usar o Fisco: tirar uma dúvida solta, ou fazer o diagnóstico
  // completo (questionário + documentos + relatório do que precisa ser feito).
  const [modo, setModo] = useState<"chat" | "diagnostico">("chat");
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  // Clientes salvos: quem já respondeu uma vez não redigita a cada conversa.
  const [clientes, setClientes] = useState<ClienteFisco[]>(() => listarClientes());
  const [clienteAtivo, setClienteAtivo] = useState<ClienteFisco | null>(null);

  // Anexo na conversa (o diagnóstico tem o próprio passo de documentos).
  const [anexos, setAnexos] = useState<File[]>([]);
  const anexoRef = useRef<HTMLInputElement>(null);

  const guardarCliente = (nome: string, perfilCliente: PerfilId, respostas: Record<string, string>) => {
    const lista = salvarCliente(nome, perfilCliente, respostas);
    setClientes(lista);
    const salvo = lista.find((c) => c.nome.toLowerCase() === nome.trim().toLowerCase() && c.perfil === perfilCliente);
    if (salvo) setClienteAtivo(salvo);
    toast.success(`${nome.trim()} salvo.`);
  };

  const apagarCliente = (id: string) => {
    setClientes(removerCliente(id));
    setClienteAtivo((c) => (c?.id === id ? null : c));
  };

  const escolherCliente = (c: ClienteFisco | null) => {
    setClienteAtivo(c);
    if (c && !perfilFixo) setPerfil(c.perfil);
  };

  /** O que o Fisco sabe do cliente escolhido, para não perguntar de novo. */
  const contexto = useMemo(() => {
    if (!clienteAtivo) return "";
    const rotulos: Record<string, string> = {};
    for (const campo of PERGUNTAS[clienteAtivo.perfil]) rotulos[campo.id] = campo.pergunta;
    return contextoDoCliente(clienteAtivo, rotulos);
  }, [clienteAtivo]);

  const adicionarAnexos = (lista: FileList | null) => {
    if (!lista) return;
    const novos: File[] = [];
    for (const f of Array.from(lista)) {
      if (anexos.length + novos.length >= 4) { toast.error("Máximo de 4 arquivos por mensagem."); break; }
      if (f.size > 4 * 1024 * 1024) { toast.error(`${f.name} passa de 4 MB.`); continue; }
      if (f.type !== "application/pdf" && !f.type.startsWith("image/")) {
        toast.error(`${f.name}: envie PDF ou imagem.`); continue;
      }
      novos.push(f);
    }
    setAnexos((p) => [...p, ...novos]);
  };

  const lerBase64 = (f: File) => new Promise<string>((ok, erro) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = () => erro(new Error(`Não consegui ler ${f.name}`));
    r.readAsDataURL(f);
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const historico = messages
    .filter((m) => !m.streaming)
    .map((m) => ({ role: m.role, content: m.content }));

  const enviar = useCallback(async (texto: string) => {
    const msg = texto.trim();
    if ((!msg && !anexos.length) || carregando) return;

    setErro("");
    setInput("");
    setCarregando(true);

    const enviados = anexos;
    setAnexos([]);

    const rotuloAnexos = enviados.length
      ? `\n\n📎 ${enviados.map((f) => f.name).join(", ")}`
      : "";
    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: (msg || "Analise o arquivo que enviei.") + rotuloAnexos,
    };
    const assistantId = uid();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const documentos = await Promise.all(
        enviados.map(async (f) => ({ nome: f.name, tipo: f.type, base64: await lerBase64(f) })),
      );

      const resp = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          "apikey": SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ mensagem: msg, historico, perfil, documentos, contexto }),
      });

      if (!resp.ok) throw new Error(`Erro ${resp.status} — Fisco indisponível.`);
      if (!resp.body) throw new Error("Stream não disponível.");

      const reader = resp.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split("\n\n");
        buffer = linhas.pop() ?? "";

        for (const linha of linhas) {
          if (!linha.startsWith("data: ")) continue;
          const payload = JSON.parse(linha.slice(6));

          if (payload.tipo === "erro") throw new Error(payload.mensagem ?? "Erro desconhecido");

          if (payload.tipo === "texto") {
            fullText += payload.conteudo;
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m)
            );
          }

          if (payload.tipo === "fim") {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m)
            );
          }
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      const msg = err?.message ?? "Erro desconhecido";
      setErro(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      toast.error("Fisco indisponível. Tente novamente em instantes.");
    } finally {
      setCarregando(false);
      inputRef.current?.focus();
    }
  }, [carregando, historico, perfil, anexos, contexto]);

  const limpar = () => {
    readerRef.current?.cancel();
    setMessages([]);
    setErro("");
    setCarregando(false);
    setInput("");
    setAnexos([]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar(input);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row overflow-auto md:overflow-hidden",
        // Na agência sobra o cabeçalho do OmniCRM; no link, a tela é a página toda.
        gerenciarLinks ? "md:h-[calc(100vh-4rem)]" : "md:h-screen",
      )}
      style={{ background: "#07080A" }}
    >
      {/* ── Painel esquerdo ──────────────────────────────────── */}
      <div
        className="flex flex-col w-full md:w-[300px] md:min-w-[260px] flex-shrink-0 border-b md:border-b-0 md:border-r"
        style={{ borderColor: "#1E1E2E", background: "#0A0A10" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#1E1E2E" }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
          >
            <Receipt className="w-5 h-5" style={{ color: GOLD }} />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: "#F0F0F0" }}>Fisco</div>
            <div className="text-[11px]" style={{ color: GOLD, opacity: 0.8 }}>
              Consultor Contábil IA
            </div>
          </div>
        </div>

        {/* Como usar */}
        <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: "#1E1E2E" }}>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: "chat", label: "Conversar", desc: "Dúvida solta", Icone: MessageSquare },
              { id: "diagnostico", label: "Diagnóstico", desc: "Com relatório", Icone: ClipboardCheck },
            ] as const).map((m) => {
              const ativo = modo === m.id;
              return (
                <button key={m.id} onClick={() => setModo(m.id)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                  style={{ background: ativo ? GOLD_DIM : "#141420", border: `1px solid ${ativo ? GOLD : "#2A2A3A"}` }}>
                  <m.Icone className="w-4 h-4" style={{ color: ativo ? GOLD : "#666680" }} />
                  <span className="text-[11px] font-semibold" style={{ color: ativo ? GOLD : "#9999AA" }}>{m.label}</span>
                  <span className="text-[9px]" style={{ color: "#55556A" }}>{m.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills */}
        <div className="px-5 py-3 border-b" style={{ borderColor: "#1E1E2E" }}>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>Especialidades</p>
          <div className="flex flex-wrap gap-2">
            {[
              { emoji: "📄", label: "Notas Fiscais" },
              { emoji: "📊", label: "Tributos" },
              { emoji: "📅", label: "Obrigações" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium"
                style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, color: GOLD }}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Para quem ele está falando — no link, quem define é o link */}
        {perfilFixo ? (
          <div className="px-5 pt-4">
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>
              Estou atendendo
            </p>
            <div className="px-3 py-2 rounded-xl" style={{ background: GOLD_DIM, border: `1px solid ${GOLD}` }}>
              <span className="block text-[12px] font-semibold" style={{ color: GOLD }}>
                {(PERFIS.find((p) => p.id === perfilFixo) ?? PERFIS[1]).label}
              </span>
              <span className="block text-[10px] mt-0.5" style={{ color: "#77778A" }}>
                {(PERFIS.find((p) => p.id === perfilFixo) ?? PERFIS[1]).desc}
              </span>
            </div>
          </div>
        ) : (
        <div className="px-5 pt-4">
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>
            Estou atendendo
          </p>
          <div className="flex flex-col gap-1.5">
            {PERFIS.map((p) => {
              const ativo = p.id === perfil;
              return (
                <button
                  key={p.id}
                  onClick={() => { setPerfil(p.id); localStorage.setItem("fisco-perfil", p.id); }}
                  className="text-left px-3 py-2 rounded-xl transition-all"
                  style={{
                    background: ativo ? GOLD_DIM : "#141420",
                    border: `1px solid ${ativo ? GOLD : "#2A2A3A"}`,
                  }}
                >
                  <span className="block text-[12px] font-semibold" style={{ color: ativo ? GOLD : "#C0C0D0" }}>
                    {p.label}
                  </span>
                  <span className="block text-[10px] mt-0.5" style={{ color: "#77778A" }}>
                    {p.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Clientes salvos */}
        <div className="px-5 pt-4">
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>
            Cliente
          </p>
          {clientes.length === 0 ? (
            <p className="text-[11px] leading-relaxed" style={{ color: "#55556A" }}>
              Faça um diagnóstico e salve as respostas com um nome — depois é só escolher aqui,
              sem redigitar nada.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => escolherCliente(null)}
                className="text-left px-3 py-1.5 rounded-lg text-[11px] transition-all"
                style={{
                  background: !clienteAtivo ? GOLD_DIM : "#141420",
                  border: `1px solid ${!clienteAtivo ? GOLD : "#2A2A3A"}`,
                  color: !clienteAtivo ? GOLD : "#8888A0",
                }}
              >
                Nenhum — atendimento avulso
              </button>
              {clientes.map((c) => {
                const ativo = clienteAtivo?.id === c.id;
                return (
                  <div key={c.id} className="flex items-center gap-1">
                    <button
                      onClick={() => escolherCliente(c)}
                      className="flex-1 text-left px-3 py-1.5 rounded-lg text-[11px] truncate transition-all"
                      style={{
                        background: ativo ? GOLD_DIM : "#141420",
                        border: `1px solid ${ativo ? GOLD : "#2A2A3A"}`,
                        color: ativo ? GOLD : "#C0C0D0",
                      }}
                      title={`${c.nome} · ${PERFIS.find((p) => p.id === c.perfil)?.label ?? c.perfil}`}
                    >
                      {c.nome}
                    </button>
                    <button
                      onClick={() => apagarCliente(c.id)}
                      className="p-1 rounded-lg flex-shrink-0"
                      style={{ color: "#44445A" }}
                      title="Remover cliente salvo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {clienteAtivo && (
            <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "#55556A" }}>
              O Fisco já sabe os dados de {clienteAtivo.nome} e não vai perguntar de novo.
            </p>
          )}
        </div>

        {gerenciarLinks && <PainelLinks />}

        {/* Perguntas rápidas — só fazem sentido no chat */}
        {modo === "chat" ? (
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#444466" }}>
            Perguntas frequentes
          </p>
          <div className="flex flex-col gap-2">
            {(PERFIS.find((p) => p.id === perfil) ?? PERFIS[1]).perguntas.map((q) => (
              <button
                key={q}
                onClick={() => enviar(q)}
                disabled={carregando}
                className="flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-[12px] transition-all group"
                style={{
                  background: "#141420",
                  border: "1px solid #2A2A3A",
                  color: "#888899",
                  cursor: carregando ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD_BORDER; e.currentTarget.style.color = "#C0C0D0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A2A3A"; e.currentTarget.style.color = "#888899"; }}
              >
                <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: GOLD, opacity: 0.6 }} />
                {q}
              </button>
            ))}
          </div>
        </div>
        ) : (
          <div className="flex-1 px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>Como funciona</p>
            <ol className="flex flex-col gap-2 text-[11px]" style={{ color: "#77778A" }}>
              <li>1. Você responde o questionário do seu perfil</li>
              <li>2. Anexa documento se tiver (eu leio o conteúdo)</li>
              <li>3. Recebe o relatório com o que precisa ser feito, em ordem de prioridade e com prazo</li>
            </ol>
          </div>
        )}

        {/* Botão limpar */}
        {modo === "chat" && (
        <div className="px-5 pb-5">
          <button
            onClick={limpar}
            disabled={messages.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all"
            style={{
              background: "#141420",
              border: "1px solid #2A2A3A",
              color: messages.length === 0 ? "#333344" : "#666688",
              cursor: messages.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Nova conversa
          </button>
        </div>
        )}
      </div>

      {/* ── Painel direito ────────────────────────────────────── */}
      {modo === "diagnostico" ? (
        <FiscoDiagnostico
          key={`${perfil}-${clienteAtivo?.id ?? "avulso"}`}
          perfilInicial={perfil}
          cliente={clienteAtivo}
          onSalvarCliente={guardarCliente}
        />
      ) : (
      <div className="flex-1 flex flex-col overflow-hidden min-h-[400px] md:min-h-0">

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
          <AnimatePresence initial={false}>

            {/* Estado vazio */}
            {messages.length === 0 && (
              <motion.div
                key="vazio"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-4 h-full min-h-[300px]"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
                >
                  <Receipt className="w-8 h-8" style={{ color: GOLD }} />
                </div>
                <div className="text-center">
                  <p className="font-semibold mb-1" style={{ color: "#888899" }}>
                    Olá! Sou o Fisco, seu consultor contábil IA.
                  </p>
                  <p className="text-sm" style={{ color: "#444466" }}>
                    Tire dúvidas sobre notas fiscais, tributos, obrigações e mais.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Mensagens */}
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
                  >
                    <Receipt className="w-4 h-4" style={{ color: GOLD }} />
                  </div>
                )}

                <div
                  className="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed group relative"
                  style={
                    msg.role === "user"
                      ? { background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, color: "#E0E0F0" }
                      : { background: "#141420", border: "1px solid #2A2A3A", color: "#C0C0D0" }
                  }
                >
                  <pre className="whitespace-pre-wrap font-sans">
                    {msg.content}
                    {msg.streaming && (
                      <span
                        className="inline-block w-2 h-4 ml-0.5 animate-pulse rounded-sm"
                        style={{ background: GOLD, verticalAlign: "middle" }}
                      />
                    )}
                  </pre>

                  {/* Botão copiar */}
                  {!msg.streaming && msg.role === "assistant" && msg.content && (
                    <button
                      onClick={() => copyToClipboard(msg.content)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                      style={{ background: "#1E1E2E" }}
                      title="Copiar"
                    >
                      <Copy className="w-3 h-3" style={{ color: "#666688" }} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Erro */}
            {erro && (
              <motion.div
                key="erro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl"
                style={{ background: "#2A1010", border: "1px solid #5A2020", color: "#F87171" }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {erro}
              </motion.div>
            )}

          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: "#1E1E2E" }}>
          {/* Anexos escolhidos, antes de mandar */}
          {anexos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {anexos.map((f, i) => (
                <div key={`${f.name}-${i}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px]"
                  style={{ background: "#141420", border: `1px solid ${GOLD_BORDER}`, color: "#C0C0D0" }}>
                  <FileText className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                  <span className="truncate max-w-[160px]">{f.name}</span>
                  <button onClick={() => setAnexos((p) => p.filter((_, n) => n !== i))}>
                    <X className="w-3 h-3" style={{ color: "#666680" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className="flex items-end gap-2 rounded-2xl px-4 py-3"
            style={{ background: "#141420", border: `1px solid ${carregando ? GOLD_BORDER : "#2A2A3A"}` }}
          >
            <button
              onClick={() => anexoRef.current?.click()}
              disabled={carregando}
              className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 transition-all"
              style={{ background: "#1E1E2E", color: anexos.length ? GOLD : "#666680" }}
              title="Anexar PDF ou imagem"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={anexoRef}
              type="file"
              multiple
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => { adicionarAnexos(e.target.files); e.currentTarget.value = ""; }}
            />
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 resize-none outline-none text-sm bg-transparent leading-relaxed"
              style={{ color: "#E0E0F0", fontFamily: "inherit", maxHeight: 160 }}
              placeholder={anexos.length ? "O que você quer saber sobre esse arquivo?" : "Tire sua dúvida fiscal ou contábil..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={carregando}
            />
            <button
              onClick={() => enviar(input)}
              disabled={(!input.trim() && !anexos.length) || carregando}
              className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 transition-all"
              style={{
                background: (input.trim() || anexos.length) && !carregando ? GOLD : "#1E1E2E",
                color: (input.trim() || anexos.length) && !carregando ? "#07080A" : "#333344",
                cursor: (input.trim() || anexos.length) && !carregando ? "pointer" : "not-allowed",
              }}
            >
              {carregando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[11px] mt-2 text-center" style={{ color: "#333355" }}>
            📎 PDF ou foto, até 4 arquivos · Enter para enviar · O Fisco orienta, não substitui contador
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
