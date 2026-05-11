import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Download, Eye, Code2, FileText, Palette,
  Loader2, CheckCircle2, AlertCircle, Layout, Sparkles,
  RefreshCw, Copy, Monitor, Smartphone, Paperclip,
  Globe, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API = "http://localhost:8700";

// ── Types ──────────────────────────────────────────────────────────────────────
type Etapa = "idle" | "copy" | "design" | "html" | "concluido" | "erro";

interface Resultado {
  copy: string;
  design: string;
  html: string;
}

// ── Etapas de progresso ────────────────────────────────────────────────────────
const ETAPAS = [
  { id: "copy",   label: "Redatora",  desc: "Criando o copy",            icon: FileText },
  { id: "design", label: "Designer",  desc: "Definindo identidade visual", icon: Palette },
  { id: "html",   label: "Tomás",     desc: "Montando a landing page",    icon: Layout },
] as const;

function etapaIndex(e: Etapa) {
  return ETAPAS.findIndex((x) => x.id === e);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copiado!");
}

function downloadHtml(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `landing-page-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function TomasPage() {
  const [searchParams] = useSearchParams();
  const [briefing, setBriefing] = useState(() => searchParams.get("briefing") ?? "");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [etapa, setEtapa] = useState<Etapa>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"preview" | "copy" | "design" | "html" | "publicar">("preview");
  const [previewMobile, setPreviewMobile] = useState(false);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Publicação WordPress ──────────────────────────────────────────────────
  const [wpUrl, setWpUrl] = useState("");
  const [wpUser, setWpUser] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [wpSlug, setWpSlug] = useState("");
  const [wpTitulo, setWpTitulo] = useState("");
  const [forminatorId, setForminatorId] = useState("");
  const [wpTemplate, setWpTemplate] = useState("elementor_canvas");
  const [publicando, setPublicando] = useState(false);
  const [paginaPublicada, setPaginaPublicada] = useState<{ url: string; action: string } | null>(null);

  const gerandoAtivo = etapa !== "idle" && etapa !== "concluido" && etapa !== "erro";

  const cancelar = useCallback(() => {
    readerRef.current?.cancel();
    setEtapa("idle");
    setStatusMsg("");
  }, []);

  const gerar = useCallback(async () => {
    if (!briefing.trim()) {
      toast.error("Preencha o briefing antes de gerar.");
      return;
    }

    setEtapa("copy");
    setResultado(null);
    setStatusMsg("Iniciando...");

    const parcial: Resultado = { copy: "", design: "", html: "" };

    try {
      const fd = new FormData();
      fd.append("briefing", briefing);
      arquivos.forEach((f) => fd.append("arquivos", f));

      const resp = await fetch(`${API}/gerar`, {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      if (!resp.body) throw new Error("Stream não disponível");

      const reader = resp.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split("\n\n");
        buffer = linhas.pop() ?? "";

        for (const linha of linhas) {
          if (!linha.startsWith("data: ")) continue;
          const payload = JSON.parse(linha.slice(6));

          if (payload.etapa === "erro") {
            throw new Error(payload.mensagem);
          }

          if (payload.etapa === "concluido") {
            setEtapa("concluido");
            setResultado({ ...parcial });
            setAbaAtiva("preview");
            toast.success("Landing page gerada com sucesso!");
            return;
          }

          setEtapa(payload.etapa as Etapa);
          setStatusMsg(payload.status ?? "");

          if (payload.conteudo) {
            if (payload.etapa === "copy")   parcial.copy   = payload.conteudo;
            if (payload.etapa === "design") parcial.design = payload.conteudo;
            if (payload.etapa === "html")   parcial.html   = payload.conteudo;
          }
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setEtapa("erro");
      setStatusMsg(err?.message ?? "Erro desconhecido");
      toast.error("Falha ao gerar a landing page.");
    }
  }, [briefing]);

  const publicar = useCallback(async () => {
    if (!resultado?.html) return;
    if (!wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo) {
      toast.error("Preencha todos os campos obrigatórios do WordPress.");
      return;
    }
    setPublicando(true);
    setPaginaPublicada(null);
    try {
      const fd = new FormData();
      fd.append("html", resultado.html);
      fd.append("wp_url", wpUrl);
      fd.append("wp_user", wpUser);
      fd.append("wp_password", wpPassword);
      fd.append("titulo", wpTitulo);
      fd.append("slug", wpSlug);
      fd.append("wp_template", wpTemplate);
      if (forminatorId.trim()) fd.append("forminator_id", forminatorId.trim());

      const resp = await fetch(`${API}/publicar`, { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail ?? `Erro ${resp.status}`);

      setPaginaPublicada({ url: data.url, action: data.action });
      toast.success(`Página ${data.action} com sucesso!`);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao publicar");
    } finally {
      setPublicando(false);
    }
  }, [resultado, wpUrl, wpUser, wpPassword, wpSlug, wpTitulo, wpTemplate, forminatorId]);

  const idxAtual = etapaIndex(etapa);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden" style={{ background: "#07080A" }}>

      {/* ── Painel esquerdo — briefing ─────────────────────────── */}
      <div
        className="flex flex-col border-r"
        style={{ width: 340, minWidth: 300, borderColor: "#1E1E2E", background: "#0A0A10" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#1E1E2E" }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "#B9FF4B22", border: "1px solid #B9FF4B44" }}
          >
            🖥️
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: "#F0F0F0" }}>Tomás</div>
            <div className="text-[11px]" style={{ color: "#B9FF4B", opacity: 0.7 }}>Criador de Landing Pages</div>
          </div>
        </div>

        {/* Agentes colaboradores */}
        <div className="px-5 py-3 border-b" style={{ borderColor: "#1E1E2E" }}>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>Equipe</p>
          <div className="flex gap-2">
            {[
              { emoji: "✍️", nome: "Redatora", cor: "#60A5FA" },
              { emoji: "🎨", nome: "Designer",  cor: "#A78BFA" },
              { emoji: "🖥️", nome: "Tomás",    cor: "#B9FF4B" },
            ].map((ag) => (
              <div
                key={ag.nome}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium"
                style={{ background: `${ag.cor}15`, border: `1px solid ${ag.cor}30`, color: ag.cor }}
              >
                <span>{ag.emoji}</span>
                <span>{ag.nome}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Briefing textarea + upload */}
        <div className="flex-1 flex flex-col px-5 py-4 gap-3 overflow-hidden">
          <label className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
            Briefing do cliente
          </label>
          <textarea
            className="flex-1 resize-none rounded-xl p-4 text-sm outline-none transition-colors"
            style={{
              background: "#141420",
              border: "1px solid #2A2A3A",
              color: "#E0E0F0",
              lineHeight: 1.6,
              fontFamily: "inherit",
            }}
            placeholder={
              "Descreva o produto, público-alvo, objetivo e tom de voz.\n\n" +
              "Exemplo:\nProduto: Curso de gestão financeira para MEIs\n" +
              "Público: Empreendedores 30-50 anos\n" +
              "Objetivo: inscrições\nTom: direto e motivador\n" +
              "Cores da marca: azul e laranja"
            }
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            disabled={gerandoAtivo}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
          />

          {/* Upload de arquivos */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
                Arquivos de referência
              </label>
              {arquivos.length > 0 && (
                <button
                  onClick={() => setArquivos([])}
                  className="text-[10px]"
                  style={{ color: "#444466" }}
                  disabled={gerandoAtivo}
                >
                  Limpar
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
              disabled={gerandoAtivo}
              onChange={(e) => {
                const novos = Array.from(e.target.files ?? []);
                setArquivos((prev) => [...prev, ...novos]);
                e.target.value = "";
              }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={gerandoAtivo}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs transition-all"
              style={{
                background: "#141420",
                border: `1.5px dashed ${arquivos.length > 0 ? "#B9FF4B55" : "#2A2A3A"}`,
                color: arquivos.length > 0 ? "#B9FF4B" : "#555577",
                cursor: gerandoAtivo ? "not-allowed" : "pointer",
              }}
            >
              <Paperclip className="w-3.5 h-3.5" />
              {arquivos.length > 0
                ? `${arquivos.length} arquivo(s) anexado(s)`
                : "Anexar PDF, Word ou TXT"}
            </button>

            {arquivos.length > 0 && (
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                {arquivos.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg"
                    style={{ background: "#141420" }}
                  >
                    <FileText className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                    <span className="text-[10px] truncate flex-1" style={{ color: "#888899" }}>{f.name}</span>
                    <button
                      onClick={() => setArquivos((prev) => prev.filter((_, j) => j !== i))}
                      disabled={gerandoAtivo}
                      className="text-[10px] flex-shrink-0"
                      style={{ color: "#444466" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botão gerar / cancelar */}
        <div className="px-5 pb-5">
          {gerandoAtivo ? (
            <button
              onClick={cancelar}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "#1E1E2E", border: "1px solid #3A3A4A", color: "#8888AA" }}
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          ) : (
            <button
              onClick={gerar}
              disabled={!briefing.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: briefing.trim() ? "#B9FF4B" : "#1E1E2E",
                color: briefing.trim() ? "#07080A" : "#444466",
                cursor: briefing.trim() ? "pointer" : "not-allowed",
              }}
            >
              <Sparkles className="w-4 h-4" />
              Gerar Landing Page
            </button>
          )}
        </div>
      </div>

      {/* ── Painel direito — resultado ──────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Barra de progresso / abas */}
        <div
          className="flex items-center gap-0 border-b px-4"
          style={{ borderColor: "#1E1E2E", background: "#0A0A10", minHeight: 52 }}
        >
          {(etapa === "idle" || gerandoAtivo || etapa === "erro") ? (
            /* Etapas de progresso */
            <div className="flex items-center gap-3 flex-1">
              {ETAPAS.map((e, i) => {
                const done   = idxAtual > i;
                const active = idxAtual === i && gerandoAtivo;
                const idle   = idxAtual < i || etapa === "idle";
                return (
                  <div key={e.id} className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                      style={{
                        background: done ? "#B9FF4B22" : active ? "#1E1E2E" : "transparent",
                        border: `1px solid ${done ? "#B9FF4B55" : active ? "#B9FF4B33" : "#1E1E2E"}`,
                        color: done ? "#B9FF4B" : active ? "#B9FF4B" : "#444466",
                      }}
                    >
                      {done ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : active ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <e.icon className="w-3.5 h-3.5" />
                      )}
                      <span>{e.label}</span>
                    </div>
                    {i < ETAPAS.length - 1 && (
                      <div className="w-6 h-px" style={{ background: "#1E1E2E" }} />
                    )}
                  </div>
                );
              })}
              {gerandoAtivo && statusMsg && (
                <span className="ml-2 text-[11px]" style={{ color: "#666688" }}>{statusMsg}</span>
              )}
              {etapa === "erro" && (
                <span className="ml-2 text-[11px] flex items-center gap-1" style={{ color: "#F87171" }}>
                  <AlertCircle className="w-3.5 h-3.5" /> {statusMsg}
                </span>
              )}
            </div>
          ) : (
            /* Abas de resultado */
            <div className="flex items-center gap-1 flex-1">
              {([
                { id: "preview",  label: "Preview",     icon: Eye },
                { id: "copy",     label: "Copy",        icon: FileText },
                { id: "design",   label: "Design Spec", icon: Palette },
                { id: "html",     label: "HTML",        icon: Code2 },
                { id: "publicar", label: "Publicar",    icon: Globe },
              ] as const).map((aba) => (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{
                    background: abaAtiva === aba.id ? "#B9FF4B22" : "transparent",
                    color: abaAtiva === aba.id ? "#B9FF4B" : "#555577",
                    borderBottom: abaAtiva === aba.id ? "2px solid #B9FF4B" : "2px solid transparent",
                    borderRadius: "8px 8px 0 0",
                  }}
                >
                  <aba.icon className="w-3.5 h-3.5" />
                  {aba.label}
                </button>
              ))}

              <div className="flex items-center gap-2 ml-auto">
                {abaAtiva === "preview" && (
                  <button
                    onClick={() => setPreviewMobile((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
                    style={{ background: "#1E1E2E", color: "#8888AA" }}
                    title={previewMobile ? "Desktop" : "Mobile"}
                  >
                    {previewMobile ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  </button>
                )}
                {abaAtiva === "html" && resultado && (
                  <button
                    onClick={() => copyToClipboard(resultado.html)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
                    style={{ background: "#1E1E2E", color: "#8888AA" }}
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </button>
                )}
                {resultado && (
                  <button
                    onClick={() => downloadHtml(resultado.html)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                    style={{ background: "#B9FF4B", color: "#07080A" }}
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar HTML
                  </button>
                )}
                <button
                  onClick={() => { setEtapa("idle"); setResultado(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
                  style={{ background: "#1E1E2E", color: "#8888AA" }}
                  title="Nova LP"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Estado inicial */}
            {etapa === "idle" && !resultado && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-6"
                style={{ color: "#333355" }}
              >
                <div style={{ fontSize: 72 }}>🖥️</div>
                <div className="text-center">
                  <p className="text-lg font-semibold mb-1" style={{ color: "#555577" }}>
                    Briefing → Landing Page em minutos
                  </p>
                  <p className="text-sm" style={{ color: "#333355" }}>
                    A Redatora cria o copy. A Designer define o visual. O Tomás monta tudo.
                  </p>
                </div>
                <div className="flex gap-4">
                  {ETAPAS.map((e) => (
                    <div
                      key={e.id}
                      className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl"
                      style={{ background: "#0E0E18", border: "1px solid #1A1A2A" }}
                    >
                      <e.icon className="w-5 h-5" style={{ color: "#444466" }} />
                      <span className="text-xs font-medium" style={{ color: "#555577" }}>{e.label}</span>
                      <span className="text-[11px]" style={{ color: "#333355" }}>{e.desc}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Gerando */}
            {gerandoAtivo && (
              <motion.div
                key="gerando"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-8"
              >
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                    style={{ background: "#0E1A08", border: "1px solid #B9FF4B33" }}
                  >
                    🖥️
                  </div>
                  <div
                    className="absolute -inset-2 rounded-2xl animate-pulse"
                    style={{ background: "#B9FF4B0A", border: "1px solid #B9FF4B22" }}
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <p className="font-semibold" style={{ color: "#B9FF4B" }}>{statusMsg}</p>
                  <p className="text-sm" style={{ color: "#555577" }}>Aguarde, isso leva cerca de 1-2 minutos</p>
                </div>

                {/* Steps visuais */}
                <div className="flex flex-col gap-3 w-72">
                  {ETAPAS.map((e, i) => {
                    const done   = idxAtual > i;
                    const active = idxAtual === i;
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
                          style={{
                            background: done ? "#B9FF4B22" : active ? "#B9FF4B11" : "#1A1A2A",
                          }}
                        >
                          {done ? (
                            <CheckCircle2 className="w-4 h-4" style={{ color: "#B9FF4B" }} />
                          ) : active ? (
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#B9FF4B" }} />
                          ) : (
                            <e.icon className="w-4 h-4" style={{ color: "#333355" }} />
                          )}
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

            {/* Resultado — Preview */}
            {resultado && abaAtiva === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center overflow-auto py-4"
                style={{ background: "#0D0D16" }}
              >
                <div
                  className="rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
                  style={{
                    width: previewMobile ? 390 : "95%",
                    maxWidth: previewMobile ? 390 : 1280,
                    border: "1px solid #2A2A3A",
                  }}
                >
                  <iframe
                    srcDoc={resultado.html}
                    className="w-full"
                    style={{ height: "calc(100vh - 10rem)", border: "none" }}
                    title="Preview da Landing Page"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </motion.div>
            )}

            {/* Resultado — Copy */}
            {resultado && abaAtiva === "copy" && (
              <motion.div
                key="copy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full overflow-auto p-6"
              >
                <pre
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: "#C0C0D0", fontFamily: "inherit", maxWidth: 760 }}
                >
                  {resultado.copy}
                </pre>
              </motion.div>
            )}

            {/* Resultado — Design Spec */}
            {resultado && abaAtiva === "design" && (
              <motion.div
                key="design"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full overflow-auto p-6"
              >
                <pre
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: "#C0C0D0", fontFamily: "inherit", maxWidth: 760 }}
                >
                  {resultado.design}
                </pre>
              </motion.div>
            )}

            {/* Resultado — HTML */}
            {resultado && abaAtiva === "html" && (
              <motion.div
                key="html"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full overflow-auto p-6"
              >
                <pre
                  className="whitespace-pre-wrap text-[12px] leading-relaxed"
                  style={{ color: "#88CC88", fontFamily: "monospace", maxWidth: "100%" }}
                >
                  {resultado.html}
                </pre>
              </motion.div>
            )}

            {/* Resultado — Publicar no WordPress */}
            {resultado && abaAtiva === "publicar" && (
              <motion.div
                key="publicar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full overflow-auto p-6"
              >
                <div className="max-w-lg mx-auto flex flex-col gap-6">

                  {/* Cabeçalho */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#B9FF4B22", border: "1px solid #B9FF4B44" }}>
                      <Globe className="w-5 h-5" style={{ color: "#B9FF4B" }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "#F0F0F0" }}>Publicar no WordPress</p>
                      <p className="text-[11px]" style={{ color: "#555577" }}>Use a Senha de Aplicação do WP (Usuários → Senhas de Aplicação)</p>
                    </div>
                  </div>

                  {/* Sucesso */}
                  {paginaPublicada && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#0E1A08", border: "1px solid #B9FF4B33" }}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: "#B9FF4B" }}>
                          Página {paginaPublicada.action}!
                        </p>
                        <a
                          href={paginaPublicada.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] truncate block"
                          style={{ color: "#888899" }}
                        >
                          {paginaPublicada.url}
                        </a>
                      </div>
                      <a href={paginaPublicada.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4" style={{ color: "#B9FF4B" }} />
                      </a>
                    </div>
                  )}

                  {/* Credenciais WP */}
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>WordPress</p>
                  </div>

                  {[
                    { label: "URL do site *", val: wpUrl, set: setWpUrl, ph: "https://clientesite.com.br", type: "url" },
                    { label: "Usuário WP *", val: wpUser, set: setWpUser, ph: "admin", type: "text" },
                    { label: "Senha de Aplicação *", val: wpPassword, set: setWpPassword, ph: "xxxx xxxx xxxx xxxx", type: "password" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>{f.label}</label>
                      <input
                        type={f.type}
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        placeholder={f.ph}
                        className="rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", fontFamily: "inherit" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
                      />
                    </div>
                  ))}

                  {/* Dados da página */}
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Página</p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Título *</label>
                      <input
                        type="text"
                        value={wpTitulo}
                        onChange={(e) => setWpTitulo(e.target.value)}
                        placeholder="Curso de Marketing Digital"
                        className="rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", fontFamily: "inherit" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Slug (URL) *</label>
                      <input
                        type="text"
                        value={wpSlug}
                        onChange={(e) => setWpSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                        placeholder="curso-marketing"
                        className="rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", fontFamily: "inherit" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
                      />
                    </div>
                  </div>

                  {/* Template WP */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Template da página</label>
                    <select
                      value={wpTemplate}
                      onChange={(e) => setWpTemplate(e.target.value)}
                      className="rounded-xl px-3 py-2.5 text-sm outline-none appearance-none"
                      style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", fontFamily: "inherit" }}
                    >
                      <option value="elementor_canvas">Elementor Canvas (sem header/footer)</option>
                      <option value="elementor_header_footer">Elementor Header & Footer</option>
                      <option value="">Padrão do tema</option>
                      <option value="astra-blank">Astra Blank</option>
                      <option value="no-header-footer">GeneratePress sem header/footer</option>
                    </select>
                  </div>

                  {/* Forminator */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
                      ID do formulário Forminator <span style={{ color: "#333355", fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={forminatorId}
                      onChange={(e) => setForminatorId(e.target.value)}
                      placeholder="Ex: 42"
                      className="rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", fontFamily: "inherit" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
                    />
                    {forminatorId && (
                      <p className="text-[10px]" style={{ color: "#555577" }}>
                        O shortcode <code style={{ color: "#B9FF4B" }}>[forminator_form id="{forminatorId}"]</code> será inserido no lugar do formulário da LP.
                      </p>
                    )}
                  </div>

                  {/* Botão publicar */}
                  <button
                    onClick={publicar}
                    disabled={publicando || !wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: publicando || !wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo
                        ? "#1E1E2E" : "#B9FF4B",
                      color: publicando || !wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo
                        ? "#444466" : "#07080A",
                      cursor: publicando ? "not-allowed" : "pointer",
                    }}
                  >
                    {publicando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    {publicando ? "Publicando..." : paginaPublicada ? "Atualizar página" : "Publicar no site"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Ícone X inline para não importar do lucide (evitar conflito de nome)
function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
