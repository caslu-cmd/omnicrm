import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Download, Eye, Code2, FileText, Palette,
  Loader2, CheckCircle2, AlertCircle, Layout, Sparkles,
  RefreshCw, Copy, Monitor, Smartphone, Paperclip,
  Globe, ExternalLink, Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";

type Etapa = "idle" | "copy" | "design" | "html" | "concluido" | "erro";

interface Resultado { copy: string; design: string; html: string; }

const ETAPAS = [
  { id: "copy",   label: "Beatriz",  desc: "Criando o copy",             icon: FileText },
  { id: "design", label: "Designer", desc: "Definindo identidade visual", icon: Palette },
  { id: "html",   label: "Tomás",    desc: "Montando a landing page",     icon: Layout },
] as const;

function etapaIndex(e: Etapa) { return ETAPAS.findIndex((x) => x.id === e); }
function copyToClipboard(text: string) { navigator.clipboard.writeText(text); toast.success("Copiado!"); }
function downloadHtml(html: string) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([html], { type: "text/html" })),
    download: `landing-page-${Date.now()}.html`,
  });
  a.click();
}

export default function TomasPage() {
  const [searchParams] = useSearchParams();
  const clientId   = searchParams.get("clientId") ?? "";
  const clientName = searchParams.get("clientName") ?? "";

  const [briefing, setBriefing]   = useState(() => searchParams.get("briefing") ?? "");
  const [arquivos, setArquivos]   = useState<File[]>([]);
  const [dragOver, setDragOver]   = useState(false);
  const [etapa, setEtapa]         = useState<Etapa>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [parcial, setParcial]     = useState<Resultado>({ copy: "", design: "", html: "" });
  const [abaAtiva, setAbaAtiva]   = useState<"preview" | "copy" | "design" | "html" | "publicar">("preview");
  const [previewMobile, setPreviewMobile] = useState(false);
  const [htmlEditado, setHtmlEditado]     = useState("");
  const [editandoHtml, setEditandoHtml]   = useState(false);
  const readerRef   = useRef<ReadableStreamDefaultReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── WordPress ─────────────────────────────────────────────────────────────
  const [wpUrl, setWpUrl]           = useState("");
  const [wpUser, setWpUser]         = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [wpSlug, setWpSlug]         = useState("");
  const [wpTitulo, setWpTitulo]     = useState("");
  const [wpTemplate, setWpTemplate] = useState("elementor_canvas");
  const [forminatorId, setForminatorId] = useState("");
  const [publicando, setPublicando]     = useState(false);
  const [paginaPublicada, setPaginaPublicada] = useState<{ url: string; action: string } | null>(null);
  const [wpCredsLoaded, setWpCredsLoaded] = useState(false);

  // Carrega credenciais WP do cliente (salvas no workspace)
  useEffect(() => {
    if (!clientId || wpCredsLoaded) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await (supabase as any).from("integrations")
        .select("config")
        .eq("user_id", session.user.id)
        .eq("connector_name", `wordpress_${clientId}`)
        .maybeSingle();
      if (data?.config) {
        if (data.config.wp_url)      setWpUrl(data.config.wp_url);
        if (data.config.wp_user)     setWpUser(data.config.wp_user);
        if (data.config.wp_password) setWpPassword(data.config.wp_password);
      }
      setWpCredsLoaded(true);
    })();
  }, [clientId, wpCredsLoaded]);

  const gerandoAtivo = etapa !== "idle" && etapa !== "concluido" && etapa !== "erro";

  const cancelar = useCallback(() => {
    readerRef.current?.cancel();
    setEtapa("idle");
    setStatusMsg("");
  }, []);

  const gerar = useCallback(async () => {
    if (!briefing.trim()) { toast.error("Preencha o briefing antes de gerar."); return; }
    setEtapa("copy");
    setResultado(null);
    setParcial({ copy: "", design: "", html: "" });
    setStatusMsg("Iniciando...");

    const parcial: Resultado = { copy: "", design: "", html: "" };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      // Prepara arquivos: PDF → base64 para Claude ler nativamente; txt/md → texto no briefing
      const arquivosPayload: { name: string; base64: string; media_type: string }[] = [];
      const textoExtra: string[] = [];
      for (const f of arquivos) {
        if (/\.(txt|md)$/i.test(f.name)) {
          const texto = await new Promise<string>((res) => {
            const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.readAsText(f, "utf-8");
          });
          textoExtra.push(`[${f.name}]\n${texto.trim()}`);
        } else {
          // PDF, DOCX, DOC — envia como base64 para a edge function (Claude lê PDFs nativamente)
          const buf = await f.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < bytes.length; i += 8192) {
            binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          }
          const b64 = btoa(binary);
          const media = f.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
          arquivosPayload.push({ name: f.name, base64: b64, media_type: media });
        }
      }
      const briefingFinal = textoExtra.length > 0
        ? `${briefing}\n\n--- Materiais de referência (texto) ---\n${textoExtra.join("\n\n")}`
        : briefing;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/tomas-lp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ briefing: briefingFinal, client_name: clientName, arquivos: arquivosPayload }),
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
          if (payload.etapa === "erro") throw new Error(payload.mensagem);
          if (payload.etapa === "concluido") {
            setEtapa("concluido");
            setResultado({ ...parcial });
            setHtmlEditado(parcial.html);
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
  }, [briefing, arquivos, clientName]);

  const publicar = useCallback(async () => {
    const htmlFinal = htmlEditado || resultado?.html;
    if (!htmlFinal) return;
    if (!wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setPublicando(true);
    setPaginaPublicada(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/publish-to-wp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          html: htmlFinal, wp_url: wpUrl, wp_user: wpUser, wp_password: wpPassword,
          titulo: wpTitulo, slug: wpSlug, wp_template: wpTemplate,
          forminator_id: forminatorId.trim() || null,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? `Erro ${resp.status}`);
      setPaginaPublicada({ url: data.url, action: data.action });
      toast.success(`Página ${data.action} com sucesso no site do cliente!`);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao publicar");
    } finally {
      setPublicando(false);
    }
  }, [htmlEditado, resultado, wpUrl, wpUser, wpPassword, wpSlug, wpTitulo, wpTemplate, forminatorId]);

  const idxAtual = etapaIndex(etapa);
  const htmlParaExibir = htmlEditado || resultado?.html || "";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#07080A" }}>

      {/* ── Painel esquerdo ─────────────────────────────────────────────── */}
      <div className="flex flex-col border-r" style={{ width: 340, minWidth: 300, borderColor: "#1E1E2E", background: "#0A0A10" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#1E1E2E" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "#B9FF4B22", border: "1px solid #B9FF4B44" }}>🖥️</div>
          <div>
            <div className="font-bold text-sm" style={{ color: "#F0F0F0" }}>Tomás</div>
            <div className="text-[11px]" style={{ color: "#B9FF4B", opacity: 0.7 }}>
              {clientName ? `LP para ${clientName}` : "Criador de Landing Pages"}
            </div>
          </div>
        </div>

        {/* Equipe */}
        <div className="px-5 py-3 border-b" style={{ borderColor: "#1E1E2E" }}>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>Equipe</p>
          <div className="flex gap-2">
            {[{ emoji: "✍️", nome: "Beatriz", cor: "#60A5FA" }, { emoji: "🎨", nome: "Designer", cor: "#A78BFA" }, { emoji: "🖥️", nome: "Tomás", cor: "#B9FF4B" }].map((ag) => (
              <div key={ag.nome} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium"
                style={{ background: `${ag.cor}15`, border: `1px solid ${ag.cor}30`, color: ag.cor }}>
                <span>{ag.emoji}</span><span>{ag.nome}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Briefing */}
        <div className="flex-1 flex flex-col px-5 py-4 gap-3 overflow-hidden">
          <label className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Briefing do cliente</label>
          <textarea
            className="flex-1 resize-none rounded-xl p-4 text-sm outline-none"
            style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", lineHeight: 1.6, fontFamily: "inherit" }}
            placeholder={"Produto, público-alvo, objetivo e tom de voz.\n\nEx:\nProduto: Curso de gestão para MEIs\nPúblico: Empreendedores 30-50 anos\nObjetivo: inscrições\nTom: direto e motivador\nCores: azul e laranja"}
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            disabled={gerandoAtivo}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
          />

          {/* Upload */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md"
              style={{ display: "none" }}
              onChange={(e) => { setArquivos(prev => [...prev, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }}
            />
            <div
              onDragOver={(e) => { e.preventDefault(); if (!gerandoAtivo) setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (gerandoAtivo) return;
                const files = Array.from(e.dataTransfer.files).filter(f => /\.(pdf|docx|doc|txt|md)$/i.test(f.name));
                if (files.length) setArquivos(prev => [...prev, ...files]);
              }}
              onClick={() => { if (!gerandoAtivo) fileInputRef.current?.click(); }}
              className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs transition-all"
              style={{
                background: dragOver ? "#B9FF4B0D" : "#141420",
                border: `1.5px dashed ${dragOver ? "#B9FF4B" : arquivos.length > 0 ? "#B9FF4B55" : "#2A2A3A"}`,
                color: dragOver ? "#B9FF4B" : arquivos.length > 0 ? "#B9FF4B" : "#555577",
                cursor: gerandoAtivo ? "default" : "pointer",
              }}>
              <Paperclip className="w-3.5 h-3.5" />
              <span>{dragOver ? "Solte os arquivos aqui" : arquivos.length > 0 ? `${arquivos.length} arquivo(s) anexado(s)` : "Arraste ou clique para selecionar"}</span>
              {!dragOver && <span className="text-[10px]" style={{ color: "#333355" }}>PDF, Word, TXT ou MD</span>}
            </div>
            {arquivos.length > 0 && (
              <div className="flex flex-col gap-1 max-h-20 overflow-y-auto">
                {arquivos.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: "#141420" }}>
                    <FileText className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                    <span className="text-[10px] truncate flex-1" style={{ color: "#888899" }}>{f.name}</span>
                    <button onClick={() => setArquivos(prev => prev.filter((_, j) => j !== i))}
                      className="text-[10px]" style={{ color: "#444466" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botão gerar */}
        <div className="px-5 pb-5">
          {gerandoAtivo ? (
            <button onClick={cancelar} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "#1E1E2E", border: "1px solid #3A3A4A", color: "#8888AA" }}>
              <XIcon className="w-4 h-4" /> Cancelar
            </button>
          ) : (
            <button onClick={gerar} disabled={!briefing.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
              style={{ background: briefing.trim() ? "#B9FF4B" : "#1E1E2E", color: briefing.trim() ? "#07080A" : "#444466", cursor: briefing.trim() ? "pointer" : "not-allowed" }}>
              <Sparkles className="w-4 h-4" /> Gerar Landing Page
            </button>
          )}
        </div>
      </div>

      {/* ── Painel direito ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Barra superior */}
        <div className="flex items-center gap-0 border-b px-4"
          style={{ borderColor: "#1E1E2E", background: "#0A0A10", minHeight: 52 }}>

          {(etapa === "idle" || gerandoAtivo || etapa === "erro") ? (
            <div className="flex items-center gap-3 flex-1">
              {ETAPAS.map((e, i) => {
                const done   = idxAtual > i;
                const active = idxAtual === i && gerandoAtivo;
                return (
                  <div key={e.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                      style={{ background: done ? "#B9FF4B22" : active ? "#1E1E2E" : "transparent", border: `1px solid ${done ? "#B9FF4B55" : active ? "#B9FF4B33" : "#1E1E2E"}`, color: done ? "#B9FF4B" : active ? "#B9FF4B" : "#444466" }}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : active ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <e.icon className="w-3.5 h-3.5" />}
                      <span>{e.label}</span>
                    </div>
                    {i < ETAPAS.length - 1 && <div className="w-6 h-px" style={{ background: "#1E1E2E" }} />}
                  </div>
                );
              })}
              {gerandoAtivo && statusMsg && <span className="ml-2 text-[11px]" style={{ color: "#666688" }}>{statusMsg}</span>}
              {etapa === "erro" && <span className="ml-2 text-[11px] flex items-center gap-1" style={{ color: "#F87171" }}><AlertCircle className="w-3.5 h-3.5" /> {statusMsg}</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-1">
              {([
                { id: "preview",  label: "Preview",     icon: Eye },
                { id: "copy",     label: "Copy",        icon: FileText },
                { id: "design",   label: "Design Spec", icon: Palette },
                { id: "html",     label: "HTML",        icon: Code2 },
                { id: "publicar", label: "Publicar no Site", icon: Globe },
              ] as const).map((aba) => (
                <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{ background: abaAtiva === aba.id ? "#B9FF4B22" : "transparent", color: abaAtiva === aba.id ? "#B9FF4B" : "#555577", borderBottom: abaAtiva === aba.id ? "2px solid #B9FF4B" : "2px solid transparent", borderRadius: "8px 8px 0 0" }}>
                  <aba.icon className="w-3.5 h-3.5" /> {aba.label}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                {abaAtiva === "preview" && (
                  <button onClick={() => setPreviewMobile(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]"
                    style={{ background: "#1E1E2E", color: "#8888AA" }}>
                    {previewMobile ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  </button>
                )}
                {abaAtiva === "html" && (
                  <button onClick={() => setEditandoHtml(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]"
                    style={{ background: editandoHtml ? "#B9FF4B22" : "#1E1E2E", color: editandoHtml ? "#B9FF4B" : "#8888AA", border: editandoHtml ? "1px solid #B9FF4B44" : "none" }}>
                    <Edit3 className="w-3.5 h-3.5" /> {editandoHtml ? "Visualizar" : "Editar"}
                  </button>
                )}
                {abaAtiva === "html" && (
                  <button onClick={() => copyToClipboard(htmlParaExibir)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]"
                    style={{ background: "#1E1E2E", color: "#8888AA" }}>
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </button>
                )}
                {resultado && (
                  <button onClick={() => downloadHtml(htmlParaExibir)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                    style={{ background: "#B9FF4B", color: "#07080A" }}>
                    <Download className="w-3.5 h-3.5" /> Baixar HTML
                  </button>
                )}
                <button onClick={() => { setEtapa("idle"); setResultado(null); setHtmlEditado(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]"
                  style={{ background: "#1E1E2E", color: "#8888AA" }} title="Nova LP">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* Idle */}
            {etapa === "idle" && !resultado && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-6" style={{ color: "#333355" }}>
                <div style={{ fontSize: 72 }}>🖥️</div>
                <div className="text-center">
                  <p className="text-lg font-semibold mb-1" style={{ color: "#555577" }}>Briefing → Landing Page em minutos</p>
                  <p className="text-sm" style={{ color: "#333355" }}>Beatriz cria o copy. A Designer define o visual. Tomás monta tudo.</p>
                </div>
                <div className="flex gap-4">
                  {ETAPAS.map((e) => (
                    <div key={e.id} className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl" style={{ background: "#0E0E18", border: "1px solid #1A1A2A" }}>
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
              <motion.div key="gerando" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style={{ background: "#0E1A08", border: "1px solid #B9FF4B33" }}>🖥️</div>
                  <div className="absolute -inset-2 rounded-2xl animate-pulse" style={{ background: "#B9FF4B0A", border: "1px solid #B9FF4B22" }} />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="font-semibold" style={{ color: "#B9FF4B" }}>{statusMsg}</p>
                  <p className="text-sm" style={{ color: "#555577" }}>Aguarde, leva cerca de 1-2 minutos</p>
                </div>
                <div className="flex flex-col gap-3 w-72">
                  {ETAPAS.map((e, i) => {
                    const done = idxAtual > i; const active = idxAtual === i;
                    return (
                      <div key={e.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: done ? "#0E1A08" : active ? "#141420" : "#0A0A10", border: `1px solid ${done ? "#B9FF4B33" : active ? "#B9FF4B22" : "#1A1A2A"}` }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: done ? "#B9FF4B22" : active ? "#B9FF4B11" : "#1A1A2A" }}>
                          {done ? <CheckCircle2 className="w-4 h-4" style={{ color: "#B9FF4B" }} /> : active ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#B9FF4B" }} /> : <e.icon className="w-4 h-4" style={{ color: "#333355" }} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: done || active ? "#B9FF4B" : "#333355" }}>{e.label}</p>
                          <p className="text-[11px]" style={{ color: "#444466" }}>{e.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Preview */}
            {resultado && abaAtiva === "preview" && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center overflow-auto py-4" style={{ background: "#0D0D16" }}>
                <div className="rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
                  style={{ width: previewMobile ? 390 : "95%", maxWidth: previewMobile ? 390 : 1280, border: "1px solid #2A2A3A" }}>
                  <iframe srcDoc={htmlParaExibir} className="w-full" style={{ height: "calc(100vh - 10rem)", border: "none" }}
                    title="Preview" sandbox="allow-scripts allow-same-origin" />
                </div>
              </motion.div>
            )}

            {/* Copy */}
            {resultado && abaAtiva === "copy" && (
              <motion.div key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-auto p-6">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "#C0C0D0", fontFamily: "inherit", maxWidth: 760 }}>{resultado.copy}</pre>
              </motion.div>
            )}

            {/* Design */}
            {resultado && abaAtiva === "design" && (
              <motion.div key="design" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-auto p-6">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "#C0C0D0", fontFamily: "inherit", maxWidth: 760 }}>{resultado.design}</pre>
              </motion.div>
            )}

            {/* HTML (com edição) */}
            {resultado && abaAtiva === "html" && (
              <motion.div key="html" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-hidden">
                {editandoHtml ? (
                  <textarea
                    className="w-full h-full resize-none p-6 outline-none text-[12px]"
                    style={{ background: "#0A0A0F", color: "#88CC88", fontFamily: "monospace", lineHeight: 1.6 }}
                    value={htmlEditado}
                    onChange={(e) => setHtmlEditado(e.target.value)}
                  />
                ) : (
                  <div className="h-full overflow-auto p-6">
                    <pre className="whitespace-pre-wrap text-[12px] leading-relaxed" style={{ color: "#88CC88", fontFamily: "monospace" }}>{htmlParaExibir}</pre>
                  </div>
                )}
              </motion.div>
            )}

            {/* Publicar no Site do Cliente */}
            {resultado && abaAtiva === "publicar" && (
              <motion.div key="publicar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-auto p-6">
                <div className="max-w-lg mx-auto flex flex-col gap-5">

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#B9FF4B22", border: "1px solid #B9FF4B44" }}>
                      <Globe className="w-5 h-5" style={{ color: "#B9FF4B" }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "#F0F0F0" }}>Publicar no site do cliente</p>
                      <p className="text-[11px]" style={{ color: "#555577" }}>
                        {clientName ? `Publicando em ${clientName}` : "Configure as credenciais WordPress"}
                        {wpCredsLoaded && wpUrl && <span style={{ color: "#B9FF4B" }}> · Creds carregadas ✓</span>}
                      </p>
                    </div>
                  </div>

                  {paginaPublicada && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#0E1A08", border: "1px solid #B9FF4B33" }}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: "#B9FF4B" }}>Página {paginaPublicada.action} com sucesso!</p>
                        <a href={paginaPublicada.url} target="_blank" rel="noreferrer" className="text-[11px] truncate block" style={{ color: "#888899" }}>{paginaPublicada.url}</a>
                      </div>
                      <a href={paginaPublicada.url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" style={{ color: "#B9FF4B" }} /></a>
                    </div>
                  )}

                  {/* Credenciais WP */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: "#444466" }}>WordPress</p>
                    {[
                      { label: "URL do site *", val: wpUrl, set: setWpUrl, ph: "https://clientesite.com.br", type: "url" },
                      { label: "Usuário WP *",  val: wpUser, set: setWpUser, ph: "admin", type: "text" },
                      { label: "Senha de Aplicação *", val: wpPassword, set: setWpPassword, ph: "xxxx xxxx xxxx xxxx", type: "password" },
                    ].map((f) => (
                      <div key={f.label} className="flex flex-col gap-1 mb-3">
                        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>{f.label}</label>
                        <input type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                          className="rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")} />
                      </div>
                    ))}
                  </div>

                  {/* Dados da página */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: "#444466" }}>Página</p>
                    <div className="flex gap-3 mb-3">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Título *</label>
                        <input type="text" value={wpTitulo} onChange={(e) => setWpTitulo(e.target.value)} placeholder="Curso de Marketing"
                          className="rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")} />
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Slug (URL) *</label>
                        <input type="text" value={wpSlug} onChange={(e) => setWpSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))} placeholder="curso-marketing"
                          className="rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-3">
                      <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Template</label>
                      <select value={wpTemplate} onChange={(e) => setWpTemplate(e.target.value)}
                        className="rounded-xl px-3 py-2.5 text-sm outline-none appearance-none"
                        style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}>
                        <option value="elementor_canvas">Elementor Canvas (sem header/footer)</option>
                        <option value="elementor_header_footer">Elementor Header & Footer</option>
                        <option value="">Padrão do tema</option>
                        <option value="astra-blank">Astra Blank</option>
                        <option value="no-header-footer">GeneratePress sem header/footer</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
                        ID Forminator <span style={{ color: "#333355", fontWeight: 400 }}>(opcional)</span>
                      </label>
                      <input type="text" value={forminatorId} onChange={(e) => setForminatorId(e.target.value)} placeholder="Ex: 42"
                        className="rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")} />
                    </div>
                  </div>

                  <button onClick={publicar} disabled={publicando || !wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold"
                    style={{
                      background: publicando || !wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo ? "#1E1E2E" : "#B9FF4B",
                      color: publicando || !wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo ? "#444466" : "#07080A",
                    }}>
                    {publicando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    {publicando ? "Publicando no site..." : paginaPublicada ? "Atualizar página" : "Publicar no site do cliente"}
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
