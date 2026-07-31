import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, RefreshCw, Copy, Loader2, AlertCircle, Receipt,
  ChevronRight, MessageSquare, ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FiscoDiagnostico from "@/components/FiscoDiagnostico";

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
type PerfilId = "pessoa" | "empresa" | "contabilidade";

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

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copiado!");
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function FiscoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [perfil, setPerfil] = useState<PerfilId>(() => {
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const historico = messages
    .filter((m) => !m.streaming)
    .map((m) => ({ role: m.role, content: m.content }));

  const enviar = useCallback(async (texto: string) => {
    const msg = texto.trim();
    if (!msg || carregando) return;

    setErro("");
    setInput("");
    setCarregando(true);

    const userMsg: Message = { id: uid(), role: "user", content: msg };
    const assistantId = uid();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const resp = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          "apikey": SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ mensagem: msg, historico, perfil }),
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
  }, [carregando, historico, perfil]);

  const limpar = () => {
    readerRef.current?.cancel();
    setMessages([]);
    setErro("");
    setCarregando(false);
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar(input);
    }
  };

  return (
    <div
      className="flex flex-col md:flex-row md:h-[calc(100vh-4rem)] overflow-auto md:overflow-hidden"
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

        {/* Para quem ele está falando */}
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
        <FiscoDiagnostico key={perfil} perfilInicial={perfil} />
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
          <div
            className="flex items-end gap-2 rounded-2xl px-4 py-3"
            style={{ background: "#141420", border: `1px solid ${carregando ? GOLD_BORDER : "#2A2A3A"}` }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 resize-none outline-none text-sm bg-transparent leading-relaxed"
              style={{ color: "#E0E0F0", fontFamily: "inherit", maxHeight: 160 }}
              placeholder="Tire sua dúvida fiscal ou contábil..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={carregando}
            />
            <button
              onClick={() => enviar(input)}
              disabled={!input.trim() || carregando}
              className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 transition-all"
              style={{
                background: input.trim() && !carregando ? GOLD : "#1E1E2E",
                color: input.trim() && !carregando ? "#07080A" : "#333344",
                cursor: input.trim() && !carregando ? "pointer" : "not-allowed",
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
            Enter para enviar · Shift+Enter para nova linha · O Fisco orienta, não substitui contador
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
