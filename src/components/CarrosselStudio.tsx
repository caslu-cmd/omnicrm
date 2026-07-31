import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles, Wand2, Download, Copy, Image as ImageIcon, Trash2, Plus,
  ChevronLeft, ChevronRight, Loader2, RefreshCw, Palette, Type, LayoutGrid,
  FileText, Lightbulb, Upload, X, CalendarClock, Send, CheckCircle2, Link2, Brain, TrendingUp,
  Zap, Library, FolderOpen, Plus as PlusIcon, Package,
} from "lucide-react";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/contexts/ClientsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  renderSlide, ensureFonts, loadImage, canvasToBlob,
  FORMAT_SIZE, FORMAT_LABEL, FONT_PAIRS, LAYOUTS, PALETTES, ACABAMENTOS,
  type SlideData, type LayoutId, type FormatId, type FontPairId, type Theme,
  type AcabamentoId, type BrandInfo,
} from "@/lib/carouselRender";

const LIME = "#B9FF4B";
const BG = "#07080A";

type Objetivo = "autoridade" | "educar" | "vender" | "engajar" | "lancamento";
type Aba = "roteiro" | "design" | "legenda" | "agendar";

interface Ideia { tema: string; gancho: string; formato: string; porque: string }
interface Skill { id: string; tipo: "copy" | "design"; nome: string; resumo: string; instrucoes: string; nativa: boolean }
interface Direcao {
  nome: string; referencia: string; porque: string;
  layout: LayoutId; fonte: FontPairId; bg: string; fg: string; accent: string;
  acabamento?: AcabamentoId;
}
/** Referência pode vir como URL (peça publicada num CDN) ou embutida em base64
 *  (peça que a Carol subiu). O diretor de arte recebe as duas do mesmo jeito. */
type ImagemRef = string | { data: string; mediaType?: string };
interface RefVisual { id: string; nome: string; imagens: ImagemRef[] | null; client_id: string | null }
interface MemoriaItem {
  id: string; tema: string; angulo: string | null; created_at: string;
  slides?: SlideData[] | null;
  design?: {
    layout?: LayoutId; fontPair?: FontPairId; bg?: string; fg?: string;
    accent?: string; formatId?: FormatId; acabamento?: AcabamentoId;
  } | null;
}
interface Conexao { platform: string; account_name: string | null; account_username: string | null; connected: boolean }

const OBJETIVOS: { id: Objetivo; label: string }[] = [
  { id: "autoridade", label: "Autoridade" },
  { id: "educar", label: "Ensinar" },
  { id: "vender", label: "Vender" },
  { id: "engajar", label: "Engajar" },
  { id: "lancamento", label: "Lançamento" },
];

function slugHandle(nome: string) {
  return "@" + nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

// ── UI helpers ────────────────────────────────────────────────────────────
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.34)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#F0F0F0",
  outline: "none",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  width: "100%",
};

/**
 * Miniatura de uma peça guardada na biblioteca, desenhada pelo próprio motor.
 * A biblioteca grava o roteiro ANTES das fotos, então aqui não há imagem —
 * a miniatura mostra layout, tipografia e cor, que é o que identifica a peça.
 */
function MiniPeca({ item, brand, fontesOk }: { item: MemoriaItem; brand: BrandInfo; fontesOk: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const slide = item.slides?.[0];
  const d = item.design ?? {};

  useEffect(() => {
    if (!fontesOk || !ref.current || !slide) return;
    try {
      renderSlide(ref.current, {
        slide,
        index: 0,
        total: item.slides?.length ?? 1,
        layout: d.layout ?? "editorial",
        format: d.formatId ?? "4:5",
        theme: {
          bg: d.bg ?? PALETTES[0].bg,
          fg: d.fg ?? PALETTES[0].fg,
          accent: d.accent ?? PALETTES[0].accent,
          fontPair: d.fontPair ?? "editorial",
        },
        brand,
        image: null,
        mostrarNumero: false,
        mostrarArraste: false,
        acabamento: d.acabamento ?? "nenhum",
        scale: 0.14,
      });
    } catch {
      /* peça antiga com formato inesperado: fica o fundo vazio, não derruba a lista */
    }
  }, [fontesOk, slide, item.slides?.length, d.layout, d.formatId, d.bg, d.fg, d.accent, d.fontPair, d.acabamento, brand]);

  if (!slide) {
    return (
      <div className="rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{ width: 68, height: 85, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <ImageIcon className="w-4 h-4" style={{ color: "rgba(255,255,255,0.2)" }} />
      </div>
    );
  }
  return (
    <canvas ref={ref} className="rounded-lg flex-shrink-0"
      style={{ width: 68, height: "auto", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }} />
  );
}

function Chip({ ativo, onClick, children, cor = LIME }: { ativo: boolean; onClick: () => void; children: React.ReactNode; cor?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
      style={{
        background: ativo ? `${cor}22` : "rgba(255,255,255,0.04)",
        border: `1px solid ${ativo ? `${cor}66` : "rgba(255,255,255,0.09)"}`,
        color: ativo ? cor : "rgba(255,255,255,0.55)",
      }}
    >
      {children}
    </button>
  );
}

// ── Página ────────────────────────────────────────────────────────────────
interface CarrosselStudioProps {
  /** Cliente já definido pelo contexto (workspace). */
  clientIdInicial?: string;
  /** Rodando dentro do workspace do cliente — some com o seletor e ajusta alturas. */
  embutido?: boolean;
}

export default function CarrosselStudio({ clientIdInicial = "", embutido = false }: CarrosselStudioProps) {
  const { clients } = useClients();
  const isMobile = useIsMobile();

  // Briefing
  const [clienteId, setClienteId] = useState(clientIdInicial);
  const [tema, setTema] = useState("");
  const [formato, setFormato] = useState<"carrossel" | "post">("carrossel");
  const [nSlides, setNSlides] = useState(7);
  const [objetivo, setObjetivo] = useState<Objetivo>("autoridade");
  const [publico, setPublico] = useState("");
  const [tom, setTom] = useState("");
  const [gerando, setGerando] = useState(false);
  const [buscandoIdeias, setBuscandoIdeias] = useState(false);
  const [ideias, setIdeias] = useState<Ideia[]>([]);

  // Conteúdo gerado
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [legenda, setLegenda] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [angulo, setAngulo] = useState("");
  const [dicaVisual, setDicaVisual] = useState("");
  const [melhorHorario, setMelhorHorario] = useState("");
  const [tituloProjeto, setTituloProjeto] = useState("");

  // Design
  const [layout, setLayout] = useState<LayoutId>("vidro");
  const [formatId, setFormatId] = useState<FormatId>("4:5");
  const [fontPair, setFontPair] = useState<FontPairId>("editorial");
  const [acabamento, setAcabamento] = useState<AcabamentoId>("nenhum");
  const [paleta, setPaleta] = useState(PALETTES[0]);
  const [bg, setBg] = useState(PALETTES[0].bg);
  const [fg, setFg] = useState(PALETTES[0].fg);
  const [accent, setAccent] = useState(PALETTES[0].accent);
  const [handle, setHandle] = useState("");
  const [marca, setMarca] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [mostrarNumero, setMostrarNumero] = useState(true);
  const [mostrarArraste, setMostrarArraste] = useState(true);

  // Estúdio
  const [aba, setAba] = useState<Aba>("roteiro");
  const [ativo, setAtivo] = useState(0);
  const [gerandoImg, setGerandoImg] = useState<number | null>(null);
  const [gerandoTodasImgs, setGerandoTodasImgs] = useState(false);
  const [reescrevendo, setReescrevendo] = useState<number | null>(null);
  const [baixando, setBaixando] = useState(false);
  const [fontesOk, setFontesOk] = useState(false);

  // Memória do cliente + tendências do Ben
  const [memoria, setMemoria] = useState<MemoriaItem[]>([]);
  const [refsVisuais, setRefsVisuais] = useState<RefVisual[]>([]);
  const [tendencias, setTendencias] = useState<{ conteudo: string; created_at: string } | null>(null);
  const [buscandoBen, setBuscandoBen] = useState(false);
  const [direcoes, setDirecoes] = useState<Direcao[]>([]);
  const [direcaoAtiva, setDirecaoAtiva] = useState<string | null>(null);
  const [buscandoDirecao, setBuscandoDirecao] = useState(false);
  const [lendoReferencia, setLendoReferencia] = useState(false);
  const [modoAuto, setModoAuto] = useState<string | null>(null);
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(false);
  const [novaSkill, setNovaSkill] = useState<{ tipo: "copy" | "design"; nome: string; resumo: string; instrucoes: string } | null>(null);
  const [salvandoSkill, setSalvandoSkill] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsAtivas, setSkillsAtivas] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`carrossel-skills-${clientIdInicial}`) ?? "[]"); }
    catch { return []; }
  });
  const [usarBen, setUsarBen] = useState(true);

  // Agendamento
  const [conexoes, setConexoes] = useState<Conexao[] | null>(null);
  const [plataformas, setPlataformas] = useState<string[]>([]);
  const [quando, setQuando] = useState<"agora" | "agendar">("agendar");
  const [dataHora, setDataHora] = useState("");
  const [agendando, setAgendando] = useState(false);
  const [agendado, setAgendado] = useState<{ quando: string; plataformas: string[] } | null>(null);
  const [memoriaId, setMemoriaId] = useState<string | null>(null);

  const mainRef = useRef<HTMLCanvasElement | null>(null);
  const thumbRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const refRef = useRef<HTMLInputElement | null>(null);
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [imgTick, setImgTick] = useState(0);

  const cliente = clients.find((c) => c.id === clienteId);
  const noEstudio = slides.length > 0;

  const theme: Theme = useMemo(() => ({ bg, fg, accent, fontPair }), [bg, fg, accent, fontPair]);
  const brand = useMemo(() => ({ nome: marca, handle, logoUrl }), [marca, handle, logoUrl]);

  /**
   * Sem `catch`, uma falha aqui deixava `fontesOk` em false para sempre e o
   * estúdio ficava girando sem dizer nada — a fonte vem do Google, então basta
   * rede ruim, bloqueador ou CSP para travar a tela inteira.
   * Desenhar com a fonte do sistema é muito melhor do que não desenhar.
   */
  useEffect(() => {
    let vivo = true;
    ensureFonts()
      .catch(() => undefined)
      .finally(() => { if (vivo) setFontesOk(true); });
    return () => { vivo = false; };
  }, []);

  // Puxa identidade visual do cliente selecionado
  useEffect(() => {
    if (!cliente) return;
    setMarca(cliente.name);
    setHandle(slugHandle(cliente.name));
    try {
      const bi = JSON.parse(localStorage.getItem(`brand-identity-${cliente.id}`) ?? "{}");
      if (bi.primaryColor) setAccent(bi.primaryColor);
      else if (cliente.color) setAccent(cliente.color);
      if (bi.logoUrl) setLogoUrl(bi.logoUrl);
    } catch {
      if (cliente.color) setAccent(cliente.color);
    }
  }, [cliente]);

  // Carrega logo
  useEffect(() => {
    let vivo = true;
    if (!logoUrl) { setLogoImg(null); return; }
    loadImage(logoUrl).then((img) => { if (vivo) setLogoImg(img); });
    return () => { vivo = false; };
  }, [logoUrl]);

  // Pré-carrega imagens dos slides
  useEffect(() => {
    let vivo = true;
    const pendentes = slides.map((s) => s.imagem).filter((u): u is string => !!u && !imgCache.current.has(u));
    if (!pendentes.length) return;
    Promise.all(pendentes.map(async (u) => {
      const img = await loadImage(u);
      if (img) imgCache.current.set(u, img);
    })).then(() => { if (vivo) setImgTick((t) => t + 1); });
    return () => { vivo = false; };
  }, [slides]);

  const opcoesBase = useCallback(
    (i: number) => ({
      slide: slides[i],
      index: i,
      total: slides.length,
      layout,
      format: formatId,
      theme,
      brand,
      image: slides[i]?.imagem ? imgCache.current.get(slides[i].imagem as string) ?? null : null,
      logo: logoImg,
      mostrarNumero,
      mostrarArraste,
      acabamento,
    }),
    [slides, layout, formatId, theme, brand, logoImg, mostrarNumero, mostrarArraste, acabamento],
  );

  // Render do preview + miniaturas
  useEffect(() => {
    if (!fontesOk || !slides.length) return;
    const idx = Math.min(ativo, slides.length - 1);
    if (mainRef.current) renderSlide(mainRef.current, { ...opcoesBase(idx), scale: 0.62 });
    slides.forEach((_, i) => {
      const c = thumbRefs.current[i];
      if (c) renderSlide(c, { ...opcoesBase(i), scale: 0.16 });
    });
  }, [fontesOk, slides, ativo, opcoesBase, imgTick]);

  // ── Memória do cliente (o que já foi criado) e tendências do Ben ───────
  const carregarMemoria = useCallback(async () => {
    if (!clienteId) { setMemoria([]); return; }
    const { data } = await (supabase as any)
      .from("carousel_memory")
      .select("id, tema, angulo, created_at, slides, design")
      .eq("client_id", clienteId)
      .order("created_at", { ascending: false })
      .limit(30);
    setMemoria((data ?? []) as MemoriaItem[]);
  }, [clienteId]);

  useEffect(() => { carregarMemoria(); }, [carregarMemoria]);

  /**
   * Referências visuais que o diretor de arte OLHA antes de decidir.
   * Vêm as da casa (client_id nulo) e as específicas deste cliente. Não são
   * template: a instrução de "adapte ao nicho" está no prompt da edge function.
   */
  const carregarRefs = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("visual_refs")
      .select("id, nome, imagens, client_id")
      .eq("ativa", true)
      .or(clienteId ? `client_id.is.null,client_id.eq.${clienteId}` : "client_id.is.null")
      .order("created_at", { ascending: false })
      .limit(12);
    setRefsVisuais((data ?? []) as RefVisual[]);
  }, [clienteId]);

  useEffect(() => { carregarRefs(); }, [carregarRefs]);

  /** As 3 primeiras imagens, priorizando as referências do próprio cliente. */
  const refsParaIA = () => {
    const ordenadas = [...refsVisuais].sort((a, b) => (b.client_id ? 1 : 0) - (a.client_id ? 1 : 0));
    return ordenadas
      .flatMap((r) => (Array.isArray(r.imagens) ? r.imagens : []))
      .filter(Boolean)
      .slice(0, 3)
      .map((img) => (typeof img === "string" ? { url: img } : img));
  };

  /**
   * Mantém a biblioteca em dia. O registro nasce junto com o roteiro, antes de
   * existir direção de arte e antes de qualquer edição — sem este sincronismo a
   * biblioteca guardaria a peça como ela era no primeiro minuto.
   * As fotos são data URLs de megabytes: ficam de fora da linha de propósito.
   */
  useEffect(() => {
    if (!memoriaId || !slides.length) return;
    const t = setTimeout(() => {
      (supabase as any).from("carousel_memory")
        .update({
          slides: slides.map((s) => ({ ...s, imagem: null })),
          legenda,
          hashtags,
          design: { layout, fontPair, bg, fg, accent, formatId, acabamento },
        })
        .eq("id", memoriaId)
        .then(() => undefined, () => undefined);
    }, 1500);
    return () => clearTimeout(t);
  }, [memoriaId, slides, legenda, hashtags, layout, fontPair, bg, fg, accent, formatId, acabamento]);

  useEffect(() => {
    if (!clienteId) { setTendencias(null); return; }
    let vivo = true;
    (supabase as any)
      .from("client_trends_cache")
      .select("conteudo, created_at")
      .eq("client_id", clienteId)
      .maybeSingle()
      .then(({ data }: { data: { conteudo: string; created_at: string } | null }) => {
        if (vivo) setTendencias(data ?? null);
      });
    return () => { vivo = false; };
  }, [clienteId]);

  const diasDoCache = tendencias
    ? Math.floor((Date.now() - new Date(tendencias.created_at).getTime()) / 86400000)
    : null;

  const atualizarTendencias = async () => {
    const nicho = cliente?.industry || tema || "marketing digital";
    setBuscandoBen(true);
    try {
      const { data, error } = await supabase.functions.invoke("ben-trends", {
        body: { nicho, plataforma: "todas", tipo_conteudo: "carrossel", client_name: cliente?.name },
      });
      if (error) throw new Error(error.message);
      const conteudo: string = data?.content ?? "";
      if (!conteudo) throw new Error(data?.error ?? "O Ben não retornou nada.");

      const { data: { session } } = await supabase.auth.getSession();
      if (session && clienteId) {
        await (supabase as any).from("client_trends_cache").upsert(
          { user_id: session.user.id, client_id: clienteId, nicho, conteudo },
          { onConflict: "user_id,client_id" },
        );
      }
      setTendencias({ conteudo, created_at: new Date().toISOString() });
      toast.success("Ben atualizou as tendências do segmento.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao consultar o Ben.");
    } finally {
      setBuscandoBen(false);
    }
  };

  useEffect(() => {
    let vivo = true;
    (supabase as any)
      .from("content_skills")
      .select("id, tipo, nome, resumo, instrucoes, nativa")
      .order("nativa", { ascending: false })
      .order("nome")
      .then(({ data }: { data: Skill[] | null }) => { if (vivo) setSkills(data ?? []); });
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(`carrossel-skills-${clienteId}`, JSON.stringify(skillsAtivas)); } catch { /* ignore */ }
  }, [skillsAtivas, clienteId]);

  const skillsParaIA = (tipo?: "copy" | "design") =>
    skills
      .filter((k) => skillsAtivas.includes(k.id) && (!tipo || k.tipo === tipo))
      .map((k) => `${k.nome}: ${k.instrucoes}`);

  const chamarDiretorDeArte = async () => {
    setBuscandoDirecao(true);
    try {
      const { data, error } = await supabase.functions.invoke("carousel-studio", {
        body: {
          action: "direcao",
          refs: refsParaIA(),
          nicho: cliente?.industry || "",
          tema,
          corMarca: accent,
          benTrends: benParaIA(),
          skills: skillsParaIA("design"),
          ...contextoCliente(),
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const lista: Direcao[] = data.direcoes ?? [];
      if (!lista.length) throw new Error("O diretor de arte não devolveu direções.");
      setDirecoes(lista);
      toast.success(`${lista.length} direções de arte prontas.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no diretor de arte.");
    } finally {
      setBuscandoDirecao(false);
    }
  };

  /** Reduz a imagem antes de mandar para a IA — print de celular é pesado. */
  const prepararReferencia = (file: File): Promise<{ base64: string; mediaType: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1100;
          const escala = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * escala);
          c.height = Math.round(img.height * escala);
          c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
          const dataUrl = c.toDataURL("image/jpeg", 0.85);
          resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
        };
        img.onerror = () => reject(new Error("Não consegui ler essa imagem."));
        img.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error("Não consegui ler essa imagem."));
      reader.readAsDataURL(file);
    });

  const lerReferencia = async (file: File) => {
    setLendoReferencia(true);
    try {
      const { base64, mediaType } = await prepararReferencia(file);
      const { data, error } = await supabase.functions.invoke("carousel-studio", {
        body: {
          action: "referencia",
          imagem: base64,
          mediaType,
          nicho: cliente?.industry || "",
          corMarca: accent,
          skills: skillsParaIA("design"),
          ...contextoCliente(),
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const lista: Direcao[] = data.direcoes ?? [];
      if (!lista.length) throw new Error("Não consegui extrair uma direção dessa imagem.");
      setDirecoes(lista);
      aplicarDirecao(lista[0]);
      toast.success("Referência lida — direção aplicada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao ler a referência.");
    } finally {
      setLendoReferencia(false);
    }
  };

  const aplicarDirecao = (d: Direcao) => {
    setLayout(d.layout);
    setFontPair(d.fonte);
    setBg(d.bg);
    setFg(d.fg);
    setAccent(d.accent);
    if (d.acabamento) setAcabamento(d.acabamento);
    setDirecaoAtiva(d.nome);
    toast.success(`Direção "${d.nome}" aplicada.`);
  };

  /** Faz o carrossel inteiro sozinha: roteiro, direção de arte e fotos. */
  const fazerTudoSozinha = async () => {
    if (!tema.trim()) { toast.error("Escreva o tema (ou peça uma pauta) antes."); return; }
    try {
      setModoAuto("Escrevendo o roteiro...");
      const novos = await gerar();
      if (!novos.length) { setModoAuto(null); return; }

      setModoAuto("Definindo a direção de arte...");
      const { data: dir } = await supabase.functions.invoke("carousel-studio", {
        body: {
          action: "direcao",
          refs: refsParaIA(),
          nicho: cliente?.industry || "",
          tema,
          corMarca: accent,
          benTrends: benParaIA(),
          skills: skillsParaIA("design"),
          ...contextoCliente(),
        },
      });
      const direcoesAuto: Direcao[] = dir?.direcoes ?? [];
      if (direcoesAuto.length) {
        setDirecoes(direcoesAuto);
        aplicarDirecao(direcoesAuto[0]);
      }

      // O layout só existe agora: é ele que decide onde a foto precisa de vazio.
      let layoutEscolhido = direcoesAuto[0]?.layout ?? layout;
      let precisaFoto = LAYOUTS.find((l) => l.id === layoutEscolhido)?.precisaImagem;

      /**
       * O roteiro sempre planeja uma foto. Se a direção escolhida usa um layout
       * tipográfico, esse trabalho vira lixo e a peça sai sem imagem — foi o que
       * aconteceu no primeiro uso real. Quando houver foto planejada, preferimos
       * uma direção que a aproveite, em vez de descartar em silêncio.
       */
      if (!precisaFoto && novos.some((s) => s.prompt_imagem)) {
        const comFoto = direcoesAuto.find((d) => LAYOUTS.find((l) => l.id === d.layout)?.precisaImagem);
        if (comFoto) {
          aplicarDirecao(comFoto);
          layoutEscolhido = comFoto.layout;
          precisaFoto = true;
          toast.info(`Direção "${comFoto.nome}" no lugar da primeira: o roteiro pediu foto e ela aproveita.`);
        } else {
          toast.warning("As 3 direções vieram sem foto, então a peça sai só com tipografia. Troque o layout na aba Design se quiser imagem.");
        }
      }

      if (precisaFoto) {
        setModoAuto(`Fotografando ${novos.length} ${novos.length === 1 ? "peça" : "slides"}...`);
        await gerarImagensDeTodos({ slides: novos, layout: layoutEscolhido });
      }

      setModoAuto(null);
      setAba("design");
      if (precisaFoto) toast.success("Pronto: roteiro, direção de arte e fotos.");
    } catch (e) {
      setModoAuto(null);
      toast.error(e instanceof Error ? e.message : "Erro no modo automático.");
    }
  };

  const criarSkill = async () => {
    if (!novaSkill?.nome.trim() || !novaSkill.instrucoes.trim()) {
      toast.error("A skill precisa de nome e instruções.");
      return;
    }
    setSalvandoSkill(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");
      const { data, error } = await (supabase as any).from("content_skills").insert({
        user_id: session.user.id,
        tipo: novaSkill.tipo,
        nome: novaSkill.nome.trim(),
        resumo: novaSkill.resumo.trim() || novaSkill.nome.trim(),
        instrucoes: novaSkill.instrucoes.trim(),
        nativa: false,
      }).select().single();
      if (error) throw error;
      setSkills((p) => [...p, data as Skill]);
      setSkillsAtivas((p) => [...p, (data as Skill).id]);
      setNovaSkill(null);
      toast.success("Skill criada e ativada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar a skill.");
    } finally {
      setSalvandoSkill(false);
    }
  };

  /** Reabre um conteúdo da biblioteca do cliente. */
  const abrirDaBiblioteca = async (id: string) => {
    const { data, error } = await (supabase as any)
      .from("carousel_memory")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) { toast.error("Não consegui abrir esse conteúdo."); return; }

    setSlides((data.slides ?? []) as SlideData[]);
    setLegenda(data.legenda ?? "");
    setHashtags((data.hashtags ?? []) as string[]);
    setAngulo(data.angulo ?? "");
    setTema(data.tema ?? "");
    setTituloProjeto(data.tema ?? "");
    setMemoriaId(id);
    const d = data.design ?? {};
    if (d.layout) setLayout(d.layout);
    if (d.fontPair) setFontPair(d.fontPair);
    if (d.bg) setBg(d.bg);
    if (d.fg) setFg(d.fg);
    if (d.accent) setAccent(d.accent);
    if (d.formatId) setFormatId(d.formatId);
    if (d.acabamento) setAcabamento(d.acabamento);
    setAtivo(0);
    setAba("roteiro");
    setMostrarBiblioteca(false);
    toast.success("Conteúdo reaberto.");
  };

  const historicoParaIA = () =>
    memoria.map((m) => (m.angulo ? `${m.tema} — ${m.angulo}` : m.tema));

  const benParaIA = () => (usarBen && tendencias ? tendencias.conteudo : "");

  // ── Ações de IA ────────────────────────────────────────────────────────
  const contextoCliente = () => {
    let briefing: Record<string, unknown> | null = null;
    try { briefing = cliente ? JSON.parse(localStorage.getItem(`client-briefing-${cliente.id}`) ?? "null") : null; } catch { /* ignore */ }
    return {
      cliente: {
        nome: cliente?.name ?? marca,
        segmento: cliente?.industry ?? "",
        publico: publico || (briefing?.publicoAlvo as string) || "",
        tom: tom || (briefing?.tomDeVoz as string) || "",
        diferenciais: (briefing?.diferenciais as string) || "",
        oferta: (briefing?.oferta as string) || "",
      },
      briefing: briefing ? JSON.stringify(briefing).slice(0, 2000) : "",
    };
  };

  /** Devolve os slides que acabou de escrever — o estado ainda não atualizou
   *  para quem chamou (closure), e o modo automático precisa da lista na mão. */
  const gerar = async (): Promise<SlideData[]> => {
    if (!tema.trim()) { toast.error("Escreva o tema do conteúdo."); return []; }
    setGerando(true);
    try {
      const ctx = contextoCliente();
      const { data, error } = await supabase.functions.invoke("carousel-studio", {
        body: {
          action: "strategy",
          tema, formato, nSlides, objetivo, publico, tom,
          plataforma: formatId === "9:16" ? "Instagram Stories" : "Instagram",
          benTrends: benParaIA(),
          historico: historicoParaIA(),
          skills: skillsParaIA("copy"),
          ...ctx,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const novos: SlideData[] = (data.slides ?? []).map((s: SlideData) => ({ ...s, imagem: null }));
      setSlides(novos);
      setLegenda(data.legenda ?? "");
      setHashtags(data.hashtags ?? []);
      setAngulo(data.angulo ?? "");
      setDicaVisual(data.dica_visual ?? "");
      setMelhorHorario(data.melhor_horario ?? "");
      setTituloProjeto(data.titulo_projeto ?? tema);
      setAtivo(0);
      setAba("roteiro");

      // Grava na memória do cliente para o próximo conteúdo não repetir.
      if (clienteId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: salvo } = await (supabase as any).from("carousel_memory").insert({
            user_id: session.user.id,
            client_id: clienteId,
            tema,
            angulo: data.angulo ?? null,
            objetivo,
            formato,
            slides: novos,
            legenda: data.legenda ?? "",
            hashtags: data.hashtags ?? [],
            design: { layout, fontPair, bg, fg, accent, formatId, acabamento },
          }).select("id").single();
          if (salvo?.id) setMemoriaId(salvo.id as string);
          carregarMemoria();
        }
      }
      toast.success(`${novos.length} ${novos.length === 1 ? "peça pronta" : "slides prontos"}. Agora é só ajustar o design.`);
      return novos;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar o conteúdo.");
      return [];
    } finally {
      setGerando(false);
    }
  };

  const pedirIdeias = async () => {
    setBuscandoIdeias(true);
    try {
      const { data, error } = await supabase.functions.invoke("carousel-studio", {
        body: {
          action: "ideias",
          nicho: cliente?.industry || tema || "marketing digital",
          benTrends: benParaIA(),
          historico: historicoParaIA(),
          ...contextoCliente(),
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setIdeias(data.ideias ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao buscar pautas.");
    } finally {
      setBuscandoIdeias(false);
    }
  };

  const reescreverSlide = async (i: number, instrucao: string) => {
    setReescrevendo(i);
    try {
      const s = slides[i];
      const { data, error } = await supabase.functions.invoke("carousel-studio", {
        body: {
          action: "slide", tema, instrucao,
          posicao: i + 1, total: slides.length,
          tipo: s.tipo, titulo: s.titulo, corpo: s.corpo,
          ...contextoCliente(),
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setSlides((prev) => prev.map((old, idx) => (idx === i ? { ...old, ...data.slide } : old)));
      toast.success("Slide reescrito.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao reescrever.");
    } finally {
      setReescrevendo(null);
    }
  };

  /** Extrai o base64 puro de uma data URL, para mandar como referência. */
  const base64De = (dataUrl?: string | null) =>
    dataUrl && dataUrl.startsWith("data:") ? dataUrl.split(",")[1] : null;

  /**
   * Onde cada layout escreve o texto — e, portanto, onde a foto PRECISA ter
   * espaço livre. O roteiro é escrito antes de existir layout, então o
   * `prompt_imagem` só sabe pedir "espaço vazio de um lado ou embaixo". Sem
   * esta cláusula o cartão de vidro cai em cima do rosto da pessoa.
   */
  const composicaoDoLayout = (l: LayoutId): string | null => {
    switch (l) {
      case "vidro":
        // Cartão translúcido centralizado no terço de baixo. O "nunca cortar o
        // topo da cabeça" é necessário: sem isso o gerador empurra a pessoa
        // para cima até o capacete/cabelo sair do quadro.
        return "CRITICAL COMPOSITION: vertical portrait. Place the person in the UPPER HALF of the frame, with the face turned toward the camera and clearly lit. Leave breathing room above the head: the top of the head (and any hat or helmet) must be FULLY INSIDE the frame with a visible margin — never touching or crossing the top edge. The BOTTOM THIRD must be calm, uncluttered background (floor, wall, sky, blurred depth) with no face, no hands and no busy detail, because a translucent card is composited there.";
      case "capa":
      case "foto":
        // Título grande alinhado à esquerda, junto da base.
        return "CRITICAL COMPOSITION: vertical portrait. Place the person on the RIGHT side of the frame. The LOWER LEFT half must be clear, quiet background with no face and no important detail, because large headline text is composited there.";
      case "revista":
        // A foto entra como faixa no topo, sem texto por cima.
        return "CRITICAL COMPOSITION: horizontal banner crop, subject centred and fully visible. No text is composited over this image, so it does not need empty space.";
      default:
        return null;
    }
  };

  /** Junta o pedido do roteiro com a composição que o layout exige. */
  const promptDaFoto = (s: SlideData, l: LayoutId) => {
    const base = s.prompt_imagem || `editorial photo about ${s.titulo}`;
    const comp = composicaoDoLayout(l);
    return comp ? `${base}\n\n${comp}` : base;
  };

  /**
   * `ctx` existe por causa de closure velha: num laço (ou logo depois do
   * roteiro) o estado `slides`/`layout` ainda é o antigo, e sem passar a lista
   * na mão a foto do slide 2 não encontra a do slide 1 para usar como
   * referência — cada slide saía com uma pessoa diferente.
   */
  const gerarImagem = async (
    i: number,
    comReferencia = true,
    ctx?: { slides?: SlideData[]; layout?: LayoutId },
  ): Promise<string | null> => {
    setGerandoImg(i);
    try {
      const lista = ctx?.slides ?? slides;
      const layoutAtual = ctx?.layout ?? layout;
      const s = lista[i];
      if (!s) return null;

      // A primeira foto do carrossel vira referência das outras: mesma pessoa,
      // mesma luz, mesma paleta em todos os slides.
      const referencias: Array<{ data: string; mediaType: string }> = [];
      if (comReferencia && i > 0) {
        const primeira = lista.find((sl, idx) => idx < i && sl.imagem);
        const b64 = base64De(primeira?.imagem);
        if (b64) referencias.push({ data: b64, mediaType: "image/jpeg" });
      }

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: promptDaFoto(s, layoutAtual),
          aspectRatio: formatId === "9:16" ? "9:16" : formatId === "1:1" ? "1:1" : "4:5",
          clientContext: { name: marca, industry: cliente?.industry ?? "", brandColor: accent },
          referencias,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.imageData) throw new Error(data?.message ?? "A IA não retornou imagem.");
      const url = `data:${data.mimeType ?? "image/jpeg"};base64,${data.imageData}`;
      const img = await loadImage(url);
      if (img) imgCache.current.set(url, img);
      setSlides((prev) => prev.map((old, idx) => (idx === i ? { ...old, imagem: url } : old)));
      toast.success(data.modelo ? `Imagem gerada (${data.modelo}).` : "Imagem gerada.");
      return url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar imagem.");
      return null;
    } finally {
      setGerandoImg(null);
    }
  };

  const gerarImagensDeTodos = async (ctx?: { slides?: SlideData[]; layout?: LayoutId }) => {
    setGerandoTodasImgs(true);
    try {
      // Lista local que vai sendo preenchida: é ela que carrega a foto do slide
      // anterior para o seguinte usar como referência.
      const atuais: SlideData[] = (ctx?.slides ?? slides).map((s) => ({ ...s }));
      for (let i = 0; i < atuais.length; i++) {
        if (atuais[i].imagem) continue;
        const url = await gerarImagem(i, true, { slides: atuais, layout: ctx?.layout });
        if (url) atuais[i] = { ...atuais[i], imagem: url };
      }
      toast.success("Imagens geradas para o carrossel inteiro.");
    } finally {
      setGerandoTodasImgs(false);
    }
  };

  const subirImagem = (i: number, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result);
      const img = await loadImage(url);
      if (img) imgCache.current.set(url, img);
      setSlides((prev) => prev.map((old, idx) => (idx === i ? { ...old, imagem: url } : old)));
      setImgTick((t) => t + 1);
    };
    reader.readAsDataURL(file);
  };

  // ── Edição do roteiro ──────────────────────────────────────────────────
  const patchSlide = (i: number, patch: Partial<SlideData>) =>
    setSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const addSlide = () => {
    const novo: SlideData = { tipo: "conteudo", titulo: "Novo slide", corpo: "", destaque: "", imagem: null };
    setSlides((prev) => {
      const cta = prev.findIndex((s) => s.tipo === "cta");
      const pos = cta === -1 ? prev.length : cta;
      const out = [...prev];
      out.splice(pos, 0, novo);
      setAtivo(pos);
      return out;
    });
  };

  const removeSlide = (i: number) => {
    setSlides((prev) => prev.filter((_, idx) => idx !== i));
    setAtivo((a) => Math.max(0, Math.min(a, slides.length - 2)));
  };

  const moverSlide = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides((prev) => {
      const out = [...prev];
      [out[i], out[j]] = [out[j], out[i]];
      return out;
    });
    setAtivo(j);
  };

  // ── Export ─────────────────────────────────────────────────────────────
  const nomeArquivo = (i: number) => {
    const base = (tituloProjeto || tema || "post").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    return `${String(i + 1).padStart(2, "0")}-${base || "slide"}.png`;
  };

  const baixarSlide = async (i: number) => {
    await ensureFonts();
    const canvas = document.createElement("canvas");
    renderSlide(canvas, opcoesBase(i));
    const blob = await canvasToBlob(canvas);
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nomeArquivo(i);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const baixarZip = async () => {
    setBaixando(true);
    try {
      await ensureFonts();
      const zip = new JSZip();
      for (let i = 0; i < slides.length; i++) {
        const canvas = document.createElement("canvas");
        renderSlide(canvas, opcoesBase(i));
        const blob = await canvasToBlob(canvas);
        if (blob) zip.file(nomeArquivo(i), blob);
      }
      if (legendaCompleta.trim()) zip.file("legenda.txt", legendaCompleta);
      const arquivo = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(arquivo);
      a.download = `${(tituloProjeto || tema || "carrossel").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 6000);
      toast.success("ZIP com as artes e a legenda baixado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar o ZIP.");
    } finally {
      setBaixando(false);
    }
  };

  const baixarTodos = async () => {
    setBaixando(true);
    try {
      for (let i = 0; i < slides.length; i++) {
        await baixarSlide(i);
        await new Promise((r) => setTimeout(r, 350));
      }
      toast.success(`${slides.length} ${slides.length === 1 ? "arquivo baixado" : "arquivos baixados"} em PNG.`);
    } finally {
      setBaixando(false);
    }
  };

  const legendaCompleta = `${legenda}\n\n${hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`.trim();

  // ── Agendamento (Calu Agência → Instagram / Facebook) ──────────────────
  useEffect(() => {
    if (!clienteId) { setConexoes(null); setPlataformas([]); return; }
    let vivo = true;
    supabase.functions
      .invoke("social-media", { body: { action: "connections", client_id: clienteId } })
      .then(({ data, error }) => {
        if (!vivo) return;
        if (error || !Array.isArray(data)) { setConexoes([]); return; }
        const ativas = (data as Conexao[]).filter((c) => c.connected);
        setConexoes(ativas);
        setPlataformas(ativas.map((c) => c.platform));
      });
    return () => { vivo = false; };
  }, [clienteId]);

  useEffect(() => {
    if (dataHora) return;
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    setDataHora(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }, [dataHora]);

  const subirPng = async (i: number, userId: string, lote: number): Promise<string | null> => {
    const canvas = document.createElement("canvas");
    renderSlide(canvas, opcoesBase(i));
    const blob = await canvasToBlob(canvas);
    if (!blob) return null;
    const path = `${userId}/carrossel-${lote}-${String(i + 1).padStart(2, "0")}.png`;
    const { error } = await supabase.storage.from("post-media").upload(path, blob, { upsert: true, contentType: "image/png" });
    if (error) throw new Error(`Upload falhou: ${error.message}`);
    return supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
  };

  const agendar = async () => {
    if (!clienteId) { toast.error("Escolha o cliente para agendar."); return; }
    if (!plataformas.length) { toast.error("Selecione ao menos uma rede."); return; }
    if (quando === "agendar" && !dataHora) { toast.error("Escolha a data e a hora."); return; }

    setAgendando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Entre de novo.");

      await ensureFonts();
      const lote = Date.now();
      const urls: string[] = [];
      for (let i = 0; i < slides.length; i++) {
        const url = await subirPng(i, session.user.id, lote);
        if (url) urls.push(url);
      }
      if (!urls.length) throw new Error("Não consegui subir as imagens.");

      const quandoISO = quando === "agora" ? new Date().toISOString() : new Date(dataHora).toISOString();

      const { error } = await (supabase as any).from("scheduled_posts").insert({
        user_id: session.user.id,
        client_id: clienteId,
        platforms: plataformas,
        caption: legendaCompleta || null,
        media_url: urls[0],
        media_urls: urls,
        media_type: "image",
        scheduled_at: quandoISO,
        status: "scheduled",
      });
      if (error) throw error;

      if (memoriaId) {
        await (supabase as any).from("carousel_memory")
          .update({ publicado_em: quandoISO })
          .eq("id", memoriaId);
      }

      setAgendado({
        quando: quando === "agora" ? "agora (sai em até 5 minutos)" : new Date(dataHora).toLocaleString("pt-BR"),
        plataformas,
      });
      toast.success(quando === "agora" ? "Na fila! Publica em até 5 minutos." : "Agendado com sucesso.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao agendar.");
    } finally {
      setAgendando(false);
    }
  };

  const copiar = async (texto: string, msg: string) => {
    try { await navigator.clipboard.writeText(texto); toast.success(msg); }
    catch { toast.error("Não consegui copiar."); }
  };

  const recomecar = () => {
    setSlides([]); setLegenda(""); setHashtags([]); setAngulo("");
    setDicaVisual(""); setMelhorHorario(""); setIdeias([]); setAtivo(0); setMemoriaId(null); setAgendado(null);
  };

  // No desktop cada painel rola sozinho e o slide cabe inteiro na tela.
  // No celular isso vira armadilha (duas rolagens aninhadas): a página rola uma vez só.
  const alturaPainel = isMobile ? undefined : embutido ? "calc(100vh - 300px)" : "calc(100vh - 130px)";
  const alturaSlide = isMobile ? "62vh" : embutido ? "calc(100vh - 430px)" : "calc(100vh - 300px)";
  const fundo = embutido ? "transparent" : BG;

  const [prevW, prevH] = FORMAT_SIZE[formatId];

  // ── Tela 1: briefing ───────────────────────────────────────────────────
  if (!noEstudio) {
    return (
      <div className={embutido ? "" : "min-h-full p-6 md:p-10"} style={{ background: fundo }}>
        <div className="mx-auto" style={{ maxWidth: 780 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" style={{ color: LIME }} />
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#F0F0F0" }}>
                {embutido ? "Marcela — Carrossel & Posts" : "Máquina de Carrossel"}
              </h1>
            </div>
            <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.42)" }}>
              Tema → roteiro estratégico → design premium → PNG pronto pra publicar, com legenda.
            </p>

            <div className="rounded-2xl p-6 space-y-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {!embutido && (
                <Campo label="Marca / cliente">
                  <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="" style={{ background: BG }}>Sem cliente (usar minha marca)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id} style={{ background: BG }}>{c.name}</option>
                    ))}
                  </select>
                </Campo>
              )}

              <Campo label="Sobre o que é o conteúdo">
                <textarea
                  value={tema} onChange={(e) => setTema(e.target.value)} rows={3}
                  placeholder="Ex.: por que 8 em cada 10 empresas perdem licitação no envelope de habilitação"
                  style={{ ...inputStyle, resize: "none" }}
                />
                <button
                  onClick={pedirIdeias} disabled={buscandoIdeias}
                  className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
                  style={{ color: buscandoIdeias ? "rgba(255,255,255,0.3)" : LIME }}
                >
                  {buscandoIdeias ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                  {buscandoIdeias ? "Pensando em pautas..." : "Não sei o tema — me sugere pautas"}
                </button>
              </Campo>

              {ideias.length > 0 && (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {ideias.map((it, i) => (
                    <button
                      key={i}
                      onClick={() => { setTema(it.tema); setIdeias([]); }}
                      className="w-full text-left rounded-xl p-3 transition-all"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${LIME}55`)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                    >
                      <div className="text-[13px] font-semibold" style={{ color: "#F0F0F0" }}>{it.gancho}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{it.porque}</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Campo label="Formato">
                  <div className="flex gap-1.5">
                    <Chip ativo={formato === "carrossel"} onClick={() => setFormato("carrossel")}>Carrossel</Chip>
                    <Chip ativo={formato === "post"} onClick={() => setFormato("post")}>Post único</Chip>
                  </div>
                </Campo>
                {formato === "carrossel" && (
                  <Campo label={`Slides — ${nSlides}`}>
                    <input type="range" min={4} max={10} value={nSlides} onChange={(e) => setNSlides(Number(e.target.value))}
                      className="w-full mt-3" style={{ accentColor: LIME }} />
                  </Campo>
                )}
              </div>

              <Campo label="Objetivo">
                <div className="flex flex-wrap gap-1.5">
                  {OBJETIVOS.map((o) => (
                    <Chip key={o.id} ativo={objetivo === o.id} onClick={() => setObjetivo(o.id)}>{o.label}</Chip>
                  ))}
                </div>
              </Campo>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Campo label="Público (opcional)">
                  <input value={publico} onChange={(e) => setPublico(e.target.value)} placeholder="donos de PME" style={inputStyle} />
                </Campo>
                <Campo label="Tom de voz (opcional)">
                  <input value={tom} onChange={(e) => setTom(e.target.value)} placeholder="direto, sem juridiquês" style={inputStyle} />
                </Campo>
              </div>

              {clienteId && memoria.length > 0 && (
                <button onClick={() => setMostrarBiblioteca(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: "#E6E6E6" }}>
                    <Library className="w-3.5 h-3.5" style={{ color: LIME }} />
                    Biblioteca de {cliente?.name ?? "cliente"}
                  </span>
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {memoria.length} {memoria.length === 1 ? "conteúdo" : "conteúdos"} →
                  </span>
                </button>
              )}

              <Campo label="Skills de copy e design">
                <div className="space-y-2">
                  {(["copy", "design"] as const).map((tipo) => (
                    <div key={tipo}>
                      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>
                        {tipo === "copy" ? "escrita" : "arte"}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.filter((k) => k.tipo === tipo).map((k) => {
                          const on = skillsAtivas.includes(k.id);
                          return (
                            <button key={k.id} title={k.resumo}
                              onClick={() => setSkillsAtivas((p) => on ? p.filter((x) => x !== k.id) : [...p, k.id])}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                              style={{
                                background: on ? `${LIME}1E` : "rgba(255,255,255,0.04)",
                                border: `1px solid ${on ? `${LIME}5A` : "rgba(255,255,255,0.09)"}`,
                                color: on ? LIME : "rgba(255,255,255,0.5)",
                              }}>
                              {k.nome}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {skillsAtivas.length > 0 && (
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {skills.filter((k) => skillsAtivas.includes(k.id)).map((k) => k.resumo).join(" · ")}
                    </div>
                  )}

                  {novaSkill ? (
                    <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${LIME}40` }}>
                      <div className="flex gap-1.5">
                        {(["copy", "design"] as const).map((t) => (
                          <Chip key={t} ativo={novaSkill.tipo === t} onClick={() => setNovaSkill({ ...novaSkill, tipo: t })}>
                            {t === "copy" ? "escrita" : "arte"}
                          </Chip>
                        ))}
                      </div>
                      <input value={novaSkill.nome} onChange={(e) => setNovaSkill({ ...novaSkill, nome: e.target.value })}
                        placeholder="Nome da skill" style={{ ...inputStyle, fontSize: 13 }} />
                      <input value={novaSkill.resumo} onChange={(e) => setNovaSkill({ ...novaSkill, resumo: e.target.value })}
                        placeholder="Resumo em uma linha" style={{ ...inputStyle, fontSize: 12 }} />
                      <textarea value={novaSkill.instrucoes} onChange={(e) => setNovaSkill({ ...novaSkill, instrucoes: e.target.value })}
                        rows={4} placeholder="Instruções para a IA: como escrever ou como desenhar. Quanto mais específico, melhor."
                        style={{ ...inputStyle, resize: "none", fontSize: 12 }} />
                      <div className="flex gap-1.5">
                        <button onClick={criarSkill} disabled={salvandoSkill}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold"
                          style={{ background: LIME, color: "#07080A" }}>
                          {salvandoSkill ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Salvar skill
                        </button>
                        <button onClick={() => setNovaSkill(null)}
                          className="px-3 py-2 rounded-lg text-[11px] font-semibold"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setNovaSkill({ tipo: "copy", nome: "", resumo: "", instrucoes: "" })}
                      className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
                      <PlusIcon className="w-3 h-3" /> Criar uma skill minha
                    </button>
                  )}
                </div>
              </Campo>

              {clienteId && (
                <div className="rounded-xl p-3.5 space-y-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: LIME }}>
                      <Brain className="w-3.5 h-3.5" />
                      Memória de {cliente?.name ?? "cliente"}
                    </div>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {memoria.length === 0 ? "primeiro conteúdo" : `${memoria.length} ${memoria.length === 1 ? "conteúdo criado" : "conteúdos criados"}`}
                    </span>
                  </div>

                  {memoria.length > 0 && (
                    <div className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                      Não vai repetir: {memoria.slice(0, 3).map((m) => m.tema).join(" · ")}
                      {memoria.length > 3 ? ` e mais ${memoria.length - 3}` : ""}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2.5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#E8E8E8" }}>
                        <TrendingUp className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                        Tendências do Ben
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                        {buscandoBen
                          ? "pesquisando o que está em alta no segmento..."
                          : tendencias
                            ? `${cliente?.industry ?? "segmento"} · atualizado ${diasDoCache === 0 ? "hoje" : `há ${diasDoCache} ${diasDoCache === 1 ? "dia" : "dias"}`}`
                            : "ainda não pesquisou esse segmento"}
                      </div>
                    </div>
                    <button onClick={atualizarTendencias} disabled={buscandoBen}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0"
                      style={{
                        background: buscandoBen ? "rgba(255,255,255,0.05)" : `${LIME}16`,
                        border: `1px solid ${buscandoBen ? "rgba(255,255,255,0.1)" : `${LIME}40`}`,
                        color: buscandoBen ? "rgba(255,255,255,0.4)" : LIME,
                      }}>
                      {buscandoBen ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      {tendencias ? "Atualizar" : "Consultar Ben"}
                    </button>
                  </div>

                  {tendencias && (
                    <button onClick={() => setUsarBen((v) => !v)}
                      className="flex items-center gap-2 text-[11px] font-semibold"
                      style={{ color: usarBen ? LIME : "rgba(255,255,255,0.4)" }}>
                      <div className="w-3.5 h-3.5 rounded flex items-center justify-center"
                        style={{ background: usarBen ? LIME : "transparent", border: `1px solid ${usarBen ? LIME : "rgba(255,255,255,0.25)"}` }}>
                        {usarBen && <CheckCircle2 className="w-2.5 h-2.5" style={{ color: "#07080A" }} />}
                      </div>
                      Usar as tendências do Ben neste conteúdo
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={fazerTudoSozinha} disabled={gerando || !!modoAuto}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: (gerando || modoAuto) ? "rgba(185,255,75,0.4)" : LIME, color: "#07080A", boxShadow: "0 0 30px -6px rgba(185,255,75,0.4)" }}
                >
                  {(gerando || modoAuto) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {modoAuto ?? (gerando ? "Escrevendo o roteiro..." : "Fazer tudo sozinha")}
                </button>

                <button
                  onClick={gerar} disabled={gerando || !!modoAuto}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {formato === "post" ? "Só escrever o post" : "Só escrever o roteiro"}
                </button>

                <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                  No automático ela escreve o roteiro e já define a direção de arte. As fotos você gera no passo seguinte.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Tela 2: estúdio ────────────────────────────────────────────────────
  const slideAtivo = slides[Math.min(ativo, slides.length - 1)];

  return (
    <div className={embutido ? "" : "min-h-full"} style={{ background: fundo }}>
      {/* Topo */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />
            <span className="text-sm font-bold truncate" style={{ color: "#F0F0F0" }}>{tituloProjeto || tema}</span>
          </div>
          {angulo && <div className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{angulo}</div>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={recomecar} className="px-3 py-2 rounded-xl text-[12px] font-semibold"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
            Novo conteúdo
          </button>
          {slides.length > 1 && (
            <button onClick={baixarTodos} disabled={baixando}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" }}>
              <Download className="w-3.5 h-3.5" />
              PNGs soltos
            </button>
          )}
          <button onClick={baixarZip} disabled={baixando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: LIME, color: "#07080A" }}>
            {baixando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
            Baixar ZIP
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row" style={{ minHeight: alturaPainel }}>
        {/* Painel esquerdo */}
        <div className="w-full lg:w-[420px] flex-shrink-0 border-r overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.07)", maxHeight: alturaPainel }}>
          <div className="flex gap-1 p-3">
            {([["roteiro", FileText, "Roteiro"], ["design", Palette, "Design"], ["legenda", Type, "Legenda"], ["agendar", CalendarClock, "Agendar"]] as const).map(([id, Icon, label]) => (
              <button key={id} onClick={() => setAba(id as Aba)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  background: aba === id ? `${LIME}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${aba === id ? `${LIME}55` : "rgba(255,255,255,0.07)"}`,
                  color: aba === id ? LIME : "rgba(255,255,255,0.45)",
                }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          {/* ── Roteiro ── */}
          {aba === "roteiro" && (
            <div className="px-4 pb-6 space-y-3">
              {slides.map((s, i) => {
                const aberto = i === ativo;
                return (
                  <div key={i} className="rounded-2xl overflow-hidden transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${aberto ? `${LIME}44` : "rgba(255,255,255,0.07)"}` }}>
                    <button onClick={() => setAtivo(i)} className="w-full flex items-center gap-2 px-3.5 py-3 text-left">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${accent}22`, color: accent }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{s.tipo}</span>
                      <span className="text-[12px] font-semibold truncate flex-1" style={{ color: "#EAEAEA" }}>{s.titulo}</span>
                    </button>

                    {aberto && (
                      <div className="px-3.5 pb-3.5 space-y-2.5">
                        <textarea value={s.titulo} onChange={(e) => patchSlide(i, { titulo: e.target.value })} rows={2}
                          placeholder="Título" style={{ ...inputStyle, resize: "none", fontWeight: 600 }} />
                        <textarea value={s.corpo} onChange={(e) => patchSlide(i, { corpo: e.target.value })} rows={3}
                          placeholder="Corpo (máx. ~190 caracteres)" style={{ ...inputStyle, resize: "none", fontSize: 13 }} />
                        <input value={s.destaque ?? ""} onChange={(e) => patchSlide(i, { destaque: e.target.value })}
                          placeholder="Destaque (ex.: 3 de 4)" style={{ ...inputStyle, fontSize: 13 }} />

                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <button onClick={() => reescreverSlide(i, "melhore mantendo a ideia: mais concreto, mais curto, mais específico")}
                            disabled={reescrevendo === i}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                            style={{ background: `${LIME}16`, border: `1px solid ${LIME}40`, color: LIME }}>
                            {reescrevendo === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Reescrever
                          </button>
                          <button onClick={() => gerarImagem(i)} disabled={gerandoImg === i}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.11)", color: "rgba(255,255,255,0.62)" }}>
                            {gerandoImg === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                            Imagem IA
                          </button>
                          <button onClick={() => { setAtivo(i); fileRef.current?.click(); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.11)", color: "rgba(255,255,255,0.62)" }}>
                            <Upload className="w-3 h-3" /> Subir
                          </button>
                          {s.imagem && (
                            <button onClick={() => patchSlide(i, { imagem: null })}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                              style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171" }}>
                              <X className="w-3 h-3" /> Tirar foto
                            </button>
                          )}
                          <div className="flex-1" />
                          <button onClick={() => moverSlide(i, -1)} className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>
                            <ChevronLeft className="w-3 h-3 rotate-90" />
                          </button>
                          <button onClick={() => moverSlide(i, 1)} className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>
                            <ChevronRight className="w-3 h-3 rotate-90" />
                          </button>
                          {slides.length > 1 && (
                            <button onClick={() => removeSlide(i)} className="p-1.5 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#F87171" }}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button onClick={() => gerarImagensDeTodos()} disabled={gerandoTodasImgs || gerandoImg !== null}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold"
                style={{
                  background: gerandoTodasImgs ? "rgba(255,255,255,0.05)" : `${LIME}16`,
                  border: `1px solid ${gerandoTodasImgs ? "rgba(255,255,255,0.1)" : `${LIME}45`}`,
                  color: gerandoTodasImgs ? "rgba(255,255,255,0.4)" : LIME,
                }}>
                {gerandoTodasImgs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                {gerandoTodasImgs ? "Gerando as fotos..." : "Gerar foto para todos os slides"}
              </button>

              <button onClick={addSlide}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.45)" }}>
                <Plus className="w-3.5 h-3.5" /> Adicionar slide
              </button>

              {dicaVisual && (
                <div className="rounded-xl p-3 text-[11px] leading-relaxed"
                  style={{ background: `${accent}10`, border: `1px solid ${accent}28`, color: "rgba(255,255,255,0.6)" }}>
                  <span style={{ color: accent, fontWeight: 700 }}>Direção de arte: </span>{dicaVisual}
                </div>
              )}
            </div>
          )}

          {/* ── Design ── */}
          {aba === "design" && (
            <div className="px-4 pb-6 space-y-5">
              {/* Diretor de arte */}
              <div className="rounded-xl p-3.5 space-y-3"
                style={{ background: `${LIME}0A`, border: `1px solid ${LIME}2A` }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: LIME }}>
                      <Wand2 className="w-3.5 h-3.5" /> Diretor de arte
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Direções baseadas em marcas de referência do segmento
                    </div>
                  </div>
                  <button onClick={chamarDiretorDeArte} disabled={buscandoDirecao || lendoReferencia}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold flex-shrink-0"
                    style={{ background: buscandoDirecao ? "rgba(255,255,255,0.06)" : LIME, color: buscandoDirecao ? "rgba(255,255,255,0.4)" : "#07080A" }}>
                    {buscandoDirecao ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {direcoes.length ? "De novo" : "Criar direções"}
                  </button>
                </div>

                <button onClick={() => refRef.current?.click()} disabled={lendoReferencia || buscandoDirecao}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }}>
                  {lendoReferencia ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                  {lendoReferencia ? "Lendo a referência..." : "Subir referência do Pinterest / Behance"}
                </button>

                {direcoes.map((d) => {
                  const ativa = direcaoAtiva === d.nome;
                  return (
                    <button key={d.nome} onClick={() => aplicarDirecao(d)}
                      className="w-full text-left rounded-xl p-3 transition-all"
                      style={{
                        background: ativa ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${ativa ? `${LIME}66` : "rgba(255,255,255,0.08)"}`,
                      }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex gap-1 flex-shrink-0">
                          {[d.bg, d.fg, d.accent].map((c, i) => (
                            <span key={i} className="w-3.5 h-3.5 rounded-full"
                              style={{ background: c, border: "1px solid rgba(255,255,255,0.2)" }} />
                          ))}
                        </div>
                        <span className="text-[12px] font-bold truncate" style={{ color: ativa ? LIME : "#EFEFEF" }}>
                          {d.nome}
                        </span>
                        {ativa && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: LIME }} />}
                      </div>
                      <div className="text-[10px] leading-relaxed mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <span style={{ color: "rgba(255,255,255,0.72)", fontWeight: 700 }}>Referência: </span>{d.referencia}
                      </div>
                      <div className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{d.porque}</div>
                      <div className="text-[9px] mt-1.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {LAYOUTS.find((l) => l.id === d.layout)?.label} · {FONT_PAIRS[d.fonte]?.label}
                        {d.acabamento && d.acabamento !== "nenhum" ? ` · ${ACABAMENTOS.find((a) => a.id === d.acabamento)?.label}` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Campo label="Layout">
                <div className="grid grid-cols-2 gap-1.5">
                  {LAYOUTS.map((l) => (
                    <button key={l.id} onClick={() => setLayout(l.id)}
                      className="text-left px-3 py-2.5 rounded-xl transition-all"
                      style={{
                        background: layout === l.id ? `${LIME}18` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${layout === l.id ? `${LIME}55` : "rgba(255,255,255,0.08)"}`,
                      }}>
                      <div className="text-[12px] font-bold" style={{ color: layout === l.id ? LIME : "#E8E8E8" }}>{l.label}</div>
                      <div className="text-[10px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{l.desc}</div>
                    </button>
                  ))}
                </div>
              </Campo>

              <Campo label="Acabamento">
                <div className="grid grid-cols-2 gap-1.5">
                  {ACABAMENTOS.map((a) => (
                    <button key={a.id} onClick={() => setAcabamento(a.id)}
                      className="text-left px-3 py-2.5 rounded-xl transition-all"
                      style={{
                        background: acabamento === a.id ? `${LIME}18` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${acabamento === a.id ? `${LIME}55` : "rgba(255,255,255,0.08)"}`,
                      }}>
                      <div className="text-[12px] font-bold" style={{ color: acabamento === a.id ? LIME : "#E8E8E8" }}>{a.label}</div>
                      <div className="text-[10px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{a.desc}</div>
                    </button>
                  ))}
                </div>
              </Campo>

              <Campo label="Paleta">
                <div className="grid grid-cols-4 gap-1.5">
                  {PALETTES.map((p) => (
                    <button key={p.id}
                      onClick={() => { setPaleta(p); setBg(p.bg); setFg(p.fg); setAccent(p.accent); }}
                      className="rounded-xl overflow-hidden transition-all"
                      style={{ border: `1px solid ${paleta.id === p.id ? LIME : "rgba(255,255,255,0.1)"}` }}>
                      <div className="h-9 flex" style={{ background: p.bg }}>
                        <div className="w-1/3 h-full" style={{ background: p.accent }} />
                      </div>
                      <div className="text-[9px] py-1" style={{ color: "rgba(255,255,255,0.45)" }}>{p.label}</div>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {([["Fundo", bg, setBg], ["Texto", fg, setFg], ["Acento", accent, setAccent]] as const).map(([lab, val, set]) => (
                    <label key={lab} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <input type="color" value={val} onChange={(e) => set(e.target.value)}
                        style={{ width: 20, height: 20, border: "none", background: "none", padding: 0, cursor: "pointer" }} />
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>{lab}</span>
                    </label>
                  ))}
                </div>
              </Campo>

              <Campo label="Tipografia">
                <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {(Object.keys(FONT_PAIRS) as FontPairId[]).map((id) => (
                    <button key={id} onClick={() => setFontPair(id)}
                      className="px-3 py-2 rounded-xl transition-all text-left"
                      style={{
                        background: fontPair === id ? `${LIME}18` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${fontPair === id ? `${LIME}55` : "rgba(255,255,255,0.08)"}`,
                      }}>
                      <div style={{
                        fontFamily: FONT_PAIRS[id].display,
                        fontSize: 16,
                        fontWeight: FONT_PAIRS[id].displayWeight,
                        color: fontPair === id ? LIME : "#E8E8E8",
                        textTransform: FONT_PAIRS[id].upper ? "uppercase" : "none",
                        lineHeight: 1.15,
                      }}>
                        {FONT_PAIRS[id].label}
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {FONT_PAIRS[id].nota}
                      </div>
                    </button>
                  ))}
                </div>
              </Campo>

              <Campo label="Formato de saída">
                <div className="flex flex-col gap-1.5">
                  {(Object.keys(FORMAT_SIZE) as FormatId[]).map((f) => (
                    <button key={f} onClick={() => setFormatId(f)}
                      className="px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition-all"
                      style={{
                        background: formatId === f ? `${LIME}18` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${formatId === f ? `${LIME}55` : "rgba(255,255,255,0.08)"}`,
                        color: formatId === f ? LIME : "rgba(255,255,255,0.55)",
                      }}>
                      {FORMAT_LABEL[f]}
                    </button>
                  ))}
                </div>
              </Campo>

              <Campo label="Assinatura">
                <div className="space-y-2">
                  <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@suamarca" style={inputStyle} />
                  <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="URL do logo (opcional)" style={{ ...inputStyle, fontSize: 12 }} />
                  <div className="flex gap-1.5">
                    <Chip ativo={mostrarNumero} onClick={() => setMostrarNumero((v) => !v)}>Numerar</Chip>
                    <Chip ativo={mostrarArraste} onClick={() => setMostrarArraste((v) => !v)}>Selo “arraste”</Chip>
                  </div>
                </div>
              </Campo>
            </div>
          )}

          {/* ── Legenda ── */}
          {aba === "legenda" && (
            <div className="px-4 pb-6 space-y-4">
              <Campo label="Legenda do post">
                <textarea value={legenda} onChange={(e) => setLegenda(e.target.value)} rows={12}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontSize: 13 }} />
              </Campo>
              <Campo label="Hashtags">
                <textarea value={hashtags.join(" ")} onChange={(e) => setHashtags(e.target.value.split(/\s+/).filter(Boolean))}
                  rows={3} style={{ ...inputStyle, resize: "none", fontSize: 12 }} />
              </Campo>
              {melhorHorario && (
                <div className="rounded-xl p-3 text-[11px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
                  <span style={{ color: LIME, fontWeight: 700 }}>Melhor horário: </span>{melhorHorario}
                </div>
              )}
              <button onClick={() => copiar(legendaCompleta, "Legenda copiada com as hashtags.")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold"
                style={{ background: LIME, color: "#07080A" }}>
                <Copy className="w-4 h-4" /> Copiar legenda + hashtags
              </button>
            </div>
          )}

          {/* ── Agendar ── */}
          {aba === "agendar" && (
            <div className="px-4 pb-6 space-y-4">
              {agendado ? (
                <div className="rounded-2xl p-5 text-center space-y-3"
                  style={{ background: `${LIME}12`, border: `1px solid ${LIME}44` }}>
                  <CheckCircle2 className="w-8 h-8 mx-auto" style={{ color: LIME }} />
                  <div className="text-[13px] font-bold" style={{ color: "#F0F0F0" }}>
                    {slides.length > 1 ? "Carrossel na fila" : "Post na fila"}
                  </div>
                  <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {agendado.plataformas.map((p) => (p === "instagram" ? "Instagram" : "Facebook")).join(" + ")} · {agendado.quando}
                  </div>
                  <Link to={`/agency/clients/${clienteId}?tab=social`}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: LIME }}>
                    <Link2 className="w-3.5 h-3.5" /> Ver na agenda do cliente
                  </Link>
                  <button onClick={() => setAgendado(null)}
                    className="block w-full mt-1 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    agendar de novo
                  </button>
                </div>
              ) : (
                <>
                  <Campo label="Cliente">
                    <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                      <option value="" style={{ background: BG }}>Selecione o cliente</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id} style={{ background: BG }}>{c.name}</option>
                      ))}
                    </select>
                  </Campo>

                  {!clienteId && (
                    <div className="text-[12px] leading-relaxed rounded-xl p-3"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                      O agendamento usa as contas conectadas do cliente na Calu Agência. Escolha o cliente acima.
                    </div>
                  )}

                  {clienteId && conexoes === null && (
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checando contas conectadas...
                    </div>
                  )}

                  {clienteId && conexoes?.length === 0 && (
                    <div className="rounded-xl p-3 text-[12px] leading-relaxed"
                      style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "rgba(255,255,255,0.62)" }}>
                      Esse cliente ainda não tem Instagram/Facebook conectado.{" "}
                      <Link to={`/agency/clients/${clienteId}?tab=social`} style={{ color: LIME, fontWeight: 700 }}>
                        Conectar agora
                      </Link>
                    </div>
                  )}

                  {!!conexoes?.length && (
                    <>
                      <Campo label="Onde publicar">
                        <div className="space-y-1.5">
                          {conexoes.map((c) => {
                            const on = plataformas.includes(c.platform);
                            return (
                              <button key={c.platform}
                                onClick={() => setPlataformas((p) => on ? p.filter((x) => x !== c.platform) : [...p, c.platform])}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                                style={{
                                  background: on ? `${LIME}16` : "rgba(255,255,255,0.03)",
                                  border: `1px solid ${on ? `${LIME}50` : "rgba(255,255,255,0.08)"}`,
                                }}>
                                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                                  style={{ background: on ? LIME : "transparent", border: `1px solid ${on ? LIME : "rgba(255,255,255,0.25)"}` }}>
                                  {on && <CheckCircle2 className="w-3 h-3" style={{ color: "#07080A" }} />}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[12px] font-semibold" style={{ color: on ? LIME : "#E8E8E8" }}>
                                    {c.platform === "instagram" ? "Instagram" : "Facebook"}
                                  </div>
                                  <div className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                                    {c.account_username || c.account_name}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </Campo>

                      <Campo label="Quando">
                        <div className="flex gap-1.5 mb-2">
                          <Chip ativo={quando === "agendar"} onClick={() => setQuando("agendar")}>Agendar</Chip>
                          <Chip ativo={quando === "agora"} onClick={() => setQuando("agora")}>Publicar agora</Chip>
                        </div>
                        {quando === "agendar" ? (
                          <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)}
                            style={{ ...inputStyle, colorScheme: "dark" }} />
                        ) : (
                          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Entra na fila de publicação e sai em até 5 minutos.
                          </div>
                        )}
                      </Campo>

                      <div className="rounded-xl p-3 text-[11px] leading-relaxed"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                        Vai subir {slides.length} {slides.length === 1 ? "imagem" : "imagens"} em {prevW}×{prevH}
                        {slides.length > 1 ? " como carrossel" : ""}, com a legenda e as hashtags da aba anterior.
                        {formatId === "9:16" && " Atenção: 9:16 é formato de Stories, o feed corta."}
                      </div>

                      <button onClick={agendar} disabled={agendando}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold"
                        style={{ background: agendando ? "rgba(185,255,75,0.4)" : LIME, color: "#07080A" }}>
                        {agendando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {agendando ? "Subindo imagens..." : quando === "agora" ? "Publicar agora" : "Agendar publicação"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col items-center p-6 gap-5 overflow-y-auto" style={{ maxHeight: alturaPainel }}>
          <div className="relative rounded-2xl overflow-hidden flex-shrink-0"
            style={{ boxShadow: "0 24px 70px rgba(0,0,0,0.65)", maxWidth: "100%", maxHeight: alturaSlide }}>
            <canvas
              ref={mainRef}
              style={{
                display: "block",
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: alturaSlide,
                aspectRatio: `${prevW} / ${prevH}`,
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setAtivo((a) => Math.max(0, a - 1))} disabled={ativo === 0}
              className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", opacity: ativo === 0 ? 0.35 : 1 }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => baixarSlide(ativo)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
              <Download className="w-3.5 h-3.5" /> Baixar este ({prevW}×{prevH})
            </button>
            <button onClick={() => setAtivo((a) => Math.min(slides.length - 1, a + 1))} disabled={ativo >= slides.length - 1}
              className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", opacity: ativo >= slides.length - 1 ? 0.35 : 1 }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {slides.length > 1 && (
            <div className="flex gap-2 flex-wrap justify-center pb-4">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setAtivo(i)}
                  className="rounded-lg overflow-hidden transition-all"
                  style={{ border: `2px solid ${i === ativo ? LIME : "rgba(255,255,255,0.1)"}`, lineHeight: 0 }}>
                  <canvas ref={(el) => { thumbRefs.current[i] = el; }} style={{ width: 74, height: "auto", display: "block" }} />
                </button>
              ))}
            </div>
          )}

          {slideAtivo && (
            <div className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
              <LayoutGrid className="w-3 h-3 inline mr-1" />
              {LAYOUTS.find((l) => l.id === layout)?.label} · {FORMAT_LABEL[formatId]} · {FONT_PAIRS[fontPair].label}
            </div>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagem(ativo, f); e.target.value = ""; }} />
      <input ref={refRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) lerReferencia(f); e.target.value = ""; }} />

      {/* ── Biblioteca do cliente ── */}
      {mostrarBiblioteca && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.86)", backdropFilter: "blur(10px)" }}
          onClick={() => setMostrarBiblioteca(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full rounded-2xl overflow-hidden flex flex-col"
            style={{ maxWidth: 620, maxHeight: "82vh", background: "#0D0F12", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4" style={{ color: LIME }} />
                <span className="text-sm font-bold" style={{ color: "#F0F0F0" }}>
                  Biblioteca de {cliente?.name ?? "cliente"}
                </span>
              </div>
              <button onClick={() => setMostrarBiblioteca(false)} className="p-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {memoria.length === 0 && (
                <div className="text-[12px] text-center py-8" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Nenhum conteúdo criado ainda para este cliente.
                </div>
              )}
              {memoria.map((m) => (
                <button key={m.id} onClick={() => abrirDaBiblioteca(m.id)}
                  className="w-full text-left rounded-xl p-3.5 transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${LIME}55`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}>
                  <div className="flex gap-3">
                    <MiniPeca item={m} brand={brand} fontesOk={fontesOk} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[13px] font-semibold" style={{ color: "#EDEDED" }}>{m.tema}</span>
                        <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {new Date(m.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {m.angulo && (
                        <div className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>{m.angulo}</div>
                      )}
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {m.slides?.length ? <span>{m.slides.length} slides</span> : null}
                        {m.design?.layout ? <span>· {LAYOUTS.find((l) => l.id === m.design?.layout)?.label}</span> : null}
                        {m.design?.fontPair ? <span>· {FONT_PAIRS[m.design.fontPair]?.label}</span> : null}
                        {m.design?.acabamento && m.design.acabamento !== "nenhum"
                          ? <span>· {ACABAMENTOS.find((a) => a.id === m.design?.acabamento)?.label}</span> : null}
                        {m.design?.accent ? (
                          <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: m.design.accent }} />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold" style={{ color: LIME }}>
                        <FolderOpen className="w-3 h-3" /> abrir e editar
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
