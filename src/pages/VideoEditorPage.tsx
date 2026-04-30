import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Download, Scissors, Zap, Volume2, Subtitles,
  ChevronDown, ChevronUp, X, Send, Loader2, CheckCircle2,
  AlertCircle, Smartphone, Monitor, Square, Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API = "http://localhost:8600";

// ── tipos ──────────────────────────────────────────────────────────────────────
interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  has_audio: boolean;
  size_mb: number;
}

interface ChatMessage {
  role: "user" | "bobby" | "system";
  content: string;
  type: "text" | "action" | "error";
}

// ── helpers ────────────────────────────────────────────────────────────────────
function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const TOOL_LABELS: Record<string, string> = {
  trim_video: "Corte aplicado",
  reframe_video: "Vídeo reformatado",
  change_speed: "Velocidade ajustada",
  add_subtitles: "Legendas adicionadas",
  remove_silence: "Silêncios removidos",
  normalize_audio: "Áudio normalizado",
  add_watermark: "Logo adicionado",
  add_music: "Trilha adicionada",
};

// ══════════════════════════════════════════════════════════════════════════════
export default function VideoEditorPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [bobbyOpen, setBobbyOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [bobbyTyping, setBobbyTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [greeted, setGreeted] = useState(false);

  // manual tools
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [speed, setSpeed] = useState("1x");
  const [platform, setPlatform] = useState("youtube");
  const [lang, setLang] = useState("pt");
  const [toolLoading, setToolLoading] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("trim");

  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── session ────────────────────────────────────────────────────────────────
  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const r = await fetch(`${API}/session`, { method: "POST" });
    const d = await r.json();
    setSessionId(d.session_id);
    return d.session_id;
  }

  // ── upload ─────────────────────────────────────────────────────────────────
  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const sid = await ensureSession();
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API}/upload/${sid}`, { method: "POST", body: fd });
      const d = await r.json();
      if (!d.ok) throw new Error("Falha no upload");
      setVideoInfo(d.video_info);
      setFilename(d.filename);
      setTrimEnd(d.video_info.duration);
      refreshVideo(sid);
      setGreeted(false);
      toast.success("Vídeo carregado!");
    } catch (e: any) {
      toast.error("Erro ao carregar: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  function refreshVideo(sid?: string) {
    const id = sid ?? sessionId;
    if (!id) return;
    setVideoUrl(`${API}/video/${id}?t=${Date.now()}`);
  }

  // ── chat com Bobby ─────────────────────────────────────────────────────────
  async function sendToBobby(text: string) {
    if (!sessionId) return;
    setMessages(m => [...m, { role: "user", content: text, type: "text" }]);
    setBobbyTyping(true);
    try {
      const r = await fetch(`${API}/chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const d = await r.json();

      if (d.reply) {
        setMessages(m => [...m, { role: "bobby", content: d.reply, type: "text" }]);
      }

      for (const act of (d.actions_done ?? [])) {
        const label = TOOL_LABELS[act.tool] ?? act.tool;
        setMessages(m => [...m, {
          role: "system",
          content: act.ok ? `✓ ${label}` : `✗ ${label}: ${act.error}`,
          type: act.ok ? "action" : "error",
        }]);
      }

      if (d.video_info) {
        setVideoInfo(d.video_info);
        refreshVideo();
      }
    } catch (e: any) {
      setMessages(m => [...m, { role: "bobby", content: "Erro de conexão com o servidor.", type: "text" }]);
    } finally {
      setBobbyTyping(false);
    }
  }

  async function openBobby() {
    setBobbyOpen(true);
    if (!greeted && sessionId && videoInfo) {
      setGreeted(true);
      await sendToBobby("Oi Bobby! Acabei de carregar um vídeo. Me apresente você e diga o que pode fazer por ele.");
    }
  }

  function handleSend() {
    const t = inputValue.trim();
    if (!t) return;
    setInputValue("");
    sendToBobby(t);
  }

  // ── edit manual ────────────────────────────────────────────────────────────
  async function applyEdit(tool: string, params: object) {
    if (!sessionId) return;
    setToolLoading(tool);
    try {
      const r = await fetch(`${API}/edit/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, params }),
      });
      const d = await r.json();
      if (d.ok) {
        setVideoInfo(d.video_info);
        refreshVideo();
        toast.success(TOOL_LABELS[tool] ?? "Feito!");
      } else {
        toast.error(d.error ?? "Erro");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setToolLoading(null);
    }
  }

  const speedMap: Record<string, number> = {
    "0.5x": 0.5, "0.75x": 0.75, "1x": 1, "1.25x": 1.25, "1.5x": 1.5, "2x": 2,
  };

  const platformIcons: Record<string, JSX.Element> = {
    youtube: <Monitor className="w-3.5 h-3.5" />,
    reels: <Smartphone className="w-3.5 h-3.5" />,
    feed: <Square className="w-3.5 h-3.5" />,
    stories: <Smartphone className="w-3.5 h-3.5" />,
  };

  const suggestions = [
    "Remova os silêncios",
    "Adicione legendas em português",
    "Formate para Reels",
    "Normalize o áudio",
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // TELA DE UPLOAD
  // ══════════════════════════════════════════════════════════════════════════
  if (!videoInfo) {
    return (
      <div className="min-h-screen bg-[#07080A] flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          {/* Bobby card */}
          <div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-8 text-center mb-6
                          relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px]
                            bg-gradient-to-r from-transparent via-[#B9FF4B] to-transparent opacity-60" />

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1a2a00] to-[#2a4000]
                            border-2 border-[#B9FF4B]/30 flex items-center justify-center
                            text-4xl mx-auto mb-4 shadow-[0_0_30px_rgba(185,255,75,0.1)]">
              🎬
            </div>

            <h2 className="text-xl font-bold text-white mb-1">Bobby</h2>
            <p className="text-xs text-[#B9FF4B]/60 uppercase tracking-widest mb-3">
              Editor de Vídeo IA
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                            bg-[#B9FF4B]/10 border border-[#B9FF4B]/20 text-[#B9FF4B] text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B9FF4B] animate-pulse" />
              Disponível para editar
            </div>

            <p className="text-sm text-[#444] mt-4">
              Carregue um vídeo e eu cuido da edição
            </p>
          </div>

          {/* Upload zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) handleUpload(f);
            }}
            className="border-2 border-dashed border-[#1e1e1e] rounded-xl p-10 text-center
                       cursor-pointer transition-colors hover:border-[#B9FF4B]/30 hover:bg-[#B9FF4B]/5
                       group"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#B9FF4B] animate-spin" />
                <span className="text-sm text-[#666]">Carregando vídeo...</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#333] group-hover:text-[#B9FF4B]/50 mx-auto mb-3 transition-colors" />
                <p className="text-sm text-[#555] group-hover:text-[#666] transition-colors">
                  Arraste o vídeo ou clique para selecionar
                </p>
                <p className="text-xs text-[#333] mt-1">MP4, MOV, AVI, WEBM</p>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA PRINCIPAL
  // ══════════════════════════════════════════════════════════════════════════
  const dur = videoInfo.duration;

  return (
    <div className="min-h-screen bg-[#07080A] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#111] px-6 py-3 flex items-center gap-3">
        <span className="text-lg">🎬</span>
        <span className="text-sm font-semibold text-white">Editor de Vídeo</span>
        <span className="text-[#222] mx-1">|</span>
        <span className="text-xs text-[#444] truncate max-w-xs">{filename}</span>

        <div className="ml-auto flex items-center gap-2 text-xs text-[#333]">
          <span className="font-mono">{videoInfo.width}×{videoInfo.height}</span>
          <span>·</span>
          <span className="font-mono">{fmtDuration(dur)}</span>
          <span>·</span>
          <span className="font-mono">{videoInfo.fps}fps</span>
          <span>·</span>
          <span className="font-mono">{videoInfo.size_mb}MB</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── VÍDEO ─────────────────────────────────────────────────────── */}
        <div className={cn("flex flex-col gap-3 p-5 transition-all duration-300",
          bobbyOpen ? "w-[55%]" : "w-[60%]")}>

          {videoUrl && (
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              className="w-full rounded-xl bg-black border border-[#111] shadow-2xl"
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setVideoInfo(null);
                setVideoUrl(null);
                setSessionId(null);
                setMessages([]);
                setGreeted(false);
                setBobbyOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg
                         bg-[#111] border border-[#1a1a1a] text-xs text-[#555]
                         hover:border-[#333] hover:text-[#888] transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Trocar vídeo
            </button>

            <a
              href={`${API}/download/${sessionId}`}
              download="editado.mp4"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg
                         bg-[#B9FF4B]/10 border border-[#B9FF4B]/20 text-xs text-[#B9FF4B]
                         hover:bg-[#B9FF4B]/15 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Baixar vídeo
            </a>
          </div>
        </div>

        {/* ── FERRAMENTAS (visível quando Bobby fechado) ─────────────────── */}
        <AnimatePresence>
          {!bobbyOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "22%" }}
              exit={{ opacity: 0, width: 0 }}
              className="border-l border-[#111] overflow-y-auto overflow-x-hidden"
            >
              <div className="p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-[#333] mb-3 px-1">
                  Edição Manual
                </p>

                {/* CORTAR */}
                <Section
                  id="trim" label="Cortar" icon={<Scissors className="w-3.5 h-3.5" />}
                  open={openSection} setOpen={setOpenSection}
                >
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-[10px] text-[#444] block mb-1">Início (s)</label>
                      <input type="number" min={0} max={dur} step={0.5}
                        value={trimStart} onChange={e => setTrimStart(+e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-md px-2 py-1.5
                                   text-xs text-white focus:border-[#B9FF4B]/40 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#444] block mb-1">Fim (s)</label>
                      <input type="number" min={0} max={dur} step={0.5}
                        value={trimEnd} onChange={e => setTrimEnd(+e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-md px-2 py-1.5
                                   text-xs text-white focus:border-[#B9FF4B]/40 outline-none" />
                    </div>
                  </div>
                  <ApplyButton
                    loading={toolLoading === "trim_video"}
                    onClick={() => applyEdit("trim_video", { start: trimStart, end: trimEnd })}
                    label="Cortar" />
                </Section>

                {/* PLATAFORMA */}
                <Section
                  id="platform" label="Plataforma" icon={<Smartphone className="w-3.5 h-3.5" />}
                  open={openSection} setOpen={setOpenSection}
                >
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {[["youtube", "YouTube 16:9"], ["reels", "Reels 9:16"],
                      ["feed", "Feed 1:1"], ["stories", "Stories"]].map(([v, l]) => (
                      <button key={v}
                        onClick={() => setPlatform(v)}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-xs transition-colors",
                          platform === v
                            ? "border-[#B9FF4B]/40 bg-[#B9FF4B]/10 text-[#B9FF4B]"
                            : "border-[#1e1e1e] text-[#444] hover:border-[#2a2a2a]"
                        )}>
                        {platformIcons[v]} {l}
                      </button>
                    ))}
                  </div>
                  <ApplyButton
                    loading={toolLoading === "reframe_video"}
                    onClick={() => applyEdit("reframe_video", { format: platform })}
                    label="Reformatar" />
                </Section>

                {/* VELOCIDADE */}
                <Section
                  id="speed" label="Velocidade" icon={<Zap className="w-3.5 h-3.5" />}
                  open={openSection} setOpen={setOpenSection}
                >
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Object.keys(speedMap).map(s => (
                      <button key={s} onClick={() => setSpeed(s)}
                        className={cn(
                          "px-2.5 py-1 rounded-md border text-xs transition-colors",
                          speed === s
                            ? "border-[#B9FF4B]/40 bg-[#B9FF4B]/10 text-[#B9FF4B]"
                            : "border-[#1e1e1e] text-[#444] hover:border-[#2a2a2a]"
                        )}>{s}</button>
                    ))}
                  </div>
                  {speed !== "1x" && (
                    <ApplyButton
                      loading={toolLoading === "change_speed"}
                      onClick={() => applyEdit("change_speed", { speed: speedMap[speed] })}
                      label={`Aplicar ${speed}`} />
                  )}
                </Section>

                {/* LEGENDAS */}
                <Section
                  id="subtitles" label="Legendas" icon={<Subtitles className="w-3.5 h-3.5" />}
                  open={openSection} setOpen={setOpenSection}
                >
                  <div className="flex gap-1.5 mb-2">
                    {[["pt", "PT"], ["en", "EN"], ["es", "ES"]].map(([v, l]) => (
                      <button key={v} onClick={() => setLang(v)}
                        className={cn(
                          "flex-1 py-1 rounded-md border text-xs transition-colors",
                          lang === v
                            ? "border-[#B9FF4B]/40 bg-[#B9FF4B]/10 text-[#B9FF4B]"
                            : "border-[#1e1e1e] text-[#444]"
                        )}>{l}</button>
                    ))}
                  </div>
                  <ApplyButton
                    loading={toolLoading === "add_subtitles"}
                    onClick={() => applyEdit("add_subtitles", { language: lang })}
                    label="Gerar legendas" />
                </Section>

                {/* SILÊNCIOS */}
                <Section
                  id="silence" label="Remover silêncios" icon={<Volume2 className="w-3.5 h-3.5" />}
                  open={openSection} setOpen={setOpenSection}
                >
                  <p className="text-[11px] text-[#444] mb-2">
                    Remove pausas maiores que 1.5s automaticamente.
                  </p>
                  <ApplyButton
                    loading={toolLoading === "remove_silence"}
                    onClick={() => applyEdit("remove_silence", { min_duration: 1.5 })}
                    label="Remover silêncios" />
                </Section>

                {/* ÁUDIO */}
                <Section
                  id="audio" label="Normalizar áudio" icon={<Volume2 className="w-3.5 h-3.5" />}
                  open={openSection} setOpen={setOpenSection}
                >
                  <p className="text-[11px] text-[#444] mb-2">
                    Ajusta para -16 LUFS (padrão profissional).
                  </p>
                  <ApplyButton
                    loading={toolLoading === "normalize_audio"}
                    onClick={() => applyEdit("normalize_audio", {})}
                    label="Normalizar" />
                </Section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BOBBY ─────────────────────────────────────────────────────── */}
        <div className={cn(
          "border-l border-[#111] flex flex-col transition-all duration-300",
          bobbyOpen ? "w-[45%]" : "w-[18%]"
        )}>
          {!bobbyOpen ? (
            /* Card fechado */
            <div className="p-4 flex flex-col items-center gap-3">
              <div className="w-full rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5 text-center
                              relative overflow-hidden cursor-pointer group"
                   onClick={openBobby}>
                <div className="absolute top-0 left-0 right-0 h-[2px]
                                bg-gradient-to-r from-transparent via-[#B9FF4B] to-transparent opacity-40
                                group-hover:opacity-80 transition-opacity" />

                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1a2a00] to-[#2a4000]
                                border-2 border-[#B9FF4B]/20 flex items-center justify-center
                                text-2xl mx-auto mb-3 group-hover:border-[#B9FF4B]/40
                                group-hover:shadow-[0_0_20px_rgba(185,255,75,0.1)]
                                transition-all shadow-[0_0_15px_rgba(185,255,75,0.05)]">
                  🎬
                </div>

                <p className="text-sm font-bold text-white">Bobby</p>
                <p className="text-[10px] text-[#B9FF4B]/50 uppercase tracking-widest">Editor IA</p>

                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B9FF4B] animate-pulse" />
                  <span className="text-[10px] text-[#B9FF4B]/60">online</span>
                </div>
              </div>

              <button
                onClick={openBobby}
                className="w-full py-2 rounded-lg bg-[#B9FF4B]/10 border border-[#B9FF4B]/20
                           text-[#B9FF4B] text-xs font-medium hover:bg-[#B9FF4B]/15 transition-colors"
              >
                Falar com Bobby
              </button>
            </div>
          ) : (
            /* Chat aberto */
            <>
              {/* Header do chat */}
              <div className="border-b border-[#111] px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a2a00] to-[#2a4000]
                                border border-[#B9FF4B]/20 flex items-center justify-center text-base
                                shadow-[0_0_12px_rgba(185,255,75,0.08)] flex-shrink-0">
                  🎬
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Bobby</p>
                  <p className="text-[10px] text-[#B9FF4B]/60">● online</p>
                </div>
                <button
                  onClick={() => setBobbyOpen(false)}
                  className="p-1 rounded-md text-[#333] hover:text-[#666] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                    <div className="text-3xl">🎬</div>
                    <p className="text-xs text-[#333] text-center">
                      Bobby está pronto para editar
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => {
                  if (msg.type === "action") return (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-md
                                            bg-[#B9FF4B]/5 border border-[#B9FF4B]/15 text-[#B9FF4B] text-[11px]">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      {msg.content}
                    </div>
                  );
                  if (msg.type === "error") return (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-md
                                            bg-red-500/5 border border-red-500/15 text-red-400 text-[11px]">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {msg.content}
                    </div>
                  );
                  if (msg.role === "bobby") return (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a2a00] to-[#2a4000]
                                      border border-[#B9FF4B]/15 flex items-center justify-center
                                      text-sm flex-shrink-0 mt-0.5">🎬</div>
                      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl rounded-tl-sm
                                      px-3 py-2 text-xs text-[#ccc] leading-relaxed max-w-[85%]
                                      whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  );
                  return (
                    <div key={i} className="flex gap-2 items-start flex-row-reverse">
                      <div className="w-7 h-7 rounded-full bg-[#111] border border-[#1e1e1e]
                                      flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                        👤
                      </div>
                      <div className="bg-[#111520] border border-[#1a2030] rounded-2xl rounded-tr-sm
                                      px-3 py-2 text-xs text-[#ccc] leading-relaxed max-w-[85%]">
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {bobbyTyping && (
                  <div className="flex gap-2 items-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a2a00] to-[#2a4000]
                                    border border-[#B9FF4B]/15 flex items-center justify-center text-sm flex-shrink-0">
                      🎬
                    </div>
                    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl rounded-tl-sm px-3 py-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(j => (
                          <span key={j} className="w-1.5 h-1.5 rounded-full bg-[#B9FF4B]/40
                                                   animate-bounce"
                            style={{ animationDelay: `${j * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Sugestões */}
              {messages.length <= 2 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {suggestions.map(s => (
                    <button key={s}
                      onClick={() => sendToBobby(s)}
                      disabled={bobbyTyping}
                      className="px-2.5 py-1 rounded-full border border-[#1e1e1e] text-[11px]
                                 text-[#555] hover:border-[#B9FF4B]/25 hover:text-[#B9FF4B]/60
                                 transition-colors disabled:opacity-40">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-[#111] p-3">
                <div className="flex gap-2">
                  <input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Fale com Bobby..."
                    disabled={bobbyTyping}
                    className="flex-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2
                               text-xs text-white placeholder-[#333] outline-none
                               focus:border-[#B9FF4B]/30 transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={bobbyTyping || !inputValue.trim()}
                    className="p-2 rounded-lg bg-[#B9FF4B]/10 border border-[#B9FF4B]/20
                               text-[#B9FF4B] hover:bg-[#B9FF4B]/15 transition-colors
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {bobbyTyping
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────
function Section({ id, label, icon, open, setOpen, children }: {
  id: string; label: string; icon: JSX.Element;
  open: string | null; setOpen: (v: string | null) => void;
  children: React.ReactNode;
}) {
  const isOpen = open === id;
  return (
    <div className="rounded-lg border border-[#151515] overflow-hidden">
      <button
        onClick={() => setOpen(isOpen ? null : id)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left
                   hover:bg-[#0f0f0f] transition-colors"
      >
        <span className="text-[#444]">{icon}</span>
        <span className="flex-1 text-xs text-[#666]">{label}</span>
        {isOpen
          ? <ChevronUp className="w-3 h-3 text-[#333]" />
          : <ChevronDown className="w-3 h-3 text-[#333]" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-[#111]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ApplyButton({ loading, onClick, label }: {
  loading: boolean; onClick: () => void; label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-2 rounded-lg bg-[#B9FF4B]/10 border border-[#B9FF4B]/20
                 text-[#B9FF4B] text-xs font-medium hover:bg-[#B9FF4B]/15
                 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      {label}
    </button>
  );
}
