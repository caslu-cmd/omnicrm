import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Loader2, Download, Sparkles, RefreshCw, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import AIFieldButton from "@/components/AIFieldButton";

const API = "http://localhost:9000";

type Etapa = "idle" | "upload_layout" | "extraindo" | "organizando" | "gerando" | "concluido" | "erro";

interface FileSlot {
  file: File | null;
  label: string;
  key: "capa" | "interna" | "contracapa";
  icon: string;
}

const ETAPAS_PROG = [
  { id: "extraindo",   label: "Lendo",       desc: "Lendo arquivos dos professores" },
  { id: "organizando", label: "Editando",    desc: "Organizando como editor"        },
  { id: "gerando",     label: "Gerando",     desc: "Montando o PDF final"           },
  { id: "concluido",   label: "Pronto",      desc: "Apostila gerada!"               },
] as const;

function etapaIdx(e: Etapa): number {
  const map: Record<string, number> = { extraindo: 0, organizando: 1, gerando: 2, concluido: 3 };
  return map[e] ?? -1;
}

function DropZone({
  slot, onFile, disabled,
}: {
  slot: FileSlot;
  onFile: (key: string, file: File) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handle = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Envie apenas arquivos PDF");
      return;
    }
    onFile(slot.key, f);
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handle(f);
      }}
      className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all text-center select-none"
      style={{
        border: `1.5px dashed ${slot.file ? "#B9FF4B" : over ? "#B9FF4B88" : "#2A2A3A"}`,
        background: slot.file ? "#B9FF4B0A" : over ? "#B9FF4B06" : "#141420",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
      <span className="text-2xl">{slot.icon}</span>
      <div>
        <p className="text-xs font-semibold" style={{ color: slot.file ? "#B9FF4B" : "#888899" }}>
          {slot.label}
        </p>
        {slot.file
          ? <p className="text-[10px] mt-0.5 truncate max-w-[120px]" style={{ color: "#B9FF4B99" }}>{slot.file.name}</p>
          : <p className="text-[10px] mt-0.5" style={{ color: "#444466" }}>Clique ou arraste</p>
        }
      </div>
      {slot.file && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#B9FF4B" }} />}
    </div>
  );
}

export default function ApostilaPage() {
  const [layoutSlots, setLayoutSlots] = useState<Record<string, File | null>>({
    capa: null, interna: null, contracapa: null,
  });
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [contentFiles, setContentFiles] = useState<File[]>([]);
  const [etapa, setEtapa] = useState<Etapa>("idle");
  const [msg, setMsg] = useState("");
  const [apostilaId, setApostilaId] = useState<string | null>(null);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const contentInputRef = useRef<HTMLInputElement>(null);

  const SLOTS: FileSlot[] = [
    { key: "capa",        label: "Capa",        icon: "📄", file: layoutSlots.capa },
    { key: "interna",     label: "Folha Interna", icon: "📋", file: layoutSlots.interna },
    { key: "contracapa",  label: "Contracapa",  icon: "📑", file: layoutSlots.contracapa },
  ];

  const layoutPronto = SLOTS.every((s) => s.file !== null);
  const processando = ["extraindo", "organizando", "gerando"].includes(etapa);
  const idx = etapaIdx(etapa);

  const onSlotFile = (key: string, file: File) => {
    setLayoutSlots((prev) => ({ ...prev, [key]: file }));
    setLayoutId(null); // invalidar layout salvo ao trocar arquivos
  };

  const uploadLayout = useCallback(async () => {
    if (!layoutPronto) return;
    setEtapa("upload_layout");
    setMsg("Enviando layout...");

    const fd = new FormData();
    fd.append("capa", layoutSlots.capa!);
    fd.append("interna", layoutSlots.interna!);
    fd.append("contracapa", layoutSlots.contracapa!);

    try {
      const resp = await fetch(`${API}/api/layout`, { method: "POST", body: fd });
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const data = await resp.json();
      setLayoutId(data.layout_id);
      setEtapa("idle");
      toast.success("Layout salvo! Agora envie o conteúdo.");
    } catch (e: any) {
      setEtapa("erro");
      setMsg(e.message ?? "Erro ao enviar layout");
      toast.error("Falha ao enviar layout");
    }
  }, [layoutSlots, layoutPronto]);

  const gerar = useCallback(async () => {
    if (!layoutId) { toast.error("Primeiro salve o layout"); return; }
    if (contentFiles.length === 0) { toast.error("Adicione os arquivos de conteúdo"); return; }

    setEtapa("extraindo");
    setMsg("Iniciando...");
    setApostilaId(null);

    const fd = new FormData();
    fd.append("layout_id", layoutId);
    fd.append("titulo", titulo);
    fd.append("subtitulo", subtitulo);
    fd.append("autor", autor);
    contentFiles.forEach((f) => fd.append("conteudo_files", f));

    try {
      const resp = await fetch(`${API}/api/gerar`, { method: "POST", body: fd });
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      if (!resp.body) throw new Error("Stream indisponível");

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.etapa === "erro") throw new Error(payload.msg ?? "Erro desconhecido");

          setMsg(payload.msg ?? "");

          if (payload.etapa === "concluido") {
            setEtapa("concluido");
            setApostilaId(payload.apostila_id);
            setTotalPaginas(payload.paginas ?? 0);
            toast.success("Apostila gerada com sucesso!");
            return;
          }

          setEtapa(payload.etapa as Etapa);
        }
      }
    } catch (e: any) {
      setEtapa("erro");
      setMsg(e.message ?? "Erro desconhecido");
      toast.error("Falha ao gerar apostila. Verifique se o agente está rodando na porta 8700.");
    }
  }, [layoutId, contentFiles, titulo, subtitulo, autor]);

  const resetar = () => {
    setEtapa("idle");
    setApostilaId(null);
    setMsg("");
    setTotalPaginas(0);
    setContentFiles([]);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden" style={{ background: "#07080A" }}>

      {/* ── Painel esquerdo — layout & metadados ────────────────────────── */}
      <div
        className="flex flex-col border-r overflow-y-auto"
        style={{ width: 320, minWidth: 280, borderColor: "#1E1E2E", background: "#0A0A10" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "#1E1E2E" }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "#B9FF4B22", border: "1px solid #B9FF4B44" }}
          >
            <BookOpen className="w-5 h-5" style={{ color: "#B9FF4B" }} />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: "#F0F0F0" }}>Apolo</div>
            <div className="text-[11px]" style={{ color: "#B9FF4B", opacity: 0.7 }}>
              Agente Editor de Apostilas
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col px-5 py-4 gap-5">

          {/* Layout PDFs */}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-3 font-semibold" style={{ color: "#444466" }}>
              1. Layout (PDFs)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SLOTS.map((slot) => (
                <DropZone key={slot.key} slot={slot} onFile={onSlotFile} disabled={processando} />
              ))}
            </div>
            <button
              onClick={uploadLayout}
              disabled={!layoutPronto || processando || etapa === "upload_layout"}
              className="mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: layoutId
                  ? "#B9FF4B22"
                  : layoutPronto ? "#B9FF4B" : "#1E1E2E",
                color: layoutId ? "#B9FF4B" : layoutPronto ? "#07080A" : "#444466",
                cursor: layoutPronto && !processando ? "pointer" : "not-allowed",
                border: layoutId ? "1px solid #B9FF4B44" : "none",
              }}
            >
              {etapa === "upload_layout" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : layoutId ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {layoutId ? "Layout salvo" : "Salvar Layout"}
            </button>
          </div>

          {/* Metadados */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
              2. Dados da Apostila
            </p>
            {[
              { label: "Título", key: "titulo", val: titulo, set: setTitulo, ph: "Ex: Matemática Básica" },
              { label: "Subtítulo", key: "sub", val: subtitulo, set: setSubtitulo, ph: "Ex: Módulo 1 — Números" },
              { label: "Autor / Professor", key: "autor", val: autor, set: setAutor, ph: "Ex: Prof. Ana Lima" },
            ].map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
                    {f.label}
                  </label>
                  <AIFieldButton
                    fieldLabel={f.label}
                    getValue={() => f.val}
                    onInsert={(t) => f.set(t)}
                    fieldContext="Criador de apostilas educacionais — Apolo"
                    placement="side"
                  />
                </div>
                <input
                  type="text"
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.ph}
                  disabled={processando}
                  className="rounded-xl px-3 py-2 text-xs outline-none transition-colors"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", fontFamily: "inherit" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
                />
              </div>
            ))}
          </div>

          {/* Arquivos de conteúdo */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
              3. Conteúdo dos Professores
            </p>
            <button
              onClick={() => contentInputRef.current?.click()}
              disabled={processando}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all"
              style={{
                background: "#141420",
                border: `1.5px dashed ${contentFiles.length > 0 ? "#B9FF4B55" : "#2A2A3A"}`,
                color: contentFiles.length > 0 ? "#B9FF4B" : "#555577",
                cursor: processando ? "not-allowed" : "pointer",
              }}
            >
              <Upload className="w-3.5 h-3.5" />
              {contentFiles.length > 0
                ? `${contentFiles.length} arquivo(s) selecionado(s)`
                : "Adicionar arquivos"}
            </button>
            <input
              ref={contentInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const fs = Array.from(e.target.files ?? []);
                setContentFiles((prev) => [...prev, ...fs]);
                e.target.value = "";
              }}
            />
            {contentFiles.length > 0 && (
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {contentFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: "#141420" }}>
                    <FileText className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                    <span className="text-[10px] truncate flex-1" style={{ color: "#888899" }}>{f.name}</span>
                    <button
                      onClick={() => setContentFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-[10px] flex-shrink-0"
                      style={{ color: "#444466" }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botão gerar */}
        <div className="px-5 pb-5 flex-shrink-0">
          <button
            onClick={etapa === "concluido" ? resetar : gerar}
            disabled={processando || etapa === "upload_layout" || (!layoutId && etapa !== "concluido")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: etapa === "concluido" ? "#1E1E2E"
                : layoutId && contentFiles.length > 0 && titulo ? "#B9FF4B" : "#1E1E2E",
              color: etapa === "concluido" ? "#8888AA"
                : layoutId && contentFiles.length > 0 && titulo ? "#07080A" : "#444466",
              cursor: processando ? "not-allowed" : "pointer",
            }}
          >
            {processando ? <Loader2 className="w-4 h-4 animate-spin" /> :
              etapa === "concluido" ? <RefreshCw className="w-4 h-4" /> :
              <Sparkles className="w-4 h-4" />
            }
            {processando ? "Gerando..." : etapa === "concluido" ? "Nova Apostila" : "Gerar Apostila"}
          </button>
        </div>
      </div>

      {/* ── Painel direito — progresso e resultado ──────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">

          {/* Estado inicial */}
          {etapa === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-8 p-8"
              style={{ color: "#333355" }}
            >
              <div style={{ fontSize: 72 }}>📚</div>
              <div className="text-center max-w-md">
                <p className="text-lg font-semibold mb-2" style={{ color: "#555577" }}>
                  Apolo — Editor de Apostilas com IA
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#333355" }}>
                  Envie o layout em PDF (capa, folha interna e contracapa) e os arquivos de conteúdo dos professores.
                  O agente organiza, formata e monta a apostila completa como um editor profissional.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { emoji: "📄", label: "Upload Layout", desc: "3 PDFs de layout" },
                  { emoji: "🧠", label: "IA Edita", desc: "Claude organiza o conteúdo" },
                  { emoji: "📥", label: "Baixar PDF", desc: "Apostila pronta para impressão" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl text-center"
                    style={{ background: "#0E0E18", border: "1px solid #1A1A2A" }}
                  >
                    <span style={{ fontSize: 28 }}>{s.emoji}</span>
                    <span className="text-xs font-semibold" style={{ color: "#555577" }}>{s.label}</span>
                    <span className="text-[10px]" style={{ color: "#333355" }}>{s.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Upload do layout */}
          {etapa === "upload_layout" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-4"
            >
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: "#B9FF4B" }} />
              <p className="font-semibold" style={{ color: "#B9FF4B" }}>Enviando layout...</p>
            </motion.div>
          )}

          {/* Processando */}
          {processando && (
            <motion.div
              key="proc"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-8 px-8"
            >
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                  style={{ background: "#0E1A08", border: "1px solid #B9FF4B33" }}
                >
                  📚
                </div>
                <div
                  className="absolute -inset-2 rounded-2xl animate-pulse"
                  style={{ background: "#B9FF4B0A", border: "1px solid #B9FF4B22" }}
                />
              </div>

              <div className="flex flex-col items-center gap-1">
                <p className="font-semibold" style={{ color: "#B9FF4B" }}>Gerando sua apostila...</p>
                {msg && <p className="text-sm" style={{ color: "#555577" }}>{msg}</p>}
              </div>

              <div className="flex flex-col gap-3 w-80">
                {ETAPAS_PROG.map((e, i) => {
                  const done = idx > i;
                  const active = idx === i;
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{
                        background: done ? "#0E1A08" : active ? "#141420" : "#0A0A10",
                        border: `1px solid ${done ? "#B9FF4B33" : active ? "#B9FF4B22" : "#1A1A2A"}`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: done ? "#B9FF4B22" : active ? "#B9FF4B11" : "#1A1A2A" }}
                      >
                        {done
                          ? <CheckCircle2 className="w-4 h-4" style={{ color: "#B9FF4B" }} />
                          : active
                          ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#B9FF4B" }} />
                          : <div className="w-2 h-2 rounded-full" style={{ background: "#333355" }} />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: done || active ? "#B9FF4B" : "#333355" }}>
                          {e.label}
                        </p>
                        <p className="text-[11px]" style={{ color: "#444466" }}>{e.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Concluído */}
          {etapa === "concluido" && apostilaId && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6"
            >
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
                style={{ background: "#0E1A08", border: "2px solid #B9FF4B55" }}
              >
                📚
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold mb-1" style={{ color: "#B9FF4B" }}>Apostila Pronta!</p>
                <p className="text-sm" style={{ color: "#555577" }}>
                  {totalPaginas} página(s) de conteúdo gerada(s) com sucesso
                </p>
              </div>
              <a
                href={`${API}/api/download/${apostilaId}`}
                download="apostila.pdf"
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all"
                style={{
                  background: "#B9FF4B",
                  color: "#07080A",
                  textDecoration: "none",
                  boxShadow: "0 0 32px #B9FF4B33",
                }}
              >
                <Download className="w-5 h-5" />
                Baixar Apostila PDF
              </a>
              <button
                onClick={resetar}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
                style={{ background: "#1E1E2E", color: "#8888AA" }}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Criar outra apostila
              </button>
            </motion.div>
          )}

          {/* Erro */}
          {etapa === "erro" && (
            <motion.div
              key="erro"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-4"
            >
              <AlertCircle className="w-14 h-14" style={{ color: "#F87171" }} />
              <div className="text-center">
                <p className="font-semibold mb-1" style={{ color: "#F87171" }}>Erro ao gerar apostila</p>
                <p className="text-sm max-w-sm" style={{ color: "#555577" }}>{msg}</p>
              </div>
              <button
                onClick={resetar}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: "#1E1E2E", color: "#8888AA" }}
              >
                Tentar novamente
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
