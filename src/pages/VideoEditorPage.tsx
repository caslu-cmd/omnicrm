import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Download, Scissors, Zap, Volume2, Subtitles,
  X, Send, Loader2, CheckCircle2, AlertCircle,
  Smartphone, Monitor, Square, Play, RotateCw, RotateCcw,
  FlipHorizontal, ScanLine, Wand2, Palette, Eye,
  Music, Image as ImageIcon, Sparkles, Camera, Film,
  ZoomIn, Wind, Gauge, Layers, Sun, ChevronRight,
  Trash2, ScissorsLineDashed, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API = "http://localhost:8600";

// ── Platforms ──────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "youtube",   label: "YouTube",      ratio: "16:9",  res: "1920×1080", icon: "▶",  color: "#FF0000" },
  { id: "reels",     label: "Reels",        ratio: "9:16",  res: "1080×1920", icon: "📱", color: "#E1306C" },
  { id: "tiktok",    label: "TikTok",       ratio: "9:16",  res: "1080×1920", icon: "♪",  color: "#69C9D0" },
  { id: "feed",      label: "Feed",         ratio: "1:1",   res: "1080×1080", icon: "⬛", color: "#833AB4" },
  { id: "stories",   label: "Stories",      ratio: "9:16",  res: "1080×1920", icon: "◻",  color: "#FCAF45" },
  { id: "linkedin",  label: "LinkedIn",     ratio: "16:9",  res: "1280×720",  icon: "in", color: "#0A66C2" },
  { id: "twitter",   label: "Twitter/X",    ratio: "16:9",  res: "1280×720",  icon: "𝕏",  color: "#1DA1F2" },
  { id: "pinterest", label: "Pinterest",    ratio: "2:3",   res: "1000×1500", icon: "P",  color: "#E60023" },
] as const;

type PlatformId = typeof PLATFORMS[number]["id"];

// ── Types ──────────────────────────────────────────────────────────────────────
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

interface Thumbnail {
  time: number;
  data: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return `${m}:${sec.padStart(4, "0")}`;
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
  multi_cut: "Cortes aplicados",
  rotate_video: "Vídeo rotacionado",
  zoom_crop: "Zoom aplicado",
  ken_burns: "Ken Burns aplicado",
  camera_shake: "Camera shake aplicado",
  zoom_punch: "Zoom punch aplicado",
  speed_ramp: "Speed ramp aplicado",
  color_grade: "Color grade aplicado",
  vignette: "Vinheta aplicada",
  sharpen: "Nitidez aumentada",
  blur_background: "Blur background aplicado",
};

// ── Timeline Component ─────────────────────────────────────────────────────────
function Timeline({
  duration,
  thumbnails,
  cutPoints,
  onAddCut,
  onRemoveCut,
  onApplyCuts,
  toolLoading,
}: {
  duration: number;
  thumbnails: Thumbnail[];
  cutPoints: number[];
  onAddCut: (t: number) => void;
  onRemoveCut: (t: number) => void;
  onApplyCuts: () => void;
  toolLoading: string | null;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  function getTimeFromX(clientX: number): number {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return parseFloat((pct * duration).toFixed(2));
  }

  function handleClick(e: React.MouseEvent) {
    const t = getTimeFromX(e.clientX);
    // Check if close to existing cut point
    const close = cutPoints.find(cp => Math.abs(cp - t) < duration * 0.015);
    if (close !== undefined) {
      onRemoveCut(close);
    } else {
      onAddCut(t);
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    setHoverTime(getTimeFromX(e.clientX));
  }

  // Build alternating segments between cut points
  const allPoints = [0, ...cutPoints.sort((a, b) => a - b), duration];
  const segments = allPoints.slice(0, -1).map((start, i) => ({
    start,
    end: allPoints[i + 1],
    pctStart: (start / duration) * 100,
    pctWidth: ((allPoints[i + 1] - start) / duration) * 100,
    index: i,
  }));

  return (
    <div className="space-y-2">
      {/* Timeline bar */}
      <div
        ref={barRef}
        className="relative h-14 rounded-lg overflow-hidden cursor-crosshair border border-[#1e1e1e] bg-[#0a0a0a] select-none"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverTime(null)}
      >
        {/* Thumbnail background */}
        {thumbnails.length > 0 && (
          <div className="absolute inset-0 flex">
            {thumbnails.map((th, i) => (
              <div
                key={i}
                className="flex-1 h-full bg-cover bg-center"
                style={{ backgroundImage: `url(data:image/jpeg;base64,${th.data})` }}
              />
            ))}
          </div>
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Segment highlights */}
        {segments.map(seg => (
          <div
            key={seg.index}
            className={cn(
              "absolute top-0 h-full transition-colors",
              seg.index % 2 === 0
                ? "bg-[#B9FF4B]/10 border-x border-[#B9FF4B]/20"
                : "bg-transparent"
            )}
            style={{ left: `${seg.pctStart}%`, width: `${seg.pctWidth}%` }}
          />
        ))}

        {/* Cut point lines */}
        {cutPoints.map((cp, i) => (
          <div
            key={i}
            className="absolute top-0 h-full flex flex-col items-center group"
            style={{ left: `${(cp / duration) * 100}%`, transform: "translateX(-50%)" }}
            onClick={e => { e.stopPropagation(); onRemoveCut(cp); }}
          >
            <div className="w-0.5 h-full bg-[#B9FF4B] opacity-90 group-hover:bg-red-400 transition-colors" />
            <div className="absolute top-0 w-3 h-3 rounded-full bg-[#B9FF4B] border-2 border-[#07080A] group-hover:bg-red-400 transition-colors -translate-y-0 flex items-center justify-center">
            </div>
          </div>
        ))}

        {/* Hover indicator */}
        {hoverTime !== null && (
          <div
            className="absolute top-0 h-full pointer-events-none"
            style={{ left: `${(hoverTime / duration) * 100}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-px h-full bg-white/30" />
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap">
              {fmtTime(hoverTime)}
            </div>
          </div>
        )}
      </div>

      {/* Cut points list */}
      {cutPoints.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cutPoints.sort((a, b) => a - b).map((cp, i) => (
            <div key={i} className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-md px-2 py-0.5">
              <span className="text-[10px] text-[#B9FF4B] font-mono">{fmtTime(cp)}</span>
              <button
                onClick={() => onRemoveCut(cp)}
                className="text-[#333] hover:text-red-400 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Apply cuts button */}
      {cutPoints.length > 0 && (
        <button
          onClick={onApplyCuts}
          disabled={toolLoading === "multi_cut"}
          className="w-full py-2 rounded-lg bg-[#B9FF4B]/10 border border-[#B9FF4B]/20
                     text-[#B9FF4B] text-xs font-medium hover:bg-[#B9FF4B]/15
                     transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {toolLoading === "multi_cut"
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Aplicando cortes...</>
            : <><ScissorsLineDashed className="w-3 h-3" /> Aplicar cortes ({cutPoints.length} ponto{cutPoints.length !== 1 ? "s" : ""})</>
          }
        </button>
      )}

      {cutPoints.length === 0 && (
        <p className="text-[10px] text-[#333] text-center">
          Clique na timeline para adicionar pontos de corte
        </p>
      )}
    </div>
  );
}

// ── Slider Component ───────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 0.1, unit = "", onChange }: {
  label: string; value: number; min: number; max: number;
  step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[#444]">{label}</span>
        <span className="text-[10px] text-[#B9FF4B] font-mono">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                   bg-[#1a1a1a] accent-[#B9FF4B]"
      />
    </div>
  );
}

// ── Apply Button ───────────────────────────────────────────────────────────────
function ApplyButton({ loading, onClick, label, icon }: {
  loading: boolean; onClick: () => void; label: string; icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-2 rounded-lg bg-[#B9FF4B]/10 border border-[#B9FF4B]/20
                 text-[#B9FF4B] text-xs font-medium hover:bg-[#B9FF4B]/15
                 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
    >
      {loading
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : (icon && <span className="w-3.5 h-3.5">{icon}</span>)
      }
      {label}
    </button>
  );
}

// ── Tab Button ─────────────────────────────────────────────────────────────────
function TabBtn({ id, label, icon, active, onClick }: {
  id: string; label: string; icon: React.ReactNode;
  active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg text-[10px] transition-colors flex-1 min-w-0",
        active
          ? "bg-[#B9FF4B]/10 text-[#B9FF4B] border border-[#B9FF4B]/20"
          : "text-[#444] hover:text-[#666] border border-transparent"
      )}
    >
      <span className="w-3.5 h-3.5">{icon}</span>
      <span className="truncate w-full text-center">{label}</span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function VideoEditorPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const clientName = searchParams.get("clientName") ?? null;
  const incomingScript = searchParams.get("script") ?? null;
  const incomingPlatform = (searchParams.get("platform") ?? null) as PlatformId | null;
  const incomingFile: File | undefined = (location.state as any)?.file;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [bobbyTyping, setBobbyTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [toolLoading, setToolLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("bobby");

  // Timeline state
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [cutPoints, setCutPoints] = useState<number[]>([]);

  // Corte tab
  const [selectedSegments, setSelectedSegments] = useState<Set<number>>(new Set([0]));

  // Ângulo tab
  const [zoomScale, setZoomScale] = useState(1.5);
  const [zoomX, setZoomX] = useState(0.5);
  const [zoomY, setZoomY] = useState(0.5);
  const [kbDirection, setKbDirection] = useState<"in" | "out">("in");
  const [kbIntensity, setKbIntensity] = useState(1.3);
  const [shakeIntensity, setShakeIntensity] = useState(8);

  // Efeitos tab
  const [punchTimes, setPunchTimes] = useState("");
  const [punchZoom, setPunchZoom] = useState(1.08);
  const [rampSlowStart, setRampSlowStart] = useState(0);
  const [rampSlowEnd, setRampSlowEnd] = useState(2);
  const [rampFastSpeed, setRampFastSpeed] = useState(2.0);
  const [rampSlowSpeed, setRampSlowSpeed] = useState(0.3);
  const [blurStrength, setBlurStrength] = useState(20);

  // Cor tab
  const [sharpenAmount, setSharpenAmount] = useState(1.5);

  // Legendas tab
  const [subStyle, setSubStyle] = useState("fade");
  const [subColor, setSubColor] = useState("white");
  const [subFontSize, setSubFontSize] = useState(28);
  const [subPosition, setSubPosition] = useState("bottom");
  const [subLang, setSubLang] = useState("pt");
  const [subBold, setSubBold] = useState(true);

  // Premium (Efeitos tab)
  const [grainIntensity, setGrainIntensity] = useState(15);

  // Plataforma alvo
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | null>(incomingPlatform);

  // Assets tab
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [musicPath, setMusicPath] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState("bottomright");
  const [musicVolume, setMusicVolume] = useState(0.3);

  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const musicRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-load file passed from workspace (no Supabase upload, instant)
  useEffect(() => {
    if (incomingFile) handleUpload(incomingFile);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session ────────────────────────────────────────────────────────────────
  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const r = await fetch(`${API}/session`, { method: "POST" });
    const d = await r.json();
    setSessionId(d.session_id);
    return d.session_id;
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
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
      setCutPoints([]);
      setSelectedSegments(new Set([0]));
      refreshVideo(sid);
      fetchThumbnails(sid);
      setGreeted(false);
      toast.success("Vídeo carregado!");

      // Se Bobby foi chamado do workspace com contexto, envia automaticamente
      if (clientName || incomingScript) {
        setActiveTab("bobby");
        const ctx: string[] = [];
        if (clientName) ctx.push(`Cliente: ${clientName}`);
        if (selectedPlatform) {
          const p = PLATFORMS.find(x => x.id === selectedPlatform);
          ctx.push(`Plataforma alvo: ${p?.label ?? selectedPlatform} (${p?.ratio})`);
        }
        if (incomingScript) ctx.push(`Roteiro recebido:\n${incomingScript}`);
        setTimeout(() => sendToBobby(
          ctx.join("\n\n") + "\n\nAnalise o vídeo e me diga o que você recomenda editar para essa entrega."
        ), 800);
      }
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

  async function fetchThumbnails(sid?: string) {
    const id = sid ?? sessionId;
    if (!id) return;
    try {
      const r = await fetch(`${API}/thumbnails/${id}?count=12`);
      const d = await r.json();
      setThumbnails(d.thumbnails ?? []);
    } catch {
      // non-critical
    }
  }

  // ── Edit API ───────────────────────────────────────────────────────────────
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
        fetchThumbnails();
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

  // ── Timeline handlers ──────────────────────────────────────────────────────
  function addCutPoint(t: number) {
    setCutPoints(prev => {
      const exists = prev.find(cp => Math.abs(cp - t) < 0.1);
      if (exists !== undefined) return prev;
      return [...prev, t];
    });
  }

  function removeCutPoint(t: number) {
    setCutPoints(prev => prev.filter(cp => Math.abs(cp - t) > 0.05));
  }

  function clearCuts() {
    setCutPoints([]);
    setSelectedSegments(new Set([0]));
  }

  function applyCuts() {
    if (!videoInfo || cutPoints.length === 0) return;
    const dur = videoInfo.duration;
    const allPoints = [0, ...cutPoints.sort((a, b) => a - b), dur];
    // Keep all even-indexed segments (alternating pattern — segments 0, 2, 4 etc)
    const segments = allPoints.slice(0, -1).map((start, i) => [start, allPoints[i + 1]]);
    // Keep every other segment starting from 0 (highlighted ones)
    const keep = segments.filter((_, i) => i % 2 === 0);
    applyEdit("multi_cut", { segments: keep });
    setCutPoints([]);
  }

  async function detectScenes() {
    if (!sessionId) return;
    setToolLoading("scenes");
    try {
      const r = await fetch(`${API}/scenes/${sessionId}?threshold=0.35`);
      const d = await r.json();
      const scenes: number[] = (d.scenes ?? []).filter((t: number) => t > 0.1);
      setCutPoints(scenes);
      toast.success(`${scenes.length} cenas detectadas`);
    } catch (e: any) {
      toast.error("Erro ao detectar cenas");
    } finally {
      setToolLoading(null);
    }
  }

  // ── Bobby Chat ─────────────────────────────────────────────────────────────
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
        fetchThumbnails();
      }
    } catch {
      setMessages(m => [...m, { role: "bobby", content: "Erro de conexão com o servidor.", type: "text" }]);
    } finally {
      setBobbyTyping(false);
    }
  }

  async function openBobbyTab() {
    setActiveTab("bobby");
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

  // ── Asset upload ───────────────────────────────────────────────────────────
  async function uploadAsset(file: File, type: "logo" | "music") {
    if (!sessionId) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch(`${API}/upload-asset/${sessionId}?type=${type}`, {
        method: "POST", body: fd,
      });
      const d = await r.json();
      if (type === "logo") setLogoPath(d.path);
      else setMusicPath(d.path);
      toast.success(`${type === "logo" ? "Logo" : "Música"} carregado!`);
    } catch {
      toast.error("Erro ao enviar arquivo");
    }
  }

  const bobbySuggestions = [
    "Remova os silêncios",
    "Adicione legendas em português",
    "Formate para Reels",
    "Aplique color grade cinematic",
    "Normalize o áudio",
    "Adicione zoom punch nos momentos de impacto",
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // UPLOAD SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (!videoInfo) {
    return (
      <div className="min-h-screen bg-[#07080A] flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-8 text-center mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B9FF4B] to-transparent opacity-60" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1a2a00] to-[#2a4000] border-2 border-[#B9FF4B]/30 flex items-center justify-center text-4xl mx-auto mb-4 shadow-[0_0_30px_rgba(185,255,75,0.1)]">
              🎬
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Bobby</h2>
            <p className="text-xs text-[#B9FF4B]/60 uppercase tracking-widest mb-3">Editor de Vídeo IA</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B9FF4B]/10 border border-[#B9FF4B]/20 text-[#B9FF4B] text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B9FF4B] animate-pulse" />
              Disponível para editar
            </div>
            <p className="text-sm text-[#444] mt-4">Carregue um vídeo e eu cuido da edição</p>
          </div>

          {/* Platform selector */}
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4 mb-4">
            <p className="text-[10px] uppercase tracking-widest text-[#333] mb-3">Para qual plataforma?</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(selectedPlatform === p.id ? null : p.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border text-center transition-all",
                    selectedPlatform === p.id
                      ? "border-[#B9FF4B]/40 bg-[#B9FF4B]/8"
                      : "border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2a2a2a]"
                  )}
                >
                  <span className="text-base leading-none">{p.icon}</span>
                  <span className={cn("text-[10px] font-semibold leading-tight", selectedPlatform === p.id ? "text-[#B9FF4B]" : "text-[#666]")}>{p.label}</span>
                  <span className="text-[9px] text-[#333]">{p.ratio}</span>
                </button>
              ))}
            </div>
            {selectedPlatform && (
              <p className="text-[10px] text-[#B9FF4B]/60 mt-2 text-center">
                Bobby vai formatar para {PLATFORMS.find(p => p.id === selectedPlatform)?.res}
              </p>
            )}
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
            className="border-2 border-dashed border-[#1e1e1e] rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-[#B9FF4B]/30 hover:bg-[#B9FF4B]/5 group"
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

          <input ref={fileRef} type="file" accept="video/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN EDITOR
  // ══════════════════════════════════════════════════════════════════════════
  const dur = videoInfo.duration;

  return (
    <div className="min-h-screen bg-[#07080A] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#111] px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <span className="text-lg">🎬</span>
        <span className="text-sm font-semibold text-white">Bobby</span>
        {clientName && (
          <>
            <span className="text-[#222] mx-1">·</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#B9FF4B18", color: "#B9FF4B", border: "1px solid #B9FF4B30" }}>
              {clientName}
            </span>
          </>
        )}
        <span className="text-[#222] mx-1">|</span>
        <span className="text-xs text-[#444] truncate max-w-[120px]">{filename}</span>

        {/* Platform quick-select */}
        <div className="flex items-center gap-1 ml-2">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPlatform(p.id);
                applyEdit("reframe_video", { format: p.id });
              }}
              title={`${p.label} ${p.ratio} · ${p.res}`}
              className={cn(
                "h-7 px-2 rounded-md border text-[10px] font-semibold transition-all",
                selectedPlatform === p.id
                  ? "border-[#B9FF4B]/40 bg-[#B9FF4B]/12 text-[#B9FF4B]"
                  : "border-[#1a1a1a] text-[#3a3a3a] hover:border-[#333] hover:text-[#666]"
              )}
            >
              {p.icon}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-[#111] border border-[#1a1a1a] font-mono text-[#444]">
            {videoInfo.width}×{videoInfo.height}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#111] border border-[#1a1a1a] font-mono text-[#444]">
            {fmtDuration(dur)}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#111] border border-[#1a1a1a] font-mono text-[#444]">
            {videoInfo.fps}fps
          </span>
          <span className="px-2 py-0.5 rounded bg-[#111] border border-[#1a1a1a] font-mono text-[#444]">
            {videoInfo.size_mb}MB
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Video + Timeline ─────────────────────────────────────── */}
        <div className="w-[58%] flex flex-col gap-3 p-5 border-r border-[#111]">
          {videoUrl && (
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              className="w-full rounded-xl bg-black border border-[#111] shadow-2xl"
            />
          )}

          {/* Timeline */}
          <div className="rounded-xl border border-[#111] bg-[#0d0d0d] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[#333]">Timeline</span>
              {cutPoints.length > 0 && (
                <button
                  onClick={clearCuts}
                  className="flex items-center gap-1 text-[10px] text-[#444] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Limpar cortes
                </button>
              )}
            </div>
            <Timeline
              duration={dur}
              thumbnails={thumbnails}
              cutPoints={cutPoints}
              onAddCut={addCutPoint}
              onRemoveCut={removeCutPoint}
              onApplyCuts={applyCuts}
              toolLoading={toolLoading}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setVideoInfo(null); setVideoUrl(null); setSessionId(null);
                setMessages([]); setGreeted(false); setThumbnails([]);
                setCutPoints([]); setActiveTab("bobby");
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

        {/* ── RIGHT: Tabs ────────────────────────────────────────────────── */}
        <div className="w-[42%] flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="border-b border-[#111] p-2 flex gap-1">
            <TabBtn id="bobby" label="Bobby" icon={<Sparkles />} active={activeTab === "bobby"} onClick={openBobbyTab} />
            <TabBtn id="corte" label="Corte" icon={<Scissors />} active={activeTab === "corte"} onClick={() => setActiveTab("corte")} />
            <TabBtn id="angulo" label="Ângulo" icon={<Camera />} active={activeTab === "angulo"} onClick={() => setActiveTab("angulo")} />
            <TabBtn id="efeitos" label="Efeitos" icon={<Zap />} active={activeTab === "efeitos"} onClick={() => setActiveTab("efeitos")} />
            <TabBtn id="cor" label="Cor" icon={<Palette />} active={activeTab === "cor"} onClick={() => setActiveTab("cor")} />
            <TabBtn id="legendas" label="Legendas" icon={<Subtitles />} active={activeTab === "legendas"} onClick={() => setActiveTab("legendas")} />
            <TabBtn id="assets" label="Assets" icon={<Layers />} active={activeTab === "assets"} onClick={() => setActiveTab("assets")} />
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* ── TAB: Bobby ──────────────────────────────────────────── */}
            {activeTab === "bobby" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a2a00] to-[#2a4000] border-2 border-[#B9FF4B]/20 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(185,255,75,0.08)]">
                        🎬
                      </div>
                      <p className="text-xs text-[#333] text-center">Bobby está pronto para editar</p>
                    </div>
                  )}

                  {messages.map((msg, i) => {
                    if (msg.type === "action") return (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#B9FF4B]/5 border border-[#B9FF4B]/15 text-[#B9FF4B] text-[11px]">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        {msg.content}
                      </div>
                    );
                    if (msg.type === "error") return (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/5 border border-red-500/15 text-red-400 text-[11px]">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {msg.content}
                      </div>
                    );
                    if (msg.role === "bobby") return (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a2a00] to-[#2a4000] border border-[#B9FF4B]/15 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">🎬</div>
                        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-[#ccc] leading-relaxed max-w-[85%] whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    );
                    return (
                      <div key={i} className="flex gap-2 items-start flex-row-reverse">
                        <div className="w-7 h-7 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-sm flex-shrink-0 mt-0.5">👤</div>
                        <div className="bg-[#111520] border border-[#1a2030] rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-[#ccc] leading-relaxed max-w-[85%]">
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}

                  {bobbyTyping && (
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a2a00] to-[#2a4000] border border-[#B9FF4B]/15 flex items-center justify-center text-sm flex-shrink-0">🎬</div>
                      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl rounded-tl-sm px-3 py-2">
                        <div className="flex gap-1">
                          {[0, 1, 2].map(j => (
                            <span key={j} className="w-1.5 h-1.5 rounded-full bg-[#B9FF4B]/40 animate-bounce"
                              style={{ animationDelay: `${j * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {messages.length <= 2 && (
                  <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                    {bobbySuggestions.map(s => (
                      <button key={s} onClick={() => sendToBobby(s)} disabled={bobbyTyping}
                        className="px-2.5 py-1 rounded-full border border-[#1e1e1e] text-[11px] text-[#555] hover:border-[#B9FF4B]/25 hover:text-[#B9FF4B]/60 transition-colors disabled:opacity-40">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-[#111] p-3">
                  <div className="flex gap-2">
                    <input
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="Fale com Bobby..."
                      disabled={bobbyTyping}
                      className="flex-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] outline-none focus:border-[#B9FF4B]/30 transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={bobbyTyping || !inputValue.trim()}
                      className="p-2 rounded-lg bg-[#B9FF4B]/10 border border-[#B9FF4B]/20 text-[#B9FF4B] hover:bg-[#B9FF4B]/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {bobbyTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Corte ──────────────────────────────────────────── */}
            {activeTab === "corte" && (
              <div className="p-4 space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-[#333]">Ferramentas de Corte</p>

                <div className="space-y-2">
                  <p className="text-xs text-[#555]">Use a timeline abaixo do vídeo para marcar pontos de corte. Os segmentos destacados em verde serão mantidos.</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={detectScenes}
                    disabled={toolLoading === "scenes"}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#111] border border-[#1a1a1a] text-xs text-[#555] hover:border-[#B9FF4B]/20 hover:text-[#B9FF4B]/60 transition-colors disabled:opacity-40"
                  >
                    {toolLoading === "scenes"
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Detectando cenas...</>
                      : <><ScanLine className="w-3.5 h-3.5" /> Auto-detectar cenas</>
                    }
                  </button>

                  <button
                    onClick={() => applyEdit("remove_silence", { min_duration: 1.5 })}
                    disabled={!!toolLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#111] border border-[#1a1a1a] text-xs text-[#555] hover:border-[#B9FF4B]/20 hover:text-[#B9FF4B]/60 transition-colors disabled:opacity-40"
                  >
                    {toolLoading === "remove_silence"
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Removendo silêncios...</>
                      : <><Volume2 className="w-3.5 h-3.5" /> Remover silêncios</>
                    }
                  </button>

                  {cutPoints.length > 0 && (
                    <button
                      onClick={clearCuts}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#111] border border-[#1a1a1a] text-xs text-[#555] hover:border-red-400/20 hover:text-red-400/60 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Limpar todos os cortes
                    </button>
                  )}
                </div>

                {cutPoints.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-[#333]">Pontos de corte ({cutPoints.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cutPoints.sort((a, b) => a - b).map((cp, i) => (
                        <div key={i} className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-md px-2 py-0.5">
                          <span className="text-[10px] text-[#B9FF4B] font-mono">{fmtTime(cp)}</span>
                          <button onClick={() => removeCutPoint(cp)} className="text-[#333] hover:text-red-400 transition-colors">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={applyCuts}
                      disabled={toolLoading === "multi_cut"}
                      className="w-full py-2 rounded-lg bg-[#B9FF4B]/10 border border-[#B9FF4B]/20 text-[#B9FF4B] text-xs font-medium hover:bg-[#B9FF4B]/15 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {toolLoading === "multi_cut"
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Aplicando...</>
                        : <><ScissorsLineDashed className="w-3 h-3" /> Aplicar cortes</>
                      }
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: Ângulo ─────────────────────────────────────────── */}
            {activeTab === "angulo" && (
              <div className="p-4 space-y-5">
                <p className="text-[10px] uppercase tracking-widest text-[#333]">Ângulo & Movimento</p>

                {/* Rotation */}
                <div className="space-y-2">
                  <p className="text-xs text-[#555]">Rotação</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { icon: <RotateCcw className="w-4 h-4" />, label: "-90°", degrees: -90 },
                      { icon: <RotateCw className="w-4 h-4" />, label: "+90°", degrees: 90 },
                      { icon: <RefreshCw className="w-4 h-4" />, label: "180°", degrees: 180 },
                      { icon: <FlipHorizontal className="w-4 h-4" />, label: "Espelhar", degrees: null },
                    ].map(({ icon, label, degrees }) => (
                      <button
                        key={label}
                        onClick={() => degrees !== null && applyEdit("rotate_video", { degrees })}
                        disabled={!!toolLoading || degrees === null}
                        className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] text-[#555] hover:border-[#B9FF4B]/20 hover:text-[#B9FF4B]/60 transition-colors disabled:opacity-30 text-[10px]"
                      >
                        {toolLoading === "rotate_video" ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#111]" />

                {/* Zoom crop */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Zoom Estático</p>
                  <Slider label="Zoom" value={zoomScale} min={1.1} max={3.0} step={0.1} unit="x" onChange={setZoomScale} />
                  <Slider label="Foco horizontal" value={zoomX} min={0} max={1} step={0.05} unit="" onChange={setZoomX} />
                  <Slider label="Foco vertical" value={zoomY} min={0} max={1} step={0.05} unit="" onChange={setZoomY} />
                  <ApplyButton
                    loading={toolLoading === "zoom_crop"}
                    onClick={() => applyEdit("zoom_crop", { scale: zoomScale, x_pct: zoomX, y_pct: zoomY })}
                    label={`Aplicar zoom ${zoomScale}x`}
                    icon={<ZoomIn />}
                  />
                </div>

                <div className="border-t border-[#111]" />

                {/* Ken Burns */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Ken Burns</p>
                  <div className="flex gap-1.5">
                    {(["in", "out"] as const).map(d => (
                      <button key={d}
                        onClick={() => setKbDirection(d)}
                        className={cn(
                          "flex-1 py-1.5 rounded-md border text-xs transition-colors",
                          kbDirection === d
                            ? "border-[#B9FF4B]/40 bg-[#B9FF4B]/10 text-[#B9FF4B]"
                            : "border-[#1e1e1e] text-[#444] hover:border-[#2a2a2a]"
                        )}>
                        {d === "in" ? "Zoom In" : "Zoom Out"}
                      </button>
                    ))}
                  </div>
                  <Slider label="Intensidade" value={kbIntensity} min={1.1} max={2.0} step={0.1} unit="x" onChange={setKbIntensity} />
                  <ApplyButton
                    loading={toolLoading === "ken_burns"}
                    onClick={() => applyEdit("ken_burns", { zoom_direction: kbDirection, intensity: kbIntensity })}
                    label="Aplicar Ken Burns"
                    icon={<Film />}
                  />
                </div>

                <div className="border-t border-[#111]" />

                {/* Camera Shake */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Camera Shake</p>
                  <Slider label="Intensidade" value={shakeIntensity} min={1} max={20} step={1} unit="px" onChange={setShakeIntensity} />
                  <ApplyButton
                    loading={toolLoading === "camera_shake"}
                    onClick={() => applyEdit("camera_shake", { intensity: shakeIntensity })}
                    label="Aplicar shake"
                    icon={<Wind />}
                  />
                </div>
              </div>
            )}

            {/* ── TAB: Efeitos ────────────────────────────────────────── */}
            {activeTab === "efeitos" && (
              <div className="p-4 space-y-5">
                <p className="text-[10px] uppercase tracking-widest text-[#333]">Efeitos Dinâmicos</p>

                {/* Zoom Punch */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Zoom Punch</p>
                  <p className="text-[10px] text-[#333]">Insira os timestamps separados por vírgula (ex: 1.5, 3.2, 5.8)</p>
                  <input
                    type="text"
                    value={punchTimes}
                    onChange={e => setPunchTimes(e.target.value)}
                    placeholder="1.5, 3.2, 5.8"
                    className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-md px-3 py-2 text-xs text-white placeholder-[#333] outline-none focus:border-[#B9FF4B]/30 transition-colors"
                  />
                  <Slider label="Intensidade do zoom" value={punchZoom} min={1.02} max={1.3} step={0.01} unit="x" onChange={setPunchZoom} />
                  <ApplyButton
                    loading={toolLoading === "zoom_punch"}
                    onClick={() => {
                      const times = punchTimes.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                      if (times.length === 0) { toast.error("Insira pelo menos um timestamp"); return; }
                      applyEdit("zoom_punch", { times, zoom: punchZoom });
                    }}
                    label="Aplicar zoom punch"
                    icon={<Zap />}
                  />
                </div>

                <div className="border-t border-[#111]" />

                {/* Speed Ramp */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Speed Ramp</p>
                  <p className="text-[10px] text-[#333]">Segmento em câmera lenta (o resto fica em avanço rápido)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#444] block mb-1">Início (s)</label>
                      <input type="number" min={0} max={dur} step={0.5} value={rampSlowStart}
                        onChange={e => setRampSlowStart(+e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-md px-2 py-1.5 text-xs text-white focus:border-[#B9FF4B]/40 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#444] block mb-1">Fim (s)</label>
                      <input type="number" min={0} max={dur} step={0.5} value={rampSlowEnd}
                        onChange={e => setRampSlowEnd(+e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-md px-2 py-1.5 text-xs text-white focus:border-[#B9FF4B]/40 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#444] block mb-1">Vel. rápida</label>
                      <select value={rampFastSpeed} onChange={e => setRampFastSpeed(+e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-md px-2 py-1.5 text-xs text-white outline-none">
                        {[1.5, 2.0, 2.5, 3.0, 4.0].map(v => <option key={v} value={v}>{v}x</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#444] block mb-1">Vel. lenta</label>
                      <select value={rampSlowSpeed} onChange={e => setRampSlowSpeed(+e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-md px-2 py-1.5 text-xs text-white outline-none">
                        {[0.1, 0.2, 0.3, 0.5, 0.75].map(v => <option key={v} value={v}>{v}x</option>)}
                      </select>
                    </div>
                  </div>
                  <ApplyButton
                    loading={toolLoading === "speed_ramp"}
                    onClick={() => applyEdit("speed_ramp", {
                      slow_segments: [[rampSlowStart, rampSlowEnd]],
                      fast_speed: rampFastSpeed,
                      slow_speed: rampSlowSpeed,
                    })}
                    label="Aplicar speed ramp"
                    icon={<Gauge />}
                  />
                </div>

                <div className="border-t border-[#111]" />

                {/* Blur Background */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Blur Background</p>
                  <p className="text-[10px] text-[#333]">Desfoca o fundo mantendo o centro nítido (efeito portrait)</p>
                  <Slider label="Intensidade do desfoque" value={blurStrength} min={5} max={50} step={5} unit="" onChange={setBlurStrength} />
                  <ApplyButton
                    loading={toolLoading === "blur_background"}
                    onClick={() => applyEdit("blur_background", { blur_strength: blurStrength })}
                    label="Aplicar blur background"
                    icon={<Eye />}
                  />
                </div>

                <div className="border-t border-[#111]" />

                {/* Premium — Enhance */}
                <div className="space-y-2">
                  <p className="text-xs text-[#555]">Melhoria de Imagem</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "clarity",     label: "Clarity",      desc: "Nitidez + denoise",   icon: "✦" },
                      { id: "hdr",         label: "HDR",          desc: "Alto contraste",       icon: "◈" },
                      { id: "denoise",     label: "Denoise",      desc: "Reduz ruído",          icon: "◎" },
                      { id: "smooth",      label: "Smooth Skin",  desc: "Suaviza pele",         icon: "◌" },
                      { id: "vivid",       label: "Vivid",        desc: "Cores vibrantes",      icon: "◉" },
                      { id: "dark_enhance",label: "Dark Boost",   desc: "Ilumina escuro",       icon: "◐" },
                    ].map(p => (
                      <button key={p.id}
                        onClick={() => applyEdit("enhance_video", { preset: p.id })}
                        disabled={!!toolLoading}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]
                                   text-left hover:border-[#B9FF4B]/25 transition-colors disabled:opacity-40"
                      >
                        <span className="text-[#B9FF4B]/60 text-base leading-none">{p.icon}</span>
                        <div>
                          <p className="text-xs text-[#ccc] font-medium">{p.label}</p>
                          <p className="text-[10px] text-[#444]">{p.desc}</p>
                        </div>
                        {toolLoading === "enhance_video" && <Loader2 className="w-3 h-3 animate-spin ml-auto text-[#B9FF4B]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#111]" />

                {/* Film Grain */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Grão de Filme</p>
                  <p className="text-[10px] text-[#333]">Textura cinematográfica orgânica</p>
                  <Slider label="Intensidade" value={grainIntensity} min={5} max={30} step={1} unit="" onChange={setGrainIntensity} />
                  <ApplyButton
                    loading={toolLoading === "film_grain"}
                    onClick={() => applyEdit("film_grain", { intensity: grainIntensity })}
                    label="Adicionar grão"
                    icon={<Sparkles />}
                  />
                </div>

                <div className="border-t border-[#111]" />

                {/* Letterbox */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Letterbox Cinemático</p>
                  <p className="text-[10px] text-[#333]">Barras pretas 2.35:1 — proporção widescreen de cinema</p>
                  <ApplyButton
                    loading={toolLoading === "letterbox"}
                    onClick={() => applyEdit("letterbox", {})}
                    label="Aplicar letterbox"
                    icon={<Film />}
                  />
                </div>
              </div>
            )}

            {/* ── TAB: Legendas ───────────────────────────────────────── */}
            {activeTab === "legendas" && (
              <div className="p-4 space-y-5">
                <p className="text-[10px] uppercase tracking-widest text-[#333]">Legendas Animadas</p>

                {/* Estilo */}
                <div className="space-y-2">
                  <p className="text-xs text-[#555]">Estilo de animação</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "fade",     label: "Fade",     desc: "Elegante",     preview: "opacity" },
                      { id: "slide",    label: "Slide",    desc: "Dinâmico",     preview: "slide" },
                      { id: "pop",      label: "Pop",      desc: "Impactante",   preview: "scale" },
                      { id: "glow",     label: "Glow",     desc: "Dramático",    preview: "glow" },
                      { id: "box",      label: "Box",      desc: "Legível",      preview: "box" },
                      { id: "karaoke",  label: "Karaoke",  desc: "Palavra a palavra", preview: "karaoke" },
                    ].map(s => (
                      <button key={s.id} onClick={() => setSubStyle(s.id)}
                        className={cn(
                          "flex flex-col p-2.5 rounded-lg border text-left transition-colors",
                          subStyle === s.id
                            ? "border-[#B9FF4B]/40 bg-[#B9FF4B]/8"
                            : "border-[#1a1a1a] bg-[#0d0d0d] hover:border-[#2a2a2a]"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-semibold mb-0.5",
                          subStyle === s.id ? "text-[#B9FF4B]" : "text-[#888]"
                        )}>{s.label}</span>
                        <span className="text-[10px] text-[#444]">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#111]" />

                {/* Cor do texto */}
                <div className="space-y-2">
                  <p className="text-xs text-[#555]">Cor do texto</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: "white",  hex: "#ffffff" },
                      { id: "yellow", hex: "#ffff00" },
                      { id: "cyan",   hex: "#00ffff" },
                      { id: "green",  hex: "#00ff00" },
                      { id: "orange", hex: "#ff8000" },
                      { id: "pink",   hex: "#ff80ff" },
                    ].map(c => (
                      <button key={c.id} onClick={() => setSubColor(c.id)}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-all",
                          subColor === c.id ? "border-[#B9FF4B] scale-110" : "border-[#333] hover:border-[#555]"
                        )}
                        style={{ background: c.hex }}
                        title={c.id}
                      />
                    ))}
                  </div>
                </div>

                {/* Posição */}
                <div className="space-y-2">
                  <p className="text-xs text-[#555]">Posição</p>
                  <div className="flex gap-1.5">
                    {[["bottom", "Baixo"], ["middle", "Meio"], ["top", "Cima"]].map(([v, l]) => (
                      <button key={v} onClick={() => setSubPosition(v)}
                        className={cn(
                          "flex-1 py-1.5 rounded-md border text-xs transition-colors",
                          subPosition === v
                            ? "border-[#B9FF4B]/40 bg-[#B9FF4B]/10 text-[#B9FF4B]"
                            : "border-[#1a1a1a] text-[#444] hover:border-[#2a2a2a]"
                        )}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Idioma */}
                <div className="space-y-2">
                  <p className="text-xs text-[#555]">Idioma do áudio</p>
                  <div className="flex gap-1.5">
                    {[["pt", "Português"], ["en", "English"], ["es", "Español"]].map(([v, l]) => (
                      <button key={v} onClick={() => setSubLang(v)}
                        className={cn(
                          "flex-1 py-1.5 rounded-md border text-xs transition-colors",
                          subLang === v
                            ? "border-[#B9FF4B]/40 bg-[#B9FF4B]/10 text-[#B9FF4B]"
                            : "border-[#1a1a1a] text-[#444] hover:border-[#2a2a2a]"
                        )}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Tamanho */}
                <Slider label="Tamanho da fonte" value={subFontSize} min={18} max={52} step={2} unit="pt" onChange={setSubFontSize} />

                {/* Bold */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#555]">Negrito</span>
                  <button
                    onClick={() => setSubBold(!subBold)}
                    className={cn(
                      "w-10 h-5 rounded-full border transition-colors relative",
                      subBold ? "bg-[#B9FF4B]/20 border-[#B9FF4B]/40" : "bg-[#111] border-[#222]"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full transition-all",
                      subBold ? "left-5 bg-[#B9FF4B]" : "left-0.5 bg-[#333]"
                    )} />
                  </button>
                </div>

                {/* Preview box */}
                <div className="rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] p-3 flex items-center justify-center min-h-[60px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                  <span
                    className="relative text-center"
                    style={{
                      color: ({ white: "#fff", yellow: "#ff0", cyan: "#0ff", green: "#0f0", orange: "#f80", pink: "#f0f" } as any)[subColor] || "#fff",
                      fontSize: `${Math.round(subFontSize * 0.5)}px`,
                      fontWeight: subBold ? "bold" : "normal",
                      textShadow: subStyle === "glow" ? "0 0 10px currentColor" : "1px 1px 3px #000",
                      background: subStyle === "box" ? "rgba(0,0,0,0.7)" : "transparent",
                      padding: subStyle === "box" ? "2px 8px" : "0",
                      borderRadius: subStyle === "box" ? "4px" : "0",
                    }}
                  >
                    Exemplo de legenda animada
                  </span>
                </div>

                <ApplyButton
                  loading={toolLoading === "animated_subtitles"}
                  onClick={() => applyEdit("animated_subtitles", {
                    style: subStyle,
                    color: subColor,
                    font_size: subFontSize,
                    position: subPosition,
                    language: subLang,
                    bold: subBold,
                  })}
                  label="Gerar legendas animadas"
                  icon={<Subtitles />}
                />
                <p className="text-[10px] text-[#333] text-center">
                  Bobby vai transcrever o áudio e aplicar as legendas com o estilo escolhido
                </p>
              </div>
            )}

            {/* ── TAB: Cor ────────────────────────────────────────────── */}
            {activeTab === "cor" && (
              <div className="p-4 space-y-5">
                <p className="text-[10px] uppercase tracking-widest text-[#333]">Gradação de Cor</p>

                {/* Color grade presets */}
                <div className="space-y-2">
                  <p className="text-xs text-[#555]">Presets</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "cinematic", label: "Cinematic", desc: "Tom fílmico", gradient: "from-[#1a1500] to-[#2a2800]", accent: "#d4b04a" },
                      { id: "warm", label: "Warm", desc: "Tons quentes", gradient: "from-[#1a0800] to-[#2a1200]", accent: "#e06030" },
                      { id: "cool", label: "Cool", desc: "Tons frios", gradient: "from-[#00101a] to-[#001828]", accent: "#4090d0" },
                      { id: "vibrant", label: "Vibrant", desc: "Saturado", gradient: "from-[#1a0020] to-[#0a0a20]", accent: "#c040e0" },
                      { id: "bw", label: "B&W", desc: "Preto e branco", gradient: "from-[#111] to-[#1a1a1a]", accent: "#888" },
                      { id: "vintage", label: "Vintage", desc: "Retrô", gradient: "from-[#1a1000] to-[#241800]", accent: "#c08040" },
                      { id: "dramatic", label: "Dramatic", desc: "Alto contraste", gradient: "from-[#100008] to-[#0a0010]", accent: "#8040c0" },
                    ].map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => applyEdit("color_grade", { preset: preset.id })}
                        disabled={!!toolLoading}
                        className={cn(
                          "flex flex-col items-start p-3 rounded-xl border transition-all disabled:opacity-40",
                          `bg-gradient-to-br ${preset.gradient}`,
                          "border-[#1e1e1e] hover:border-[#333]"
                        )}
                      >
                        <div className="w-full h-1.5 rounded-full mb-2" style={{ background: `linear-gradient(to right, ${preset.accent}, transparent)` }} />
                        <span className="text-xs font-semibold text-white">{preset.label}</span>
                        <span className="text-[10px] text-[#555]">{preset.desc}</span>
                      </button>
                    ))}
                  </div>
                  {toolLoading === "color_grade" && (
                    <div className="flex items-center justify-center gap-2 text-xs text-[#B9FF4B]/60 py-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Aplicando gradação...
                    </div>
                  )}
                </div>

                <div className="border-t border-[#111]" />

                {/* Vignette */}
                <div className="space-y-2">
                  <p className="text-xs text-[#555]">Vinheta</p>
                  <div className="flex gap-1.5">
                    {(["light", "medium", "strong"] as const).map(s => (
                      <button key={s}
                        onClick={() => applyEdit("vignette", { strength: s })}
                        disabled={!!toolLoading}
                        className="flex-1 py-2 rounded-lg border border-[#1e1e1e] text-xs text-[#444] hover:border-[#B9FF4B]/20 hover:text-[#B9FF4B]/60 transition-colors disabled:opacity-40 capitalize"
                      >
                        {toolLoading === "vignette" ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#111]" />

                {/* Sharpen */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Nitidez</p>
                  <Slider label="Quantidade" value={sharpenAmount} min={0.5} max={3.0} step={0.1} unit="" onChange={setSharpenAmount} />
                  <ApplyButton
                    loading={toolLoading === "sharpen"}
                    onClick={() => applyEdit("sharpen", { amount: sharpenAmount })}
                    label="Aplicar nitidez"
                    icon={<Sun />}
                  />
                </div>
              </div>
            )}

            {/* ── TAB: Assets ─────────────────────────────────────────── */}
            {activeTab === "assets" && (
              <div className="p-4 space-y-5">
                <p className="text-[10px] uppercase tracking-widest text-[#333]">Assets & Mídia</p>

                {/* Logo */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Logo / Marca d'água</p>
                  <div
                    onClick={() => logoRef.current?.click()}
                    className="border border-dashed border-[#1e1e1e] rounded-lg p-4 text-center cursor-pointer hover:border-[#B9FF4B]/20 transition-colors"
                  >
                    {logoPath ? (
                      <div className="flex items-center gap-2 justify-center">
                        <CheckCircle2 className="w-4 h-4 text-[#B9FF4B]" />
                        <span className="text-xs text-[#B9FF4B]">Logo carregado</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon className="w-5 h-5 text-[#333]" />
                        <span className="text-xs text-[#444]">Selecionar logo (PNG)</span>
                      </div>
                    )}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadAsset(e.target.files[0], "logo")} />

                  {logoPath && (
                    <>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          ["topleft", "↖ Topo esq."], ["topright", "↗ Topo dir."],
                          ["bottomleft", "↙ Base esq."], ["bottomright", "↘ Base dir."], ["center", "• Centro"],
                        ].map(([v, l]) => (
                          <button key={v}
                            onClick={() => setLogoPosition(v)}
                            className={cn(
                              "py-1.5 rounded-md border text-[10px] transition-colors",
                              logoPosition === v
                                ? "border-[#B9FF4B]/40 bg-[#B9FF4B]/10 text-[#B9FF4B]"
                                : "border-[#1e1e1e] text-[#444] hover:border-[#2a2a2a]"
                            )}>{l}</button>
                        ))}
                      </div>
                      <ApplyButton
                        loading={toolLoading === "add_watermark"}
                        onClick={() => applyEdit("add_watermark", { logo_path: logoPath, position: logoPosition })}
                        label="Adicionar logo"
                        icon={<ImageIcon />}
                      />
                    </>
                  )}
                </div>

                <div className="border-t border-[#111]" />

                {/* Music */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Trilha Sonora</p>
                  <div
                    onClick={() => musicRef.current?.click()}
                    className="border border-dashed border-[#1e1e1e] rounded-lg p-4 text-center cursor-pointer hover:border-[#B9FF4B]/20 transition-colors"
                  >
                    {musicPath ? (
                      <div className="flex items-center gap-2 justify-center">
                        <CheckCircle2 className="w-4 h-4 text-[#B9FF4B]" />
                        <span className="text-xs text-[#B9FF4B]">Música carregada</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Music className="w-5 h-5 text-[#333]" />
                        <span className="text-xs text-[#444]">Selecionar música (MP3, WAV)</span>
                      </div>
                    )}
                  </div>
                  <input ref={musicRef} type="file" accept="audio/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadAsset(e.target.files[0], "music")} />

                  {musicPath && (
                    <>
                      <Slider label="Volume da música" value={musicVolume} min={0.05} max={1.0} step={0.05} unit="" onChange={setMusicVolume} />
                      <ApplyButton
                        loading={toolLoading === "add_music"}
                        onClick={() => applyEdit("add_music", { music_path: musicPath, volume: musicVolume })}
                        label="Adicionar trilha"
                        icon={<Music />}
                      />
                    </>
                  )}
                </div>

                <div className="border-t border-[#111]" />

                {/* Normalize audio */}
                <div className="space-y-2">
                  <p className="text-xs text-[#555]">Áudio</p>
                  <ApplyButton
                    loading={toolLoading === "normalize_audio"}
                    onClick={() => applyEdit("normalize_audio", {})}
                    label="Normalizar áudio (-16 LUFS)"
                    icon={<Volume2 />}
                  />
                </div>

                <div className="border-t border-[#111]" />

                {/* Subtitles */}
                <div className="space-y-3">
                  <p className="text-xs text-[#555]">Legendas automáticas</p>
                  <div className="flex gap-1.5">
                    {[["pt", "PT"], ["en", "EN"], ["es", "ES"]].map(([v, l]) => (
                      <button key={v}
                        onClick={() => applyEdit("add_subtitles", { language: v })}
                        disabled={!!toolLoading}
                        className="flex-1 py-2 rounded-lg border border-[#1e1e1e] text-xs text-[#444] hover:border-[#B9FF4B]/20 hover:text-[#B9FF4B]/60 transition-colors disabled:opacity-40"
                      >
                        {toolLoading === "add_subtitles" ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden inputs */}
      <input ref={fileRef} type="file" accept="video/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
    </div>
  );
}
