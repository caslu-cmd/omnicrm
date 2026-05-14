import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Download, Eye, Code2, FileText, Palette,
  Loader2, CheckCircle2, AlertCircle, Layout, Sparkles,
  RefreshCw, Copy, Monitor, Smartphone, Paperclip,
  Globe, ExternalLink, Edit3, ChevronLeft, Wand2,
  Check, X, Pencil, PanelLeft, ImagePlus, Search, Image as ImageIcon, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";

// ── Types ──────────────────────────────────────────────────────────────────────

type Etapa = "idle" | "copy" | "design" | "html" | "concluido" | "erro";

interface Resultado { copy: string; design: string; html: string; }

const ETAPAS = [
  { id: "copy",   label: "Beatriz",  desc: "Criando o copy",             icon: FileText },
  { id: "design", label: "Designer", desc: "Definindo identidade visual", icon: Palette },
  { id: "html",   label: "Tomás",    desc: "Montando a landing page",     icon: Layout },
] as const;

// ── Editor types ───────────────────────────────────────────────────────────────

interface ImageAsset {
  id: string;
  file: File;
  label: string;
  previewUrl: string;
  uploadedUrl?: string;
}

interface ParsedField {
  id: string;
  label: string;
  value: string;
  type?: "text" | "image";
  src?: string;
}

interface ParsedSection {
  id: string;
  name: string;
  icon: string;
  fields: ParsedField[];
}

// ── Pure helpers (outside component) ──────────────────────────────────────────

function etapaIndex(e: Etapa) { return ETAPAS.findIndex((x) => x.id === e); }
function copyToClipboard(text: string) { navigator.clipboard.writeText(text); toast.success("Copiado!"); }

function guessImageLabel(filename: string): string {
  const n = filename.toLowerCase().replace(/\.[^.]+$/, "");
  if (n.includes("logo")) return "Logo";
  if (n.includes("palestrante") || n.includes("speaker") || n.includes("professor")) return "Foto do Palestrante";
  if (n.includes("banner") || n.includes("capa") || n.includes("cover")) return "Banner";
  if (n.includes("produto") || n.includes("product")) return "Foto do Produto";
  if (n.includes("foto") || n.includes("photo") || n.includes("perfil")) return "Foto";
  return "Imagem";
}
function downloadHtml(html: string, name = `landing-page-${Date.now()}.html`) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([html], { type: "text/html" })),
    download: name,
  });
  a.click();
}

function detectSectionName(el: Element, idx: number, total: number): string {
  const text = (el.textContent ?? "").toLowerCase();
  const cls  = (el.getAttribute("class") ?? "").toLowerCase();
  const id   = (el.getAttribute("id") ?? "").toLowerCase();
  if (idx === 0 || el.tagName === "HEADER" || cls.includes("hero") || id.includes("hero")) return "Hero";
  if (idx === total - 1 || el.tagName === "FOOTER") return "Rodapé";
  if (text.includes("depoimento") || text.includes("avaliação") || text.includes("cliente disse") || cls.includes("testim")) return "Depoimentos";
  if (text.includes("benefício") || text.includes("vantagem") || text.includes("como funciona") || cls.includes("feature") || cls.includes("benefit")) return "Benefícios";
  if (text.includes("faq") || text.includes("dúvida") || text.includes("pergunta frequente")) return "FAQ";
  if (text.includes("preço") || text.includes("plano") || text.includes("investimento")) return "Preços";
  if (text.includes("garantia")) return "Garantia";
  if (text.includes("sobre") || text.includes("quem somos") || text.includes("história")) return "Sobre";
  if ((cls.includes("cta") || id.includes("cta")) && (el.textContent?.trim().length ?? 0) < 300) return "CTA";
  if (el.querySelectorAll("button").length > 0 && (el.textContent?.trim().length ?? 0) < 300) return "CTA";
  return `Seção ${idx + 1}`;
}

function detectSectionIcon(_el: Element, idx: number, total: number, name: string): string {
  const map: Record<string, string> = {
    Hero: "🚀", Benefícios: "✅", Depoimentos: "💬", FAQ: "❓",
    Preços: "💰", Garantia: "🛡️", Sobre: "👤", CTA: "🎯", Rodapé: "🔻",
  };
  return map[name] ?? "📌";
}

function applyChanges(html: string, changes: { selector?: string; insertAfter?: string; outerHTML?: string; remove?: boolean }[]): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const change of changes) {
    try {
      if (change.insertAfter) {
        const anchor = doc.querySelector(change.insertAfter);
        if (anchor && change.outerHTML) {
          const tmp = doc.createElement("div");
          tmp.innerHTML = change.outerHTML;
          const newEl = tmp.firstElementChild;
          if (newEl) anchor.after(newEl);
        }
      } else if (change.selector && change.remove) {
        const el = doc.querySelector(change.selector);
        if (el) el.remove();
      } else if (change.selector && change.outerHTML) {
        const el = doc.querySelector(change.selector);
        if (el) {
          const tmp = doc.createElement("div");
          tmp.innerHTML = change.outerHTML;
          const newEl = tmp.firstElementChild;
          if (newEl) el.replaceWith(newEl);
        }
      }
    } catch { /* ignora erros individuais */ }
  }
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

function parseLPIntoSections(html: string): { markedHtml: string; sections: ParsedSection[] } {
  const doc = new DOMParser().parseFromString(html, "text/html");
  let sectionEls: Element[] = [];

  // Strategy 1: semantic section tags
  const semantic = Array.from(doc.querySelectorAll("section"));
  if (semantic.length >= 2) sectionEls = semantic;

  // Strategy 2: header + body groups + footer
  if (sectionEls.length < 2) {
    sectionEls = [
      ...Array.from(doc.querySelectorAll("header")),
      ...Array.from(doc.querySelectorAll("main section, main > div")),
      ...Array.from(doc.querySelectorAll("footer")),
    ].filter((el, i, arr) => arr.indexOf(el) === i);
  }

  // Strategy 3: direct block children of body
  if (sectionEls.length < 2) {
    sectionEls = Array.from(doc.body.children).filter(el =>
      ["DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "MAIN"].includes(el.tagName)
    );
  }

  // Remove tiny / redundant elements
  sectionEls = sectionEls
    .filter((el, i, arr) => arr.indexOf(el) === i)
    .filter(el => (el.textContent?.trim().length ?? 0) > 25);

  const sections: ParsedSection[] = [];

  sectionEls.forEach((sectionEl, sIdx) => {
    const sectionId = `s${sIdx}`;
    sectionEl.setAttribute("data-calu-section", sectionId);

    const fields: ParsedField[] = [];
    let fIdx = 0;

    const addField = (el: Element, label: string) => {
      const text = el.textContent?.trim() ?? "";
      if (!text || text.length < 2) return;
      const fieldId = `${sectionId}-f${fIdx++}`;
      el.setAttribute("data-calu-field", fieldId);
      fields.push({ id: fieldId, label, value: text });
    };

    let h1n = 0, h2n = 0, h3n = 0, h4n = 0, pn = 0, liN = 0, btn = 0, imgn = 0;
    sectionEl.querySelectorAll("h1").forEach(el => addField(el, h1n++ === 0 ? "Título Principal" : `Título ${h1n}`));
    sectionEl.querySelectorAll("h2").forEach(el => addField(el, h2n++ === 0 ? "Título" : `Título ${h2n}`));
    sectionEl.querySelectorAll("h3").forEach(el => addField(el, h3n++ === 0 ? "Subtítulo" : `Subtítulo ${h3n}`));
    sectionEl.querySelectorAll("h4,h5,h6").forEach(el => addField(el, `Subtítulo ${++h4n}`));
    sectionEl.querySelectorAll("p").forEach(el => {
      if ((el.textContent?.trim().length ?? 0) > 8) addField(el, pn++ === 0 ? "Texto" : `Texto ${pn}`);
    });
    sectionEl.querySelectorAll("li").forEach(el => {
      const text = el.textContent?.trim() ?? "";
      if (text.length > 3 && text.length < 200) addField(el, `Item ${++liN}`);
    });
    sectionEl.querySelectorAll("button, a").forEach(el => {
      const text = el.textContent?.trim() ?? "";
      if (text && text.length < 80 && text.length > 2) addField(el, btn++ === 0 ? "Botão CTA" : `Botão ${btn}`);
    });
    sectionEl.querySelectorAll("img").forEach(el => {
      const src = el.getAttribute("src") ?? "";
      if (!src || src.startsWith("data:") || src.length < 2) return;
      const fieldId = `${sectionId}-f${fIdx++}`;
      el.setAttribute("data-calu-field", fieldId);
      const alt = el.getAttribute("alt") || "";
      const cls = (el.getAttribute("class") ?? "").toLowerCase();
      const isLogo = cls.includes("logo") || (el.closest("[class*='logo'],[id*='logo']") !== null);
      const label = isLogo ? "Logo" : (imgn++ === 0 ? "Imagem" : `Imagem ${imgn}`);
      fields.push({ id: fieldId, label: alt ? `${label} — ${alt}` : label, value: src, type: "image", src });
    });
    // CSS background-image elements
    let bgn = 0;
    sectionEl.querySelectorAll("[style*='background-image']").forEach(el => {
      if (el.getAttribute("data-calu-field")) return; // already tagged
      const style = el.getAttribute("style") ?? "";
      const match = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
      if (!match || !match[1] || match[1].startsWith("data:")) return;
      const src = match[1];
      const fieldId = `${sectionId}-f${fIdx++}`;
      el.setAttribute("data-calu-field", fieldId);
      fields.push({ id: fieldId, label: bgn++ === 0 ? "Imagem Fundo" : `Imagem Fundo ${bgn}`, value: src, type: "image", src });
    });

    if (fields.length > 0) {
      const name = detectSectionName(sectionEl, sIdx, sectionEls.length);
      sections.push({ id: sectionId, name, icon: detectSectionIcon(sectionEl, sIdx, sectionEls.length, name), fields });
    }
  });

  // Rescue images in nav/header that fell outside all sections → add to first section (Hero)
  if (sections.length > 0) {
    const tagged = new Set(sections.flatMap(s => s.fields.map(f => f.id)));
    let extraFIdx = sections[0].fields.length;
    doc.querySelectorAll("nav img, header img").forEach(el => {
      if (el.getAttribute("data-calu-field")) return; // already tagged
      const src = el.getAttribute("src") ?? "";
      if (!src || src.startsWith("data:") || src.length < 2) return;
      const fieldId = `s0-f${extraFIdx++}`;
      el.setAttribute("data-calu-field", fieldId);
      const alt = el.getAttribute("alt") || "";
      const cls = (el.getAttribute("class") ?? "").toLowerCase();
      const label = cls.includes("logo") ? "Logo" : (alt || "Imagem (nav)");
      sections[0].fields.push({ id: fieldId, label, value: src, type: "image", src });
    });
  }

  const markedHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  return { markedHtml, sections };
}

function applyFieldUpdate(html: string, fieldId: string, newValue: string, fieldType?: "text" | "image"): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = doc.querySelector(`[data-calu-field="${fieldId}"]`);
  if (el) {
    if (fieldType === "image") {
      if (el.tagName === "IMG") {
        el.setAttribute("src", newValue);
      } else {
        // background-image element
        const style = el.getAttribute("style") ?? "";
        const newStyle = style.replace(
          /background-image:\s*url\(['"]?[^'")]+['"]?\)/i,
          `background-image: url('${newValue}')`
        );
        el.setAttribute("style", newStyle || (style + `;background-image:url('${newValue}')`));
      }
    } else {
      el.textContent = newValue;
    }
  }
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

// ── Premium effects ───────────────────────────────────────────────────────────

const PREMIUM_EFFECTS: { key: string; label: string; emoji: string; css: string }[] = [
  {
    key: "glow",
    label: "Glow",
    emoji: "✨",
    css: `/* [calu-effect:glow] */\nh1,h2{text-shadow:0 0 40px rgba(185,255,75,0.35),0 0 80px rgba(185,255,75,0.15);}\na[href],button,[class*="btn"]{box-shadow:0 0 22px rgba(185,255,75,0.28),0 4px 20px rgba(0,0,0,0.5);}\n/* [/calu-effect:glow] */`,
  },
  {
    key: "shadow",
    label: "Drop Shadow",
    emoji: "🌑",
    css: `/* [calu-effect:shadow] */\nsection>div,[class*="card"]{box-shadow:0 20px 60px rgba(0,0,0,0.55),0 8px 25px rgba(0,0,0,0.35);}\nimg{box-shadow:0 25px 60px rgba(0,0,0,0.65);border-radius:12px;}\n/* [/calu-effect:shadow] */`,
  },
  {
    key: "glass",
    label: "Glass",
    emoji: "🪟",
    css: `/* [calu-effect:glass] */\n[class*="card"],section>div>div{background:rgba(255,255,255,0.04)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.09)!important;border-radius:16px;}\n/* [/calu-effect:glass] */`,
  },
  {
    key: "gradient",
    label: "Gradiente",
    emoji: "🌈",
    css: `/* [calu-effect:gradient] */\nh1,h2{background:linear-gradient(135deg,#ffffff 0%,#B9FF4B 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}\n/* [/calu-effect:gradient] */`,
  },
  {
    key: "grain",
    label: "Grain",
    emoji: "🎞️",
    css: `/* [calu-effect:grain] */\nbody::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:0.035;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:256px;}\n/* [/calu-effect:grain] */`,
  },
];

function stripEditorAttrs(html: string): string {
  return html.replace(/ data-calu-(section|field)="[^"]*"/g, "");
}

function injectEditorScript(html: string, selectedId: string): string {
  const script = `<script>(function(){
var s=document.createElement('style');
s.textContent='[data-calu-section]{cursor:pointer;transition:outline 0.15s;}[data-calu-section]:hover{outline:2px dashed rgba(185,255,75,0.35)!important;outline-offset:3px;}[data-calu-section="${selectedId}"]{outline:2px solid #B9FF4B!important;outline-offset:3px;}[data-calu-field]{cursor:pointer!important;transition:outline 0.1s;}[data-calu-field]:hover{outline:1px dashed rgba(96,165,250,0.7)!important;outline-offset:2px;}img[data-calu-field]:hover{outline:2px solid #60A5FA!important;outline-offset:2px;cursor:crosshair!important;}';
document.head.appendChild(s);
document.querySelectorAll('[data-calu-section]').forEach(function(sec){
  sec.addEventListener('click',function(e){
    var fieldEl=e.target.closest('[data-calu-field]');
    if(fieldEl){
      e.stopPropagation();
      window.parent.postMessage({type:'calu-field-click',fieldId:fieldEl.getAttribute('data-calu-field'),sectionId:sec.getAttribute('data-calu-section')},'*');
    } else {
      e.preventDefault();e.stopPropagation();
      window.parent.postMessage({type:'calu-section-click',sectionId:sec.getAttribute('data-calu-section')},'*');
    }
  },true);
});
// Also catch fields outside a data-calu-section (nav images, etc.)
document.querySelectorAll('[data-calu-field]').forEach(function(el){
  if(!el.closest('[data-calu-section]')){
    el.addEventListener('click',function(e){
      e.stopPropagation();
      window.parent.postMessage({type:'calu-field-click',fieldId:el.getAttribute('data-calu-field'),sectionId:'s0'},'*');
    },true);
  }
});
})();<\/script>`;
  return html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TomasPage() {
  const [searchParams] = useSearchParams();
  const clientId   = searchParams.get("clientId") ?? "";
  const clientName = searchParams.get("clientName") ?? "";
  const pageId     = searchParams.get("pageId") ?? "";

  // ── Briefing state ──────────────────────────────────────────────────────────
  const [produto, setProduto]     = useState("");
  const [publico, setPublico]     = useState("");
  const [objetivo, setObjetivo]   = useState("Capturar leads");
  const [tom, setTom]             = useState("Direto e persuasivo");
  const [cores, setCores]         = useState("");
  const [extras, setExtras]       = useState("");
  const [arquivos, setArquivos]   = useState<File[]>([]);
  const [imagens, setImagens]     = useState<ImageAsset[]>([]);
  const [dragOver, setDragOver]   = useState(false);
  const [imgDragOver, setImgDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // ── Generation state ────────────────────────────────────────────────────────
  const [etapa, setEtapa]         = useState<Etapa>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [parcial, setParcial]     = useState<Resultado>({ copy: "", design: "", html: "" });
  const [abaAtiva, setAbaAtiva]   = useState<"preview" | "copy" | "design" | "html" | "publicar">("preview");
  const [previewMobile, setPreviewMobile] = useState(false);
  const [htmlEditado, setHtmlEditado]     = useState("");
  const [editandoHtml, setEditandoHtml]   = useState(false);
  const [previewEditMode, setPreviewEditMode] = useState(false);
  const readerRef       = useRef<ReadableStreamDefaultReader | null>(null);
  const cancelledRef    = useRef(false);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const imgFileInputRef = useRef<HTMLInputElement>(null);

  // ── Editor Visual state ─────────────────────────────────────────────────────
  const [editorMode, setEditorMode]               = useState(false);
  const [sections, setSections]                   = useState<ParsedSection[]>([]);
  const [markedHtml, setMarkedHtml]               = useState("");
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0);
  const [aiEditField, setAiEditField]             = useState<string | null>(null);
  const [aiInstruction, setAiInstruction]         = useState("");
  const [aiLoading, setAiLoading]                 = useState(false);
  const [aiSuggestion, setAiSuggestion]           = useState<{ fieldId: string; text: string } | null>(null);
  const [directEditField, setDirectEditField]     = useState<string | null>(null);
  const [directEditValue, setDirectEditValue]     = useState("");
  const [rawHtmlSectionId, setRawHtmlSectionId]  = useState<string | null>(null);
  const [rawHtmlValue, setRawHtmlValue]           = useState("");

  // ── Tomas command state ──────────────────────────────────────────────────────
  const [tomasCmd, setTomasCmd]         = useState("");
  const [tomasCmdLoading, setTomasCmdLoading] = useState(false);

  // ── Source URLs state ────────────────────────────────────────────────────────
  const [sourceUrls, setSourceUrls]     = useState<string[]>([]);
  const [urlInput, setUrlInput]         = useState("");

  // ── Saved page state ─────────────────────────────────────────────────────────
  const [savedPageId, setSavedPageId] = useState<string | null>(null);
  const [savingPage, setSavingPage]   = useState(false);

  // ── Pedir alterações state ───────────────────────────────────────────────────
  const [alteracaoInput, setAlteracaoInput]     = useState("");
  const [alteracaoLoading, setAlteracaoLoading] = useState(false);
  const [alteracaoFiles, setAlteracaoFiles]     = useState<{name: string; text?: string; isImage?: boolean; base64?: string; mimeType?: string; previewUrl?: string}[]>([]);
  const alteracaoFileRef = useRef<HTMLInputElement>(null);
  const alteracaoImgRef  = useRef<HTMLInputElement>(null);

  // ── SEO state ────────────────────────────────────────────────────────────────
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoApplied, setSeoApplied] = useState(false);

  // ── Form injection state ─────────────────────────────────────────────────────
  const [formMode, setFormMode]     = useState<"none" | "crm" | "forminator">("none");
  const [formFields, setFormFields] = useState<("name" | "email" | "phone" | "message")[]>(["name", "email", "phone"]);
  const [formCta, setFormCta]       = useState("Quero me inscrever");
  const [formInjected, setFormInjected] = useState(false);

  // ── WordPress state ─────────────────────────────────────────────────────────
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

  // ── Load WP creds ────────────────────────────────────────────────────────────
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

  // ── Load existing LP by pageId ───────────────────────────────────────────────
  useEffect(() => {
    if (!pageId) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("landing_pages")
        .select("id, title, html_content")
        .eq("id", pageId)
        .maybeSingle();
      if (!data) { toast.error("Página não encontrada"); return; }
      setSavedPageId(data.id);
      setProduto(data.title);
      setResultado({ copy: "", design: "", html: data.html_content });
      setHtmlEditado(data.html_content);
      setEtapa("concluido");
      setAbaAtiva("preview");
      toast.success(`"${data.title}" carregada para edição`);
    })();
  }, [pageId]);

  // ── iframe messages (basic edit + editor section/field click) ───────────────
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "calu-html-update") setHtmlEditado(e.data.html);
      if (e.data?.type === "calu-section-click") {
        const idx = sections.findIndex(s => s.id === e.data.sectionId);
        if (idx >= 0) setSelectedSectionIdx(idx);
      }
      if (e.data?.type === "calu-field-click") {
        // Select the right section first
        const sIdx = sections.findIndex(s => s.id === e.data.sectionId);
        if (sIdx >= 0) setSelectedSectionIdx(sIdx);
        // Then select the field for direct editing
        const sec = sIdx >= 0 ? sections[sIdx] : sections[0];
        if (sec) {
          const field = sec.fields.find(f => f.id === e.data.fieldId);
          if (field) {
            if (field.type === "image") {
              // For images, just scroll to / highlight — the button is in FieldEditor
              setDirectEditField(null);
            } else {
              setDirectEditField(field.id);
              setDirectEditValue(field.value);
              setAiEditField(null);
              setAiSuggestion(null);
            }
          }
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [sections]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const gerandoAtivo      = etapa !== "idle" && etapa !== "concluido" && etapa !== "erro";
  const idxAtual          = etapaIndex(etapa);
  const temAlgumConteudo  = !!(resultado || parcial.copy || parcial.design || parcial.html);
  const formValido        = produto.trim() && publico.trim();
  const htmlParaExibir    = editorMode ? markedHtml : (htmlEditado || resultado?.html || parcial.html || "");

  // ── Auto-extract briefing from files ────────────────────────────────────────

  const extractBriefingFromFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setExtracting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const filesPayload: { name: string; base64: string; media_type: string }[] = [];
      const textParts: string[] = [];

      for (const f of files) {
        if (/\.(txt|md)$/i.test(f.name)) {
          const txt = await new Promise<string>((res) => {
            const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.readAsText(f, "utf-8");
          });
          textParts.push(`[${f.name}]\n${txt.trim()}`);
        } else {
          const buf = await f.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          filesPayload.push({ name: f.name, base64: btoa(binary), media_type: "application/pdf" });
        }
      }

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/extract-briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ files: filesPayload, text_content: textParts.join("\n\n") }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);

      const OBJETIVOS = ["Capturar leads", "Vender direto", "Divulgar evento", "Apresentar empresa", "Lançar produto", "Agendar consulta"];
      const TONS = ["Direto e persuasivo", "Inspirador", "Profissional", "Amigável", "Luxo e exclusivo"];

      if (data.produto)  setProduto(data.produto);
      if (data.publico)  setPublico(data.publico);
      if (data.objetivo && OBJETIVOS.includes(data.objetivo)) setObjetivo(data.objetivo);
      if (data.tom && TONS.includes(data.tom)) setTom(data.tom);
      if (data.cores)    setCores(data.cores);
      if (data.extras)   setExtras(data.extras);

      setAutoFilled(true);
      toast.success("Briefing extraído do arquivo!");
    } catch (e: any) {
      toast.error(e.message || "Não foi possível extrair o briefing.");
    } finally {
      setExtracting(false);
    }
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const salvarParcialComoResultado = useCallback((html: string) => {
    setEtapa("concluido");
    setResultado(prev => ({ copy: prev?.copy ?? "", design: prev?.design ?? "", html }));
    setHtmlEditado(html);
    setAbaAtiva("preview");
    try {
      const stored = JSON.parse(localStorage.getItem("calu_pages") ?? "[]");
      stored.unshift({ id: Date.now(), name: produto || "Landing Page", html, savedAt: new Date().toISOString() });
      localStorage.setItem("calu_pages", JSON.stringify(stored.slice(0, 30)));
    } catch { /* ignora */ }
  }, [produto]);

  const cancelar = useCallback(() => {
    cancelledRef.current = true;
    readerRef.current?.cancel();
    if (parcial.html) {
      salvarParcialComoResultado(parcial.html);
      toast.info("Geração cancelada — versão parcial salva para edição.");
    } else {
      setEtapa("idle");
      setStatusMsg("");
    }
  }, [parcial, salvarParcialComoResultado]);

  const resetTudo = useCallback(() => {
    setEtapa("idle");
    setResultado(null);
    setHtmlEditado("");
    setParcial({ copy: "", design: "", html: "" });
    setProduto("");
    setPublico("");
    setCores("");
    setExtras("");
    setArquivos([]);
    setImagens(prev => { prev.forEach(img => URL.revokeObjectURL(img.previewUrl)); return []; });
    setAutoFilled(false);
    setPreviewEditMode(false);
    setEditorMode(false);
    setSections([]);
    setMarkedHtml("");
    setAiEditField(null);
    setAiSuggestion(null);
    setDirectEditField(null);
    setSavedPageId(null);
    setFormInjected(false);
    setAlteracaoInput("");
    setAlteracaoLoading(false);
    setSeoApplied(false);
  }, []);

  // ── Editor Visual ──────────────────────────────────────────────────────────

  const activateEditor = useCallback(() => {
    const html = htmlEditado || resultado?.html;
    if (!html) return;
    const { markedHtml: marked, sections: parsed } = parseLPIntoSections(html);
    setMarkedHtml(marked);
    setSections(parsed);
    setSelectedSectionIdx(0);
    setEditorMode(true);
    setAbaAtiva("preview");
    setAiEditField(null);
    setAiSuggestion(null);
    setDirectEditField(null);
    toast.success("Editor Visual ativado — clique em qualquer seção no preview!");
  }, [htmlEditado, resultado]);

  const exitEditor = useCallback(() => {
    // Sync markedHtml back to htmlEditado (strip editor attrs)
    if (markedHtml) setHtmlEditado(stripEditorAttrs(markedHtml));
    setEditorMode(false);
    setAiEditField(null);
    setAiSuggestion(null);
    setDirectEditField(null);
  }, [markedHtml]);

  const updateFieldValue = useCallback((fieldId: string, newValue: string, fieldType?: "text" | "image") => {
    setSections(prev => prev.map(s => ({
      ...s,
      fields: s.fields.map(f => f.id === fieldId ? { ...f, value: newValue, src: fieldType === "image" ? newValue : f.src } : f),
    })));
    setMarkedHtml(prev => applyFieldUpdate(prev, fieldId, newValue, fieldType));
  }, []);

  const deleteSection = useCallback((sectionId: string) => {
    setSections(prev => {
      const filtered = prev.filter(s => s.id !== sectionId);
      setSelectedSectionIdx(idx => Math.min(idx, Math.max(0, filtered.length - 1)));
      return filtered;
    });
    setMarkedHtml(prev => {
      const doc = new DOMParser().parseFromString(prev, "text/html");
      const el = doc.querySelector(`[data-calu-section="${sectionId}"]`);
      if (el) el.remove();
      return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    });
    toast.success("Seção removida!");
  }, []);

  const openRawHtmlEditor = useCallback((sectionId: string) => {
    const doc = new DOMParser().parseFromString(markedHtml, "text/html");
    const el = doc.querySelector(`[data-calu-section="${sectionId}"]`);
    if (!el) return;
    const clean = el.outerHTML.replace(/ data-calu-(section|field)="[^"]*"/g, "");
    setRawHtmlSectionId(sectionId);
    setRawHtmlValue(clean);
    setAiEditField(null);
    setDirectEditField(null);
  }, [markedHtml]);

  const applyRawSectionHtml = useCallback(() => {
    if (!rawHtmlSectionId || !rawHtmlValue.trim()) return;
    setMarkedHtml(prev => {
      const doc = new DOMParser().parseFromString(prev, "text/html");
      const el = doc.querySelector(`[data-calu-section="${rawHtmlSectionId}"]`);
      if (!el) return prev;
      const tmp = doc.createElement("div");
      tmp.innerHTML = rawHtmlValue.trim();
      const newEl = tmp.firstElementChild;
      if (newEl) {
        newEl.setAttribute("data-calu-section", rawHtmlSectionId);
        el.replaceWith(newEl);
      }
      return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    });
    // re-parse fields for this section
    setSections(prev => prev.map((s, i) => {
      if (s.id !== rawHtmlSectionId) return s;
      const tmpDoc = new DOMParser().parseFromString(rawHtmlValue.trim(), "text/html");
      const root = tmpDoc.body.firstElementChild ?? tmpDoc.body;
      const fields: ParsedField[] = [];
      let fIdx = 0;
      const sid = rawHtmlSectionId;
      const addF = (el: Element, label: string) => {
        const text = el.textContent?.trim() ?? "";
        if (!text || text.length < 2) return;
        const fid = `${sid}-raw${fIdx++}`;
        fields.push({ id: fid, label, value: text });
      };
      root.querySelectorAll("h1").forEach(e => addF(e, "Título Principal"));
      root.querySelectorAll("h2").forEach(e => addF(e, "Título"));
      root.querySelectorAll("h3,h4").forEach(e => addF(e, "Subtítulo"));
      root.querySelectorAll("p").forEach(e => { if ((e.textContent?.trim().length ?? 0) > 8) addF(e, "Texto"); });
      root.querySelectorAll("li").forEach((e, i) => { const t = e.textContent?.trim() ?? ""; if (t.length > 3) addF(e, `Item ${i + 1}`); });
      root.querySelectorAll("button,a").forEach(e => { const t = e.textContent?.trim() ?? ""; if (t.length > 2 && t.length < 80) addF(e, "Botão"); });
      return { ...s, fields: fields.length ? fields : s.fields };
    }));
    setRawHtmlSectionId(null);
    setRawHtmlValue("");
    toast.success("Seção atualizada!");
  }, [rawHtmlSectionId, rawHtmlValue]);

  const applyEffect = useCallback((effectKey: string) => {
    const effect = PREMIUM_EFFECTS.find(e => e.key === effectKey);
    if (!effect) return;
    const marker = `[calu-effect:${effectKey}]`;
    setMarkedHtml(prev => {
      let newHtml: string;
      if (prev.includes(marker)) {
        newHtml = prev.replace(new RegExp(`/\\* \\[calu-effect:${effectKey}\\] \\*/[\\s\\S]*?/\\* \\[/calu-effect:${effectKey}\\] \\*/\\n?`, "g"), "");
        toast.success(`Efeito ${effect.label} removido`);
      } else {
        newHtml = prev.includes("</style>")
          ? prev.replace("</style>", `\n${effect.css}\n</style>`)
          : prev.replace("</head>", `<style>\n${effect.css}\n</style>\n</head>`);
        toast.success(`✨ ${effect.label} aplicado!`);
      }
      setHtmlEditado(stripEditorAttrs(newHtml));
      return newHtml;
    });
  }, []);

  const replaceImage = useCallback((fieldId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateFieldValue(fieldId, dataUrl, "image");
      toast.success("Imagem substituída!");
    };
    reader.readAsDataURL(file);
  }, [updateFieldValue]);

  const startDirectEdit = (field: ParsedField) => {
    setDirectEditField(field.id);
    setDirectEditValue(field.value);
    setAiEditField(null);
    setAiSuggestion(null);
  };

  const confirmDirectEdit = () => {
    if (directEditField && directEditValue.trim()) {
      updateFieldValue(directEditField, directEditValue.trim());
    }
    setDirectEditField(null);
    setDirectEditValue("");
  };

  const openAiEdit = (fieldId: string) => {
    setAiEditField(fieldId);
    setAiInstruction("");
    setAiSuggestion(null);
    setDirectEditField(null);
  };

  const cancelAiEdit = () => {
    setAiEditField(null);
    setAiInstruction("");
    setAiSuggestion(null);
  };

  const runAiRewrite = async (field: ParsedField) => {
    if (!aiInstruction.trim()) return;
    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const lpContext = `Produto/Serviço: ${produto}\nPúblico-alvo: ${publico}\nObjetivo: ${objetivo}\nTom de voz: ${tom}${clientName ? `\nCliente: ${clientName}` : ""}`;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/edit-lp-field`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          field_label: field.label,
          current_text: field.value,
          instruction: aiInstruction,
          lp_context: lpContext,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);
      setAiSuggestion({ fieldId: field.id, text: data.new_text });
    } catch (e: any) {
      toast.error(e.message || "Erro ao reescrever campo");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    updateFieldValue(aiSuggestion.fieldId, aiSuggestion.text);
    setAiSuggestion(null);
    setAiEditField(null);
    setAiInstruction("");
    toast.success("Campo atualizado!");
  };

  // ── Tomas command ──────────────────────────────────────────────────────────

  const runTomasCommand = async () => {
    if (!tomasCmd.trim() || tomasCmdLoading) return;
    const currentHtml = stripEditorAttrs(editorMode ? markedHtml : (htmlEditado || resultado?.html || ""));
    if (!currentHtml) return;

    setTomasCmdLoading(true);
    const cmdText = tomasCmd.trim();
    setTomasCmd("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const lpContext = [
        `Produto/Serviço: ${produto}`,
        `Público-alvo: ${publico}`,
        `Objetivo: ${objetivo}`,
        `Tom de voz: ${tom}`,
        clientName ? `Cliente: ${clientName}` : null,
      ].filter(Boolean).join("\n");

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/tomas-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ html: currentHtml, command: cmdText, lp_context: lpContext, source_urls: sourceUrls }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);

      // Suporta resposta cirúrgica (changes[]) ou fallback (new_html completo)
      let newHtml: string;
      if (data.changes && Array.isArray(data.changes)) {
        newHtml = applyChanges(currentHtml, data.changes);
      } else if (data.new_html) {
        newHtml = data.new_html as string;
      } else {
        throw new Error("Resposta inválida do Tomás");
      }
      setHtmlEditado(newHtml);

      if (editorMode) {
        const { markedHtml: newMarked, sections: newSections } = parseLPIntoSections(newHtml);
        setMarkedHtml(newMarked);
        setSections(newSections);
        setSelectedSectionIdx(0);
        setAiEditField(null);
        setAiSuggestion(null);
        setDirectEditField(null);
      }

      toast.success("Tomás aplicou o comando!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao executar comando");
      setTomasCmd(cmdText);
    } finally {
      setTomasCmdLoading(false);
    }
  };

  // ── Arquivos de alteração ────────────────────────────────────────────────────
  const addSourceUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    try { new URL(url); } catch { toast.error("URL inválida — inclua https://"); return; }
    if (sourceUrls.includes(url)) { toast.error("URL já adicionada"); return; }
    if (sourceUrls.length >= 5) { toast.error("Máximo 5 URLs de referência"); return; }
    setSourceUrls(prev => [...prev, url]);
    setUrlInput("");
  };

  const handleAlteracaoFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      if (alteracaoFiles.length >= 3) { toast.error("Máximo 3 anexos por alteração"); break; }
      try {
        const text = file.type.startsWith("text/") || /\.(txt|md|html|css|js|ts|json|csv)$/i.test(file.name)
          ? await file.text()
          : `[Arquivo binário: ${file.name} — ${(file.size / 1024).toFixed(1)} KB]`;
        setAlteracaoFiles(prev => [...prev, { name: file.name, text: text.slice(0, 8000) }]);
      } catch { toast.error(`Erro ao ler ${file.name}`); }
    }
  };

  const handleAlteracaoImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      if (alteracaoFiles.length >= 3) { toast.error("Máximo 3 anexos por alteração"); break; }
      if (!file.type.startsWith("image/")) continue;
      try {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        const base64 = btoa(binary);
        const previewUrl = URL.createObjectURL(file);
        const mimeType = (file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp") ?? "image/jpeg";
        setAlteracaoFiles(prev => [...prev, { name: file.name, isImage: true, base64, mimeType, previewUrl }]);
      } catch { toast.error(`Erro ao ler ${file.name}`); }
    }
  };

  // ── Pedir alterações (disponível fora do editor) ───────────────────────────

  const pedirAlteracao = async () => {
    if (!alteracaoInput.trim() || alteracaoLoading) return;
    const currentHtml = stripEditorAttrs(editorMode ? markedHtml : (htmlEditado || resultado?.html || ""));
    if (!currentHtml) return;
    setAlteracaoLoading(true);
    const cmd = alteracaoInput.trim();
    const filesSnapshot = [...alteracaoFiles];
    setAlteracaoInput("");
    setAlteracaoFiles([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const lpContext = [
        `Produto/Serviço: ${produto}`,
        `Público-alvo: ${publico}`,
        `Objetivo: ${objetivo}`,
        `Tom de voz: ${tom}`,
        clientName ? `Cliente: ${clientName}` : null,
      ].filter(Boolean).join("\n");
      const textFiles = filesSnapshot.filter(f => !f.isImage);
      const imgFiles  = filesSnapshot.filter(f => f.isImage);
      const fileContext = textFiles.length > 0
        ? "\n\nARQUIVOS DE REFERÊNCIA:\n" + textFiles.map(f => `[${f.name}]:\n${f.text}`).join("\n\n---\n\n")
        : "";
      const images = imgFiles.map(f => ({ base64: f.base64!, mimeType: f.mimeType!, name: f.name }));
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/tomas-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ html: currentHtml, command: cmd + fileContext, lp_context: lpContext, images, source_urls: sourceUrls }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);
      let newHtml: string;
      if (data.changes && Array.isArray(data.changes)) {
        newHtml = applyChanges(currentHtml, data.changes);
      } else if (data.new_html) {
        newHtml = data.new_html as string;
      } else {
        throw new Error("Resposta inválida do Tomás");
      }
      setHtmlEditado(newHtml);
      if (editorMode) {
        const { markedHtml: newMarked, sections: newSections } = parseLPIntoSections(newHtml);
        setMarkedHtml(newMarked);
        setSections(newSections);
        setSelectedSectionIdx(0);
        setAiEditField(null);
        setAiSuggestion(null);
        setDirectEditField(null);
      }
      toast.success("Tomás aplicou as alterações!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao aplicar alterações");
      setAlteracaoInput(cmd);
    } finally {
      setAlteracaoLoading(false);
    }
  };

  // ── Otimizar SEO ────────────────────────────────────────────────────────────

  const otimizarSEO = async () => {
    const currentHtml = stripEditorAttrs(editorMode ? markedHtml : (htmlEditado || resultado?.html || ""));
    if (!currentHtml || seoLoading) return;
    setSeoLoading(true);
    const seoCmd = `Otimize o SEO desta landing page sem alterar nada do design visual:
1. Verifique/melhore o <title> (deve conter as palavras-chave principais do produto, até 60 chars)
2. Adicione ou melhore <meta name="description" content="..."> persuasivo (150-160 chars com CTA)
3. Adicione Open Graph completo: og:title, og:description, og:type="website", og:site_name
4. Garanta que existe exatamente um <h1> com as palavras-chave principais
5. Adicione atributo alt descritivo e relevante em todas as <img> que estiverem sem alt ou com alt vazio
6. Adicione <meta name="robots" content="index, follow"> se não existir
7. Adicione <meta name="viewport" content="width=device-width, initial-scale=1.0"> se não existir
Retorne o HTML completo com as otimizações aplicadas no <head>.`;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const lpContext = `Produto/Serviço: ${produto}\nPúblico-alvo: ${publico}\nObjetivo: ${objetivo}`;
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/tomas-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ html: currentHtml, command: seoCmd, lp_context: lpContext, source_urls: sourceUrls }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);
      let newHtml: string;
      if (data.changes && Array.isArray(data.changes)) {
        newHtml = applyChanges(currentHtml, data.changes);
      } else if (data.new_html) {
        newHtml = data.new_html as string;
      } else {
        throw new Error("Resposta inválida");
      }
      setHtmlEditado(newHtml);
      setSeoApplied(true);
      if (editorMode) {
        const { markedHtml: newMarked, sections: newSections } = parseLPIntoSections(newHtml);
        setMarkedHtml(newMarked);
        setSections(newSections);
      }
      toast.success("SEO otimizado! Meta tags, Open Graph e alt texts aplicados.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao otimizar SEO");
    } finally {
      setSeoLoading(false);
    }
  };

  // ── LP generation ──────────────────────────────────────────────────────────

  const gerar = useCallback(async () => {
    if (!produto.trim() || !publico.trim()) { toast.error("Preencha o produto/serviço e o público-alvo."); return; }
    cancelledRef.current = false;
    setEtapa("copy");
    setResultado(null);
    setParcial({ copy: "", design: "", html: "" });
    setPreviewEditMode(false);
    setEditorMode(false);
    setSections([]);
    setStatusMsg("Iniciando...");
    setAbaAtiva("copy");
    setFormInjected(false);

    const parcialLocal: Resultado = { copy: "", design: "", html: "" };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const arquivosPayload: { name: string; base64: string; media_type: string }[] = [];
      for (const f of arquivos) {
        if (/\.(txt|md)$/i.test(f.name)) {
          // TXT/MD files are injected as skillContext in tomas-lp — skip from briefing
          const buf = await f.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          const b64 = btoa(binary);
          arquivosPayload.push({ name: f.name, base64: b64, media_type: "text/plain" });
        } else {
          const buf = await f.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          const b64 = btoa(binary);
          const media = f.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
          arquivosPayload.push({ name: f.name, base64: b64, media_type: media });
        }
      }
      // Upload de imagens para o Supabase Storage (bucket brand-assets)
      const imagensPayload: { url: string; label: string }[] = [];
      for (const img of imagens) {
        if (img.uploadedUrl) {
          imagensPayload.push({ url: img.uploadedUrl, label: img.label });
          continue;
        }
        setStatusMsg(`Enviando ${img.label}...`);
        const ext = img.file.name.split(".").pop() ?? "jpg";
        const path = `lp-assets/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: upData, error: upErr } = await (supabase.storage as any)
          .from("brand-assets")
          .upload(path, img.file, { contentType: img.file.type, upsert: false });
        if (upErr) { toast.error(`Erro ao enviar ${img.label}: ${upErr.message}`); continue; }
        const { data: { publicUrl } } = (supabase.storage as any).from("brand-assets").getPublicUrl(upData.path);
        setImagens(prev => prev.map(i => i.id === img.id ? { ...i, uploadedUrl: publicUrl } : i));
        imagensPayload.push({ url: publicUrl, label: img.label });
      }

      const briefingFinal = [
        `Produto/Serviço: ${produto}`,
        `Público-alvo: ${publico}`,
        `Objetivo da LP: ${objetivo}`,
        `Tom de voz: ${tom}`,
        cores.trim() ? `Cores da marca: ${cores}` : null,
        extras.trim() ? `\nInformações adicionais:\n${extras}` : null,
      ].filter(Boolean).join("\n");

      const fetchAbort = new AbortController();
      const fetchTimeout = setTimeout(() => fetchAbort.abort(), 160_000);
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/tomas-lp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ briefing: briefingFinal, client_name: clientName, arquivos: arquivosPayload, imagens: imagensPayload }),
        signal: fetchAbort.signal,
      });
      clearTimeout(fetchTimeout);
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
            setResultado({ ...parcialLocal });
            setHtmlEditado(parcialLocal.html);
            setAbaAtiva("preview");
            toast.success("Landing page gerada! Clique em 'Editor Visual' para editar campo a campo.");
            // Salva LP no localStorage para o picker de criativos das campanhas
            try {
              const stored = JSON.parse(localStorage.getItem("calu_pages") ?? "[]");
              stored.unshift({
                id: Date.now(),
                name: produto || clientName || "Landing Page",
                html: parcialLocal.html,
                savedAt: new Date().toISOString(),
              });
              localStorage.setItem("calu_pages", JSON.stringify(stored.slice(0, 30)));
            } catch { /* ignora falha de quota */ }

            // Salva no Supabase landing_pages
            try {
              const { data: sess } = await supabase.auth.getSession();
              const uid = sess?.session?.user?.id;
              const slug = (produto || clientName || "landing-page")
                .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60)
                + "-" + Date.now();
              const { data: saved } = await (supabase as any).from("landing_pages").insert({
                title: produto || clientName || "Landing Page",
                slug,
                html_content: parcialLocal.html,
                created_by: uid ?? null,
              }).select("id").single();
              if (saved?.id) setSavedPageId(saved.id);
            } catch { /* não bloqueia o fluxo */ }
            return;
          }
          setEtapa(payload.etapa as Etapa);
          setStatusMsg(payload.status ?? "");
          if (payload.conteudo) {
            if (payload.etapa === "copy")   parcialLocal.copy   = payload.conteudo;
            if (payload.etapa === "design") parcialLocal.design = payload.conteudo;
            if (payload.etapa === "html") {
              if (!parcialLocal.html) setAbaAtiva("preview"); // auto-switch ao primeiro chunk
              parcialLocal.html = payload.conteudo;
            }
            setParcial({ ...parcialLocal });
          }
        }
      }
      // Stream terminou sem evento "concluido" — salvar o que foi gerado
      if (!cancelledRef.current) {
        if (parcialLocal.html) {
          setEtapa("concluido");
          setResultado({ ...parcialLocal });
          setHtmlEditado(parcialLocal.html);
          setAbaAtiva("preview");
          toast.success("Landing page gerada!");
          try {
            const stored = JSON.parse(localStorage.getItem("calu_pages") ?? "[]");
            stored.unshift({ id: Date.now(), name: produto || clientName || "Landing Page", html: parcialLocal.html, savedAt: new Date().toISOString() });
            localStorage.setItem("calu_pages", JSON.stringify(stored.slice(0, 30)));
          } catch { /* ignora */ }
          try {
            const { data: sess } = await supabase.auth.getSession();
            const uid = sess?.session?.user?.id;
            const slug = (produto || clientName || "landing-page").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60) + "-" + Date.now();
            const { data: saved } = await (supabase as any).from("landing_pages").insert({ title: produto || clientName || "Landing Page", slug, html_content: parcialLocal.html, created_by: uid ?? null }).select("id").single();
            if (saved?.id) setSavedPageId(saved.id);
          } catch { /* não bloqueia */ }
        } else {
          setEtapa("erro");
          setStatusMsg("Geração incompleta — tente novamente.");
          toast.error("A geração não foi concluída. Tente novamente.");
        }
      }
    } catch (err: any) {
      if (cancelledRef.current || err?.name === "AbortError") return;
      setEtapa("erro");
      setStatusMsg(err?.message ?? "Erro desconhecido");
      toast.error("Falha ao gerar a landing page.");
    }
  }, [produto, publico, objetivo, tom, cores, extras, arquivos, clientName]);

  const publicar = useCallback(async () => {
    const htmlFinal = stripEditorAttrs(editorMode ? markedHtml : (htmlEditado || resultado?.html || ""));
    if (!htmlFinal) return;
    if (!wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo) { toast.error("Preencha todos os campos obrigatórios."); return; }
    setPublicando(true);
    setPaginaPublicada(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/publish-to-wp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ html: htmlFinal, wp_url: wpUrl, wp_user: wpUser, wp_password: wpPassword, titulo: wpTitulo, slug: wpSlug, wp_template: wpTemplate, forminator_id: forminatorId.trim() || null }),
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
  }, [editorMode, markedHtml, htmlEditado, resultado, wpUrl, wpUser, wpPassword, wpSlug, wpTitulo, wpTemplate, forminatorId]);

  // ── injectCrmForm ────────────────────────────────────────────────────────────
  const injectCrmForm = useCallback(async () => {
    const currentHtml = htmlEditado || resultado?.html || parcial.html;
    if (!currentHtml) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? "";
    const safeSource = `lp:${produto.slice(0, 40).replace(/'/g, "")}`;
    const safeClientId = (clientId || "").replace(/'/g, "");
    const safeCta = formCta.replace(/'/g, "\\'");

    const script = `<script>(function(){
var EP='${SUPABASE_URL}/functions/v1/lp-form-submit';
var UID='${userId}';
var CID='${safeClientId}';
var SRC='${safeSource}';
var form=document.querySelector('#contato form,.form-wrap form,form');
if(!form)return;
var sb=form.querySelector('button[type=submit],.btn-submit,button');
if(sb&&'${safeCta}')sb.textContent='${safeCta}';
form.addEventListener('submit',function(e){
  e.preventDefault();
  var btn=form.querySelector('button[type=submit],.btn-submit,button');
  var orig=btn?btn.textContent:'';
  if(btn){btn.textContent='Enviando...';btn.disabled=true;}
  var p={user_id:UID,client_id:CID,source:SRC};
  form.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]),textarea,select').forEach(function(el){
    var hint=(el.name||el.getAttribute('placeholder')||el.id||el.getAttribute('aria-label')||'').toLowerCase();
    var val=el.value.trim();if(!val)return;
    if(hint.includes('nome')||hint.includes('name'))p.name=val;
    else if(hint.includes('email'))p.email=val;
    else if(hint.includes('tel')||hint.includes('fone')||hint.includes('phone')||hint.includes('whatsapp')||el.type==='tel')p.phone=val;
    else if(hint.includes('mensagem')||hint.includes('message')||el.tagName==='TEXTAREA')p.message=val;
    else if(!p.name)p.name=val;
  });
  if(!p.name)p.name=p.email||'Lead';
  fetch(EP,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
  .then(function(){
    form.innerHTML='<div style="text-align:center;padding:56px 24px"><div style="font-size:48px;margin-bottom:16px">✓</div><p style="font-weight:700;font-size:20px;margin-bottom:8px;color:inherit">Recebemos seu contato!</p><p style="opacity:0.65;font-size:15px">Entraremos em contato em breve.</p></div>';
  })
  .catch(function(){if(btn){btn.textContent=orig;btn.disabled=false;}alert('Erro ao enviar. Tente novamente.');});
});
})();<\/script>`;

    const newHtml = currentHtml.includes("</body>")
      ? currentHtml.replace("</body>", script + "</body>")
      : currentHtml + script;

    setHtmlEditado(newHtml);
    setFormInjected(true);
    toast.success("Formulário conectado ao CRM! Leads entram direto nos Contatos.");
  }, [htmlEditado, resultado, parcial.html, clientId, produto, formCta]);

  // ── injectForminatorForm ─────────────────────────────────────────────────────
  const injectForminatorForm = useCallback(() => {
    const currentHtml = htmlEditado || resultado?.html || parcial.html;
    if (!currentHtml) return;
    if (!forminatorId.trim()) { toast.error("Digite o ID do formulário Forminator"); return; }

    const fid = forminatorId.trim();
    const formSection = `
<section id="form-inscricao" style="padding:80px 20px;background:var(--bg,#07080A);text-align:center;">
  <div style="max-width:600px;margin:0 auto;">
    <h2 style="font-size:clamp(1.4rem,4vw,2rem);font-weight:700;margin-bottom:12px;color:inherit;">Inscreva-se agora</h2>
    <p style="opacity:0.65;font-size:1rem;margin-bottom:32px;">Preencha o formulário abaixo e garanta sua vaga</p>
    <div class="calu-form-wrap" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;">[forminator_form id="${fid}"]</div>
  </div>
</section>
<script>(function(){
  if(typeof window.forminator_vars!=='undefined')return;
  var w=document.querySelector('.calu-form-wrap');
  if(!w)return;
  w.innerHTML='<div style="display:flex;flex-direction:column;gap:10px;text-align:left;">'
    +'<input type="text" placeholder="Nome completo" disabled style="padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#E0E0F0;font-size:14px;font-family:inherit;width:100%;box-sizing:border-box;"/>'
    +'<input type="email" placeholder="E-mail" disabled style="padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#E0E0F0;font-size:14px;font-family:inherit;width:100%;box-sizing:border-box;"/>'
    +'<input type="tel" placeholder="WhatsApp" disabled style="padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#E0E0F0;font-size:14px;font-family:inherit;width:100%;box-sizing:border-box;"/>'
    +'<button disabled style="width:100%;padding:14px;border-radius:8px;background:var(--accent,#B9FF4B);color:#07080A;font-weight:700;font-size:15px;border:none;font-family:inherit;">Quero me inscrever</button>'
    +'<p style="text-align:center;font-size:11px;opacity:0.4;color:inherit;margin:6px 0 0;">Formulário Forminator #${fid} — publicar no WordPress para ativar</p>'
    +'</div>';
})();<\/script>`;

    const newHtml = currentHtml.includes("</main>")
      ? currentHtml.replace("</main>", formSection + "\n</main>")
      : currentHtml.replace("</body>", formSection + "\n</body>");

    setHtmlEditado(newHtml);
    setFormInjected(true);
    if (editorMode) {
      const { markedHtml: newMarked, sections: newSections } = parseLPIntoSections(newHtml);
      setMarkedHtml(newMarked);
      setSections(newSections);
    }
    toast.success(`Seção com formulário Forminator #${forminatorId.trim()} inserida na LP!`);
  }, [htmlEditado, resultado, parcial.html, forminatorId, editorMode]);

  // ── addEditingToPreview (basic edit mode) ────────────────────────────────────

  function addEditingToPreview(html: string): string {
    if (!html || !previewEditMode) return html;
    const script = `<script>(function(){
  var banner=document.createElement('div');
  banner.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#B9FF4B;color:#07080A;font-size:12px;font-weight:700;text-align:center;padding:7px;font-family:sans-serif;';
  banner.textContent='\\u270F\\uFE0F Modo edição — clique em qualquer texto para editar';
  document.body&&document.body.appendChild(banner);
  document.addEventListener('click',function(e){
    var TAGS=['P','H1','H2','H3','H4','H5','SPAN','LI','BUTTON','A','LABEL','TD','STRONG','EM','B','I'];
    var el=e.target;if(!el||el===banner)return;
    if(TAGS.indexOf(el.tagName)>-1&&el.contentEditable!=='true'){
      e.preventDefault();el.contentEditable='true';el.style.outline='2px dashed #B9FF4B';el.style.outlineOffset='3px';el.focus();
      function finish(){el.contentEditable='false';el.style.outline='';el.style.outlineOffset='';window.parent.postMessage({type:'calu-html-update',html:document.documentElement.outerHTML},'*');}
      el.addEventListener('blur',finish,{once:true});
      el.addEventListener('keydown',function(ev){if(ev.key==='Escape')el.blur();});
    }
  },true);
})();<\/script>`;
    return html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
  }

  // ── Editor Panel render ───────────────────────────────────────────────────────

  const selectedSection = sections[selectedSectionIdx];

  function renderEditorPanel() {
    return (
      <div className="flex flex-col h-full" style={{ background: "#0A0A10" }}>

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "#1E1E2E" }}>
          <button
            onClick={exitEditor}
            className="flex items-center gap-1.5 text-xs rounded-lg px-2 py-1.5 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)", background: "#141420" }}
            onMouseEnter={e => e.currentTarget.style.color = "#B9FF4B"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Briefing
          </button>
          <div className="flex items-center gap-1.5 ml-1">
            <Wand2 className="w-3.5 h-3.5" style={{ color: "#B9FF4B" }} />
            <span className="text-sm font-bold" style={{ color: "#F0F0F0" }}>Editor Visual</span>
          </div>
        </div>

        {sections.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: "#444466" }}>Nenhuma seção detectada</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* Sections list */}
            <div className="px-3 pt-3 pb-1 flex-shrink-0">
              <p className="text-[10px] uppercase tracking-widest font-semibold px-1 mb-2" style={{ color: "#444466" }}>Seções</p>
              <div className="flex flex-col gap-0.5">
                {sections.map((s, i) => (
                  <div
                    key={s.id}
                    className="group flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer"
                    style={{
                      background: i === selectedSectionIdx ? "#B9FF4B15" : "transparent",
                      border: `1px solid ${i === selectedSectionIdx ? "#B9FF4B30" : "transparent"}`,
                    }}
                    onClick={() => { setSelectedSectionIdx(i); setAiEditField(null); setAiSuggestion(null); setDirectEditField(null); }}
                  >
                    <span className="text-base flex-shrink-0">{s.icon}</span>
                    <span className="truncate text-xs font-medium flex-1"
                      style={{ color: i === selectedSectionIdx ? "#B9FF4B" : "rgba(255,255,255,0.45)" }}>
                      {s.name}
                    </span>
                    <span className="text-[10px] flex-shrink-0 group-hover:hidden" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {s.fields.length}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedSectionIdx(i); openRawHtmlEditor(s.id); }}
                        title="Editar HTML da seção"
                        className="flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold transition-colors"
                        style={{ color: "#8888BB", background: "#1E1E2E" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#B9FF4B"}
                        onMouseLeave={e => e.currentTarget.style.color = "#8888BB"}
                      >
                        {"</>"}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteSection(s.id); }}
                        title="Excluir seção"
                        className="flex items-center justify-center w-5 h-5 rounded flex-shrink-0 transition-colors"
                        style={{ color: "#FF4466" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#FF446622"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-3 my-2 border-t flex-shrink-0" style={{ borderColor: "#1E1E2E" }} />

            {/* Fields of selected section */}
            {selectedSection && (
              <div className="flex-1 overflow-y-auto px-3 pb-4">
                <div className="flex items-center justify-between px-1 mb-3">
                  <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>
                    {rawHtmlSectionId === selectedSection.id ? "Editar HTML" : `${selectedSection.name} — campos`}
                  </p>
                  <button
                    onClick={() => rawHtmlSectionId === selectedSection.id
                      ? (setRawHtmlSectionId(null), setRawHtmlValue(""))
                      : openRawHtmlEditor(selectedSection.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: rawHtmlSectionId === selectedSection.id ? "#B9FF4B22" : "#1A1A2E",
                      border: `1px solid ${rawHtmlSectionId === selectedSection.id ? "#B9FF4B44" : "#2A2A3A"}`,
                      color: rawHtmlSectionId === selectedSection.id ? "#B9FF4B" : "#555577",
                    }}>
                    {"</>"} {rawHtmlSectionId === selectedSection.id ? "Campos" : "HTML"}
                  </button>
                </div>

                {/* Raw HTML editor mode */}
                {rawHtmlSectionId === selectedSection.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      autoFocus
                      rows={14}
                      value={rawHtmlValue}
                      onChange={e => setRawHtmlValue(e.target.value)}
                      spellCheck={false}
                      className="w-full resize-none rounded-xl px-3 py-2.5 text-[11px] font-mono outline-none"
                      style={{ background: "#0D0D16", border: "1px solid #B9FF4B33", color: "#B9FF4B", lineHeight: 1.6 }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => { setRawHtmlSectionId(null); setRawHtmlValue(""); }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px]"
                        style={{ background: "#1E1E2E", color: "#888899" }}>
                        <X className="w-3 h-3" /> Cancelar
                      </button>
                      <button onClick={applyRawSectionHtml}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold"
                        style={{ background: "#B9FF4B", color: "#07080A" }}>
                        <Check className="w-3 h-3" /> Aplicar
                      </button>
                    </div>
                  </div>
                ) : (
                <div className="flex flex-col gap-3">
                  {selectedSection.fields.map(field => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      isAiEditing={aiEditField === field.id}
                      isDirectEditing={directEditField === field.id}
                      directEditValue={directEditValue}
                      aiInstruction={aiInstruction}
                      aiLoading={aiLoading && aiEditField === field.id}
                      aiSuggestion={aiSuggestion?.fieldId === field.id ? aiSuggestion.text : null}
                      onOpenAiEdit={() => openAiEdit(field.id)}
                      onCancelAiEdit={cancelAiEdit}
                      onSetInstruction={setAiInstruction}
                      onRunAiRewrite={() => runAiRewrite(field)}
                      onApplySuggestion={applyAiSuggestion}
                      onDiscardSuggestion={() => setAiSuggestion(null)}
                      onStartDirectEdit={() => startDirectEdit(field)}
                      onDirectEditChange={setDirectEditValue}
                      onConfirmDirectEdit={confirmDirectEdit}
                      onCancelDirectEdit={() => { setDirectEditField(null); setDirectEditValue(""); }}
                      onReplaceImage={(file) => replaceImage(field.id, file)}
                    />
                  ))}
                </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Comando ao Tomás ── */}
        <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t" style={{ borderColor: "#1E1E2E" }}>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2 px-1 flex items-center gap-1.5" style={{ color: "#444466" }}>
            <span>🖥️</span> Comando ao Tomás
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={tomasCmd}
              onChange={e => setTomasCmd(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runTomasCommand(); } }}
              disabled={tomasCmdLoading}
              placeholder='Ex: "Adiciona uma seção de FAQ"'
              className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
              style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", fontFamily: "inherit" }}
              onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
              onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"}
            />
            <button
              onClick={runTomasCommand}
              disabled={!tomasCmd.trim() || tomasCmdLoading}
              className="flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
              style={{
                width: 36, height: 36,
                background: tomasCmd.trim() && !tomasCmdLoading ? "#B9FF4B" : "#1E1E2E",
                color: tomasCmd.trim() && !tomasCmdLoading ? "#07080A" : "#444466",
                cursor: tomasCmd.trim() && !tomasCmdLoading ? "pointer" : "not-allowed",
              }}
            >
              {tomasCmdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {tomasCmdLoading && (
            <p className="text-[10px] mt-1.5 px-1" style={{ color: "#B9FF4B", opacity: 0.7 }}>
              Tomás está aplicando o comando...
            </p>
          )}
          {!tomasCmdLoading && (
            <>
              {/* Efeitos premium */}
              <div className="mt-2 mb-1">
                <p className="text-[9px] uppercase tracking-widest px-0.5 mb-1.5" style={{ color: "#333355" }}>Efeitos premium</p>
                <div className="flex flex-wrap gap-1">
                  {PREMIUM_EFFECTS.map(ef => {
                    const active = markedHtml.includes(`[calu-effect:${ef.key}]`);
                    return (
                      <button key={ef.key} onClick={() => applyEffect(ef.key)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] transition-all"
                        style={{
                          background: active ? "#B9FF4B22" : "#1A1A2E",
                          border: `1px solid ${active ? "#B9FF4B55" : "#2A2A3A"}`,
                          color: active ? "#B9FF4B" : "#8888AA",
                        }}>
                        <span>{ef.emoji}</span>{ef.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Sugestões de fonte */}
              <div className="flex flex-wrap gap-1 mt-1">
                {["Fonte Inter", "Fonte Playfair Display", "Fonte Montserrat", "Fonte Space Grotesk"].map(f => (
                  <button key={f} onClick={() => { setTomasCmd(`Troca a fonte do texto para ${f.replace("Fonte ", "")}`); }}
                    className="px-2 py-0.5 rounded-full text-[10px] transition-colors"
                    style={{ background: "#1A1A2E", border: "1px solid #2A2A3A", color: "#8888AA" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#B9FF4B44"; e.currentTarget.style.color = "#B9FF4B"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#2A2A3A"; e.currentTarget.style.color = "#8888AA"; }}>
                    {f}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── RETURN ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#07080A" }}>

      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col border-r flex-shrink-0" style={{ width: 340, minWidth: 300, borderColor: "#1E1E2E" }}>
        {editorMode ? renderEditorPanel() : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#1E1E2E", background: "#0A0A10" }}>
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
            <div className="px-5 py-3 border-b" style={{ borderColor: "#1E1E2E", background: "#0A0A10" }}>
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
            <div className="flex-1 flex flex-col px-5 py-4 gap-3 overflow-y-auto" style={{ background: "#0A0A10" }}>
              <label className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Briefing</label>

              {autoFilled && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#0E1A08", border: "1px solid #B9FF4B33" }}>
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                  <span className="text-[11px]" style={{ color: "#B9FF4B", opacity: 0.8 }}>Briefing extraído — revise e ajuste se necessário</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest" style={{ color: "#555577" }}>Produto / Serviço <span style={{ color: "#B9FF4B" }}>*</span></label>
                <input type="text" className="rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "#141420", border: `1px solid ${autoFilled && produto ? "#B9FF4B33" : "#2A2A3A"}`, color: "#E0E0F0" }}
                  placeholder="Ex: Curso de gestão financeira para MEIs"
                  value={produto} onChange={e => { setProduto(e.target.value); setAutoFilled(false); }} disabled={gerandoAtivo}
                  onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                  onBlur={e => e.currentTarget.style.borderColor = autoFilled && produto ? "#B9FF4B33" : "#2A2A3A"} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest" style={{ color: "#555577" }}>Público-alvo <span style={{ color: "#B9FF4B" }}>*</span></label>
                <input type="text" className="rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "#141420", border: `1px solid ${autoFilled && publico ? "#B9FF4B33" : "#2A2A3A"}`, color: "#E0E0F0" }}
                  placeholder="Ex: Empreendedores 30-50 anos, iniciantes"
                  value={publico} onChange={e => { setPublico(e.target.value); setAutoFilled(false); }} disabled={gerandoAtivo}
                  onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                  onBlur={e => e.currentTarget.style.borderColor = autoFilled && publico ? "#B9FF4B33" : "#2A2A3A"} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest" style={{ color: "#555577" }}>Objetivo</label>
                <select className="rounded-xl px-3 py-2.5 text-sm outline-none appearance-none"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                  value={objetivo} onChange={e => setObjetivo(e.target.value)} disabled={gerandoAtivo}>
                  <option>Capturar leads</option>
                  <option>Vender direto</option>
                  <option>Divulgar evento</option>
                  <option>Apresentar empresa</option>
                  <option>Lançar produto</option>
                  <option>Agendar consulta</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest" style={{ color: "#555577" }}>Tom de voz</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Direto e persuasivo", "Inspirador", "Profissional", "Amigável", "Luxo e exclusivo"].map(t => (
                    <button key={t} type="button" onClick={() => { if (!gerandoAtivo) setTom(t); }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                      style={{ background: tom === t ? "#B9FF4B22" : "#141420", border: `1px solid ${tom === t ? "#B9FF4B" : "#2A2A3A"}`, color: tom === t ? "#B9FF4B" : "#555577", cursor: gerandoAtivo ? "default" : "pointer" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest" style={{ color: "#555577" }}>Cores da marca <span style={{ color: "#444466" }}>(opcional)</span></label>
                <input type="text" className="rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                  placeholder="Ex: azul marinho #003366 e dourado"
                  value={cores} onChange={e => setCores(e.target.value)} disabled={gerandoAtivo}
                  onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                  onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest" style={{ color: "#555577" }}>Informações adicionais <span style={{ color: "#444466" }}>(opcional)</span></label>
                <textarea rows={3} className="resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", lineHeight: 1.6, fontFamily: "inherit" }}
                  placeholder="Diferenciais, garantias, preço, urgência..."
                  value={extras} onChange={e => setExtras(e.target.value)} disabled={gerandoAtivo}
                  onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                  onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"} />
              </div>

              {/* Páginas de referência */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest" style={{ color: "#555577" }}>
                  Páginas de referência <span style={{ color: "#444466" }}>(opcional)</span>
                </label>
                <p className="text-[10px]" style={{ color: "#444466" }}>Tomás lerá o conteúdo dessas páginas e usará apenas as informações reais — nunca inventará dados.</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                    placeholder="https://site-do-cliente.com.br"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSourceUrl(); } }}
                    disabled={gerandoAtivo}
                    onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                    onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"}
                  />
                  <button
                    type="button"
                    onClick={addSourceUrl}
                    disabled={!urlInput.trim() || gerandoAtivo}
                    title="Adicionar URL"
                    className="px-3 rounded-xl transition-all disabled:opacity-40"
                    style={{ background: "#B9FF4B15", border: "1px solid #B9FF4B33", color: "#B9FF4B" }}
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </button>
                </div>
                {sourceUrls.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {sourceUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                        style={{ background: "#0E1A08", border: "1px solid #B9FF4B22" }}>
                        <Globe className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                        <span className="flex-1 truncate text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{url}</span>
                        <button onClick={() => setSourceUrls(prev => prev.filter((_, j) => j !== i))}
                          className="flex-shrink-0" style={{ color: "#555577" }}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.md" style={{ display: "none" }}
                  onChange={e => {
                    const added = Array.from(e.target.files ?? []);
                    if (!added.length) return;
                    setArquivos(prev => {
                      const next = [...prev, ...added];
                      extractBriefingFromFiles(next);
                      return next;
                    });
                    e.target.value = "";
                  }} />
                <div
                  onDragOver={e => { e.preventDefault(); if (!gerandoAtivo && !extracting) setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragOver(false);
                    if (gerandoAtivo || extracting) return;
                    const added = Array.from(e.dataTransfer.files).filter(f => /\.(pdf|docx|doc|txt|md)$/i.test(f.name));
                    if (!added.length) return;
                    setArquivos(prev => {
                      const next = [...prev, ...added];
                      extractBriefingFromFiles(next);
                      return next;
                    });
                  }}
                  onClick={() => { if (!gerandoAtivo && !extracting) fileInputRef.current?.click(); }}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl text-xs transition-all"
                  style={{
                    background: dragOver ? "#B9FF4B0D" : extracting ? "#B9FF4B08" : "#141420",
                    border: `1.5px dashed ${dragOver ? "#B9FF4B" : extracting ? "#B9FF4B55" : arquivos.length > 0 ? "#B9FF4B44" : "#2A2A3A"}`,
                    color: dragOver ? "#B9FF4B" : extracting ? "#B9FF4B" : arquivos.length > 0 ? "#B9FF4B" : "#555577",
                    cursor: gerandoAtivo || extracting ? "default" : "pointer",
                  }}>
                  {extracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="font-medium">Extraindo briefing do arquivo...</span>
                      <span style={{ color: "#555577", fontSize: 10 }}>Claude está lendo o material</span>
                    </>
                  ) : (
                    <>
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{dragOver ? "Solte aqui" : arquivos.length > 0 ? `${arquivos.length} arquivo(s) — clique para adicionar mais` : "Arraste o briefing aqui — PDF, Word, TXT"}</span>
                      {arquivos.length === 0 && <span style={{ color: "#444466", fontSize: 10 }}>Os campos serão preenchidos automaticamente</span>}
                    </>
                  )}
                </div>

                {arquivos.length > 0 && !extracting && (
                  <div className="flex flex-col gap-1 max-h-20 overflow-y-auto">
                    {arquivos.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: "#141420" }}>
                        <FileText className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                        <span className="text-[10px] truncate flex-1" style={{ color: "#888899" }}>{f.name}</span>
                        <button onClick={() => setArquivos(prev => prev.filter((_, j) => j !== i))} className="text-[10px]" style={{ color: "#444466" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Re-extract button */}
                {arquivos.length > 0 && !extracting && !gerandoAtivo && (
                  <button
                    onClick={() => extractBriefingFromFiles(arquivos)}
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                    style={{ background: "#1E1E2E", color: "#888899", border: "1px solid #2A2A3A" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#B9FF4B"; e.currentTarget.style.borderColor = "#B9FF4B44"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#888899"; e.currentTarget.style.borderColor = "#2A2A3A"; }}>
                    <RefreshCw className="w-3 h-3" /> Re-extrair briefing
                  </button>
                )}
              </div>

              {/* Upload de imagens */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <label className="text-[10px] uppercase tracking-widest" style={{ color: "#555577" }}>
                  Imagens <span style={{ color: "#444466" }}>(logo, palestrantes — opcional)</span>
                </label>
                <input ref={imgFileInputRef} type="file" multiple accept="image/*" style={{ display: "none" }}
                  onChange={e => {
                    const added = Array.from(e.target.files ?? []);
                    if (!added.length) return;
                    setImagens(prev => [...prev, ...added.map(f => ({
                      id: `${Date.now()}-${Math.random()}`,
                      file: f,
                      label: guessImageLabel(f.name),
                      previewUrl: URL.createObjectURL(f),
                    }))]);
                    e.target.value = "";
                  }} />
                <div
                  onDragOver={e => { e.preventDefault(); if (!gerandoAtivo) setImgDragOver(true); }}
                  onDragLeave={() => setImgDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setImgDragOver(false);
                    if (gerandoAtivo) return;
                    const added = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                    if (!added.length) return;
                    setImagens(prev => [...prev, ...added.map(f => ({
                      id: `${Date.now()}-${Math.random()}`,
                      file: f,
                      label: guessImageLabel(f.name),
                      previewUrl: URL.createObjectURL(f),
                    }))]);
                  }}
                  onClick={() => { if (!gerandoAtivo) imgFileInputRef.current?.click(); }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs transition-all"
                  style={{
                    background: imgDragOver ? "#B9FF4B0D" : "#141420",
                    border: `1.5px dashed ${imgDragOver ? "#B9FF4B" : imagens.length > 0 ? "#B9FF4B44" : "#2A2A3A"}`,
                    color: imgDragOver ? "#B9FF4B" : imagens.length > 0 ? "#B9FF4B" : "#555577",
                    cursor: gerandoAtivo ? "default" : "pointer",
                  }}>
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>{imgDragOver ? "Solte aqui" : imagens.length > 0 ? `${imagens.length} imagem(ns) — clique para adicionar mais` : "Arraste imagens — JPG, PNG, SVG, WebP"}</span>
                </div>

                {imagens.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {imagens.map(img => (
                      <div key={img.id} className="flex items-center gap-2 p-1.5 rounded-xl" style={{ background: "#141420", border: "1px solid #2A2A3A" }}>
                        <img src={img.previewUrl} alt={img.label}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          style={{ border: "1px solid #2A2A3A" }} />
                        <input
                          type="text"
                          value={img.label}
                          onChange={e => setImagens(prev => prev.map(i => i.id === img.id ? { ...i, label: e.target.value } : i))}
                          disabled={gerandoAtivo}
                          className="flex-1 bg-transparent text-xs outline-none"
                          style={{ color: "#E0E0F0" }}
                          placeholder="Rótulo da imagem"
                        />
                        {img.uploadedUrl && <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />}
                        <button
                          onClick={() => { URL.revokeObjectURL(img.previewUrl); setImagens(prev => prev.filter(i => i.id !== img.id)); }}
                          disabled={gerandoAtivo}
                          className="text-[10px] flex-shrink-0 px-1"
                          style={{ color: "#444466" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Painel de Formulário */}
            {(resultado || parcial.html) && !gerandoAtivo && (
              <div className="px-5 py-3 border-t" style={{ borderColor: "#1E1E2E", background: "#0A0A10" }}>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#444466" }}>Formulário de inscrição</p>
                <div className="flex gap-1 mb-3">
                  {(["none", "crm", "forminator"] as const).map(m => (
                    <button key={m} onClick={() => setFormMode(m)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                      style={{ background: formMode === m ? "#B9FF4B22" : "#141420", border: `1px solid ${formMode === m ? "#B9FF4B55" : "#2A2A3A"}`, color: formMode === m ? "#B9FF4B" : "#555577" }}>
                      {m === "none" ? "Nenhum" : m === "crm" ? "CRM" : "Forminator"}
                    </button>
                  ))}
                </div>

                {formMode === "crm" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {(["name", "email", "phone", "message"] as const).map(f => {
                        const labels = { name: "Nome", email: "E-mail", phone: "Telefone", message: "Mensagem" };
                        return (
                          <label key={f} className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none"
                            style={{ color: formFields.includes(f) ? "#B9FF4B" : "#555577" }}>
                            <input type="checkbox" checked={formFields.includes(f)}
                              onChange={e => setFormFields(prev => e.target.checked ? [...prev, f] : prev.filter(x => x !== f))}
                              style={{ accentColor: "#B9FF4B" }} />
                            {labels[f]}
                          </label>
                        );
                      })}
                    </div>
                    <input type="text" value={formCta} onChange={e => setFormCta(e.target.value)}
                      className="rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                      placeholder="Texto do botão: Ex: Quero me inscrever"
                      onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                      onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"} />
                    <button onClick={injectCrmForm} disabled={formInjected}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: formInjected ? "#0E1A08" : "#B9FF4B22", border: `1px solid ${formInjected ? "#B9FF4B33" : "#B9FF4B55"}`, color: "#B9FF4B", opacity: formInjected ? 0.7 : 1 }}>
                      {formInjected ? <><CheckCircle2 className="w-4 h-4" /> Formulário conectado</> : <><Wand2 className="w-4 h-4" /> Conectar ao CRM</>}
                    </button>
                    {formInjected && (
                      <p className="text-[10px] text-center" style={{ color: "#444466" }}>Leads entram direto nos Contatos do OmniCRM</p>
                    )}
                  </div>
                )}

                {formMode === "forminator" && (
                  <div className="flex flex-col gap-2">
                    <input type="text" value={forminatorId} onChange={e => setForminatorId(e.target.value)}
                      className="rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                      placeholder="ID do formulário — Ex: 42"
                      onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                      onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"} />
                    <button onClick={injectForminatorForm} disabled={formInjected || !forminatorId.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: formInjected ? "#0E1A08" : "#B9FF4B22", border: `1px solid ${formInjected ? "#B9FF4B33" : "#B9FF4B55"}`, color: "#B9FF4B", opacity: (formInjected || !forminatorId.trim()) ? 0.6 : 1 }}>
                      {formInjected ? <><CheckCircle2 className="w-4 h-4" /> Formulário inserido</> : <><Wand2 className="w-4 h-4" /> Inserir na LP</>}
                    </button>
                    {formInjected && (
                      <p className="text-[10px] text-center" style={{ color: "#444466" }}>Shortcode [forminator_form id="{forminatorId}"] inserido na seção de inscrição</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Pedir alterações ── */}
            {(resultado || parcial.html) && !gerandoAtivo && (
              <div className="px-5 py-3 border-t flex-shrink-0" style={{ borderColor: "#1E1E2E", background: "#0A0A10" }}>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#444466" }}>
                  <span>💬</span> Pedir alterações ao Tomás
                </p>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <textarea
                      rows={2}
                      className="resize-none rounded-xl px-3 py-2.5 text-sm outline-none w-full pr-10"
                      style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", lineHeight: 1.6, fontFamily: "inherit" }}
                      placeholder={'"Torna o hero mais impactante" ou "Adiciona seção de FAQ"'}
                      value={alteracaoInput}
                      onChange={e => setAlteracaoInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) pedirAlteracao(); }}
                      disabled={alteracaoLoading}
                      onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                      onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"}
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => alteracaoImgRef.current?.click()}
                        disabled={alteracaoLoading || alteracaoFiles.length >= 3}
                        title="Enviar imagem de referência (logo, foto, etc.)"
                        className="p-1 rounded-lg transition-colors"
                        style={{ color: alteracaoFiles.some(f => f.isImage) ? "#60A5FA" : "#444466", background: "transparent" }}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => alteracaoFileRef.current?.click()}
                        disabled={alteracaoLoading || alteracaoFiles.length >= 3}
                        title="Anexar arquivo de referência"
                        className="p-1 rounded-lg transition-colors"
                        style={{ color: alteracaoFiles.some(f => !f.isImage) ? "#B9FF4B" : "#444466", background: "transparent" }}
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <input ref={alteracaoFileRef} type="file" multiple accept=".txt,.md,.html,.css,.js,.ts,.json,.csv,.pdf" className="hidden" onChange={handleAlteracaoFileAdd} />
                  <input ref={alteracaoImgRef} type="file" multiple accept="image/*" className="hidden" onChange={handleAlteracaoImageAdd} />
                  {/* URLs ativas como referência */}
                  {sourceUrls.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Globe className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B", opacity: 0.6 }} />
                      <span className="text-[10px]" style={{ color: "#555577" }}>Páginas ativas:</span>
                      {sourceUrls.map((url, i) => (
                        <span key={i} className="text-[10px] truncate max-w-[140px] px-1.5 py-0.5 rounded"
                          style={{ background: "#0E1A08", color: "#B9FF4B", opacity: 0.7 }}>
                          {new URL(url).hostname}
                        </span>
                      ))}
                    </div>
                  )}
                  {alteracaoFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {alteracaoFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1 rounded-lg text-[10px] overflow-hidden"
                          style={{ background: "#1A1A2E", border: `1px solid ${f.isImage ? "#60A5FA44" : "#B9FF4B33"}` }}>
                          {f.isImage && f.previewUrl ? (
                            <img src={f.previewUrl} alt={f.name} className="w-8 h-8 object-cover flex-shrink-0" />
                          ) : (
                            <FileText className="w-3 h-3 flex-shrink-0 ml-2" style={{ color: "#B9FF4B" }} />
                          )}
                          <span className="max-w-[90px] truncate px-1.5 py-1" style={{ color: f.isImage ? "#60A5FA" : "#B9FF4B" }}>{f.name}</span>
                          <button onClick={() => setAlteracaoFiles(prev => prev.filter((_, j) => j !== i))}
                            className="pr-1.5 opacity-60 hover:opacity-100" style={{ color: "rgba(255,255,255,0.5)" }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={pedirAlteracao}
                    disabled={!alteracaoInput.trim() || alteracaoLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: alteracaoInput.trim() && !alteracaoLoading ? "#B9FF4B22" : "#141420",
                      border: `1px solid ${alteracaoInput.trim() && !alteracaoLoading ? "#B9FF4B55" : "#2A2A3A"}`,
                      color: alteracaoInput.trim() && !alteracaoLoading ? "#B9FF4B" : "#444466",
                      cursor: alteracaoInput.trim() && !alteracaoLoading ? "pointer" : "not-allowed",
                    }}
                  >
                    {alteracaoLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Tomás aplicando...</>
                      : <><Send className="w-4 h-4" /> Enviar ao Tomás{alteracaoFiles.length > 0 ? ` + ${alteracaoFiles.filter(f=>f.isImage).length > 0 ? `${alteracaoFiles.filter(f=>f.isImage).length} img` : ""}${alteracaoFiles.filter(f=>!f.isImage).length > 0 ? ` + ${alteracaoFiles.filter(f=>!f.isImage).length} arq` : ""}` : ""}</>
                    }
                  </button>
                  {alteracaoLoading && (
                    <p className="text-[10px] text-center" style={{ color: "#B9FF4B", opacity: 0.6 }}>
                      Ctrl+Enter para enviar rapidamente
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botões inferiores */}
            <div className="px-5 pb-5 flex flex-col gap-2" style={{ background: "#0A0A10" }}>
              {/* SEO + Editor Visual (after generation) */}
              {(resultado || parcial.html) && !gerandoAtivo && (
                <div className="flex gap-2">
                  <button
                    onClick={otimizarSEO}
                    disabled={seoLoading}
                    title="Aplica meta description, Open Graph, alt texts e otimiza title/h1"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: seoApplied ? "#0E1A08" : "#1E1E2E",
                      border: `1px solid ${seoApplied ? "#B9FF4B44" : "#2A2A3A"}`,
                      color: seoApplied ? "#B9FF4B" : "#8888AA",
                    }}
                  >
                    {seoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    {seoApplied ? "SEO ✓" : "SEO"}
                  </button>
                  <button onClick={activateEditor}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "#B9FF4B15", border: "1px solid #B9FF4B40", color: "#B9FF4B" }}>
                    <Wand2 className="w-3.5 h-3.5" /> Editor
                  </button>
                </div>
              )}
              {/* Gerar / Cancelar */}
              {gerandoAtivo ? (
                <button onClick={cancelar} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "#1E1E2E", border: "1px solid #3A3A4A", color: "#8888AA" }}>
                  <XIcon className="w-4 h-4" /> Cancelar
                </button>
              ) : (
                <button onClick={gerar} disabled={!formValido}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                  style={{ background: formValido ? "#B9FF4B" : "#1E1E2E", color: formValido ? "#07080A" : "#444466", cursor: formValido ? "pointer" : "not-allowed" }}>
                  <Sparkles className="w-4 h-4" /> {resultado ? "Gerar nova LP" : "Gerar Landing Page"}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-0 border-b px-4" style={{ borderColor: "#1E1E2E", background: "#0A0A10", minHeight: 52 }}>
          {(etapa === "idle" && !temAlgumConteudo) ? (
            <div className="flex items-center gap-3 flex-1">
              {ETAPAS.map((e, i) => {
                const done   = idxAtual > i;
                const active = idxAtual === i && gerandoAtivo;
                return (
                  <div key={e.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium"
                      style={{ background: done ? "#B9FF4B22" : active ? "#1E1E2E" : "transparent", border: `1px solid ${done ? "#B9FF4B55" : active ? "#B9FF4B33" : "#1E1E2E"}`, color: done ? "#B9FF4B" : active ? "#B9FF4B" : "#444466" }}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : active ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <e.icon className="w-3.5 h-3.5" />}
                      <span>{e.label}</span>
                    </div>
                    {i < ETAPAS.length - 1 && <div className="w-6 h-px" style={{ background: "#1E1E2E" }} />}
                  </div>
                );
              })}
              {gerandoAtivo && statusMsg && <span className="ml-2 text-[11px]" style={{ color: "#666688" }}>{statusMsg}</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-1">
              {/* Editor mode badge */}
              {editorMode && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold mr-2"
                  style={{ background: "#B9FF4B22", border: "1px solid #B9FF4B55", color: "#B9FF4B" }}>
                  <Wand2 className="w-3.5 h-3.5" /> Editor Visual ativo
                </div>
              )}
              {!editorMode && ([
                { id: "preview",  label: "Preview",     icon: Eye },
                { id: "copy",     label: "Copy",        icon: FileText },
                { id: "design",   label: "Design Spec", icon: Palette },
                { id: "html",     label: "HTML",        icon: Code2 },
                { id: "publicar", label: "Publicar",    icon: Globe },
              ] as const).map(aba => (
                <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-all"
                  style={{ background: abaAtiva === aba.id ? "#B9FF4B22" : "transparent", color: abaAtiva === aba.id ? "#B9FF4B" : "#555577", borderBottom: abaAtiva === aba.id ? "2px solid #B9FF4B" : "2px solid transparent", borderRadius: "8px 8px 0 0" }}>
                  <aba.icon className="w-3.5 h-3.5" /> {aba.label}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                {/* Preview controls */}
                {(abaAtiva === "preview" || editorMode) && (
                  <>
                    <button onClick={() => setPreviewMobile(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]"
                      style={{ background: "#1E1E2E", color: "#8888AA" }}>
                      {previewMobile ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                    </button>
                    {!editorMode && htmlParaExibir && (
                      <button onClick={() => setPreviewEditMode(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                        style={{ background: previewEditMode ? "#B9FF4B22" : "#1E1E2E", border: previewEditMode ? "1px solid #B9FF4B55" : "1px solid transparent", color: previewEditMode ? "#B9FF4B" : "#8888AA" }}>
                        <Edit3 className="w-3.5 h-3.5" /> {previewEditMode ? "Editando" : "Editar texto"}
                      </button>
                    )}
                  </>
                )}
                {abaAtiva === "html" && !editorMode && (
                  <>
                    <button onClick={() => setEditandoHtml(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]"
                      style={{ background: editandoHtml ? "#B9FF4B22" : "#1E1E2E", color: editandoHtml ? "#B9FF4B" : "#8888AA", border: editandoHtml ? "1px solid #B9FF4B44" : "none" }}>
                      <Edit3 className="w-3.5 h-3.5" /> {editandoHtml ? "Visualizar" : "Editar"}
                    </button>
                    <button onClick={() => copyToClipboard(htmlParaExibir)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]"
                      style={{ background: "#1E1E2E", color: "#8888AA" }}>
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </button>
                  </>
                )}
                {savedPageId && (resultado || htmlEditado) && !gerandoAtivo && (
                  <button
                    onClick={async () => {
                      setSavingPage(true);
                      const html = stripEditorAttrs(editorMode ? markedHtml : (htmlEditado || resultado?.html || ""));
                      const { error } = await (supabase as any).from("landing_pages")
                        .update({ html_content: html, updated_at: new Date().toISOString() })
                        .eq("id", savedPageId);
                      setSavingPage(false);
                      if (error) toast.error("Erro ao salvar");
                      else toast.success("Alterações salvas!");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                    style={{ background: "#B9FF4B22", border: "1px solid #B9FF4B55", color: "#B9FF4B" }}>
                    {savingPage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {savingPage ? "Salvando..." : "Salvar"}
                  </button>
                )}
                {(resultado || markedHtml) && (
                  <button onClick={() => downloadHtml(stripEditorAttrs(htmlParaExibir))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                    style={{ background: "#B9FF4B", color: "#07080A" }}>
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </button>
                )}
                <button onClick={resetTudo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]"
                  style={{ background: "#1E1E2E", color: "#8888AA" }} title="Nova LP">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* Idle */}
            {etapa === "idle" && !resultado && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-6" style={{ color: "#333355" }}>
                <div style={{ fontSize: 72 }}>🖥️</div>
                <div className="text-center">
                  <p className="text-lg font-semibold mb-1" style={{ color: "#555577" }}>Briefing → Landing Page em minutos</p>
                  <p className="text-sm mb-1" style={{ color: "#333355" }}>Beatriz cria o copy. A Designer define o visual. Tomás monta tudo.</p>
                  <p className="text-sm" style={{ color: "#B9FF4B", opacity: 0.7 }}>Depois, edite campo a campo com IA no Editor Visual.</p>
                </div>
                <div className="flex gap-4">
                  {ETAPAS.map(e => (
                    <div key={e.id} className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl" style={{ background: "#0E0E18", border: "1px solid #1A1A2A" }}>
                      <e.icon className="w-5 h-5" style={{ color: "#444466" }} />
                      <span className="text-xs font-medium" style={{ color: "#555577" }}>{e.label}</span>
                      <span className="text-[11px]" style={{ color: "#333355" }}>{e.desc}</span>
                    </div>
                  ))}
                  <div className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl" style={{ background: "#0E1A08", border: "1px solid #B9FF4B22" }}>
                    <Wand2 className="w-5 h-5" style={{ color: "#B9FF4B", opacity: 0.7 }} />
                    <span className="text-xs font-medium" style={{ color: "#B9FF4B", opacity: 0.7 }}>Editor</span>
                    <span className="text-[11px]" style={{ color: "#333355" }}>Campo a campo com IA</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Gerando */}
            {gerandoAtivo && !temAlgumConteudo && abaAtiva !== "preview" && (
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

            {/* Preview (also used by editor mode) */}
            {(abaAtiva === "preview" || editorMode) && etapa !== "idle" && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center overflow-auto py-4 relative" style={{ background: "#0D0D16" }}>
                {gerandoAtivo && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium z-10"
                    style={{ background: "#0E1A08", border: "1px solid #B9FF4B55", color: "#B9FF4B" }}>
                    <Loader2 className="w-3 h-3 animate-spin" /> {statusMsg || "Gerando..."}
                  </div>
                )}
                {editorMode && !gerandoAtivo && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium z-10"
                    style={{ background: "#0E1A08", border: "1px solid #B9FF4B33", color: "#B9FF4B", opacity: 0.8 }}>
                    <PanelLeft className="w-3 h-3" /> Clique em qualquer seção para editar
                  </div>
                )}
                {htmlParaExibir ? (
                  <div className="rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
                    style={{ width: previewMobile ? 390 : "95%", maxWidth: previewMobile ? 390 : 1280, border: "1px solid #2A2A3A" }}>
                    <iframe
                      srcDoc={editorMode
                        ? injectEditorScript(htmlParaExibir, selectedSection?.id ?? "")
                        : addEditingToPreview(htmlParaExibir)}
                      className="w-full"
                      style={{ height: "calc(100vh - 10rem)", border: "none" }}
                      title="Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl flex flex-col items-center justify-center gap-4 transition-all duration-300"
                    style={{ width: previewMobile ? 390 : "95%", maxWidth: previewMobile ? 390 : 1280, height: "calc(100vh - 10rem)", border: "1px dashed #2A2A3A", background: "#0A0A14" }}>
                    <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#B9FF4B" }} />
                    <p className="text-sm font-medium" style={{ color: "#B9FF4B" }}>{statusMsg || "Tomás está montando…"}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Copy */}
            {temAlgumConteudo && abaAtiva === "copy" && !editorMode && (
              <motion.div key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-auto p-6">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "#C0C0D0", fontFamily: "inherit", maxWidth: 760 }}>{resultado?.copy || parcial.copy || "Aguardando Beatriz..."}</pre>
              </motion.div>
            )}

            {/* Design */}
            {temAlgumConteudo && abaAtiva === "design" && !editorMode && (
              <motion.div key="design" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-auto p-6">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "#C0C0D0", fontFamily: "inherit", maxWidth: 760 }}>{resultado?.design || parcial.design || "Aguardando Designer..."}</pre>
              </motion.div>
            )}

            {/* HTML */}
            {temAlgumConteudo && abaAtiva === "html" && !editorMode && (
              <motion.div key="html" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-hidden">
                {editandoHtml ? (
                  <textarea className="w-full h-full resize-none p-6 outline-none text-[12px]"
                    style={{ background: "#0A0A0F", color: "#88CC88", fontFamily: "monospace", lineHeight: 1.6 }}
                    value={htmlEditado} onChange={e => setHtmlEditado(e.target.value)} />
                ) : (
                  <div className="h-full overflow-auto p-6">
                    <pre className="whitespace-pre-wrap text-[12px] leading-relaxed" style={{ color: "#88CC88", fontFamily: "monospace" }}>{htmlParaExibir}</pre>
                  </div>
                )}
              </motion.div>
            )}

            {/* Publicar */}
            {resultado && abaAtiva === "publicar" && !editorMode && (
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

                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: "#444466" }}>WordPress</p>
                    {[
                      { label: "URL do site *", val: wpUrl, set: setWpUrl, ph: "https://clientesite.com.br", type: "url" },
                      { label: "Usuário WP *",  val: wpUser, set: setWpUser, ph: "admin", type: "text" },
                      { label: "Senha de Aplicação *", val: wpPassword, set: setWpPassword, ph: "xxxx xxxx xxxx xxxx", type: "password" },
                    ].map(f => (
                      <div key={f.label} className="flex flex-col gap-1 mb-3">
                        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>{f.label}</label>
                        <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                          className="rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                          onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                          onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"} />
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: "#444466" }}>Página</p>
                    <div className="flex gap-3 mb-3">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Título *</label>
                        <input type="text" value={wpTitulo} onChange={e => setWpTitulo(e.target.value)} placeholder="Curso de Marketing"
                          className="rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                          onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                          onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"} />
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Slug (URL) *</label>
                        <input type="text" value={wpSlug} onChange={e => setWpSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))} placeholder="curso-marketing"
                          className="rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                          onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                          onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 mb-3">
                      <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>Template</label>
                      <select value={wpTemplate} onChange={e => setWpTemplate(e.target.value)}
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
                      <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#444466" }}>ID Forminator <span style={{ color: "#333355", fontWeight: 400 }}>(opcional)</span></label>
                      <input type="text" value={forminatorId} onChange={e => setForminatorId(e.target.value)} placeholder="Ex: 42"
                        className="rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                        onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
                        onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"} />
                    </div>
                  </div>

                  <button onClick={publicar} disabled={publicando || !wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold"
                    style={{ background: publicando || !wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo ? "#1E1E2E" : "#B9FF4B", color: publicando || !wpUrl || !wpUser || !wpPassword || !wpSlug || !wpTitulo ? "#444466" : "#07080A" }}>
                    {publicando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    {publicando ? "Publicando..." : paginaPublicada ? "Atualizar página" : "Publicar no site do cliente"}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Barra de comando ao Tomás ── */}
        {temAlgumConteudo && !gerandoAtivo && (
          <div className="flex-shrink-0 px-4 py-2.5 border-t flex items-center gap-3"
            style={{ borderColor: "#1E1E2E", background: "#0A0A10" }}>
            <span className="text-[11px] font-bold flex-shrink-0" style={{ color: "#B9FF4B", opacity: 0.85 }}>🖥️ Tomás</span>
            <input
              type="text"
              value={tomasCmd}
              onChange={e => setTomasCmd(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runTomasCommand(); } }}
              disabled={tomasCmdLoading}
              placeholder={tomasCmdLoading ? "Tomás está aplicando..." : "Peça uma alteração — ex: adiciona FAQ, muda cores para azul, deixa mais urgente..."}
              className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
              style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0", fontFamily: "inherit" }}
              onFocus={e => e.currentTarget.style.borderColor = "#B9FF4B44"}
              onBlur={e => e.currentTarget.style.borderColor = "#2A2A3A"}
            />
            <button
              onClick={runTomasCommand}
              disabled={!tomasCmd.trim() || tomasCmdLoading}
              className="flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
              style={{
                width: 34, height: 34,
                background: tomasCmd.trim() && !tomasCmdLoading ? "#B9FF4B" : "#1E1E2E",
                color: tomasCmd.trim() && !tomasCmdLoading ? "#07080A" : "#444466",
                cursor: tomasCmd.trim() && !tomasCmdLoading ? "pointer" : "not-allowed",
              }}>
              {tomasCmdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── FieldEditor component ─────────────────────────────────────────────────────

interface FieldEditorProps {
  field: ParsedField;
  isAiEditing: boolean;
  isDirectEditing: boolean;
  directEditValue: string;
  aiInstruction: string;
  aiLoading: boolean;
  aiSuggestion: string | null;
  onOpenAiEdit: () => void;
  onCancelAiEdit: () => void;
  onSetInstruction: (v: string) => void;
  onRunAiRewrite: () => void;
  onApplySuggestion: () => void;
  onDiscardSuggestion: () => void;
  onStartDirectEdit: () => void;
  onDirectEditChange: (v: string) => void;
  onConfirmDirectEdit: () => void;
  onCancelDirectEdit: () => void;
  onReplaceImage: (file: File) => void;
}

function FieldEditor({
  field, isAiEditing, isDirectEditing, directEditValue,
  aiInstruction, aiLoading, aiSuggestion,
  onOpenAiEdit, onCancelAiEdit, onSetInstruction, onRunAiRewrite,
  onApplySuggestion, onDiscardSuggestion,
  onStartDirectEdit, onDirectEditChange, onConfirmDirectEdit, onCancelDirectEdit,
  onReplaceImage,
}: FieldEditorProps) {
  const imgInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "#141420", border: "1px solid #1E1E2E" }}>
      {/* Label */}
      <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#555577" }}>{field.label}</p>

      {/* IMAGE FIELD */}
      {field.type === "image" ? (
        <>
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #1E1E2E", background: "#0D0D16" }}>
            <img
              src={field.value}
              alt={field.label}
              className="w-full object-cover"
              style={{ maxHeight: 90, objectFit: "cover" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { onReplaceImage(f); e.target.value = ""; } }} />
          <button
            onClick={() => imgInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all"
            style={{ background: "#B9FF4B15", border: "1px solid #B9FF4B30", color: "#B9FF4B" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#B9FF4B25"; e.currentTarget.style.borderColor = "#B9FF4B60"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#B9FF4B15"; e.currentTarget.style.borderColor = "#B9FF4B30"; }}>
            <ImageIcon className="w-3 h-3" /> Substituir imagem
          </button>
        </>
      ) : (
        <>
          {/* Current value — direct edit or read-only display */}
          {isDirectEditing ? (
            <textarea
              autoFocus
              rows={3}
              className="resize-none rounded-lg px-2.5 py-2 text-xs outline-none w-full"
              style={{ background: "#0D0D16", border: "1px solid #B9FF4B55", color: "#E0E0F0", fontFamily: "inherit", lineHeight: 1.5 }}
              value={directEditValue}
              onChange={e => onDirectEditChange(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onConfirmDirectEdit(); } if (e.key === "Escape") onCancelDirectEdit(); }}
            />
          ) : (
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              {field.value.length > 120 ? field.value.slice(0, 120) + "…" : field.value}
            </p>
          )}

          {/* Direct edit action buttons */}
          {isDirectEditing && (
            <div className="flex gap-2">
              <button onClick={onCancelDirectEdit}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px]"
                style={{ background: "#1E1E2E", color: "#888899" }}>
                <X className="w-3 h-3" /> Cancelar
              </button>
              <button onClick={onConfirmDirectEdit}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ background: "#B9FF4B22", border: "1px solid #B9FF4B55", color: "#B9FF4B" }}>
                <Check className="w-3 h-3" /> Aplicar
              </button>
            </div>
          )}

          {/* Action buttons (when not editing) */}
          {!isDirectEditing && !isAiEditing && (
            <div className="flex gap-1.5">
              <button onClick={onStartDirectEdit}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-all"
                style={{ background: "#1E1E2E", color: "#8888AA" }}
                onMouseEnter={e => e.currentTarget.style.color = "#F0F0F0"}
                onMouseLeave={e => e.currentTarget.style.color = "#8888AA"}>
                <Pencil className="w-3 h-3" /> Editar
              </button>
              <button onClick={onOpenAiEdit}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                style={{ background: "#B9FF4B15", border: "1px solid #B9FF4B30", color: "#B9FF4B" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#B9FF4B25"; e.currentTarget.style.borderColor = "#B9FF4B60"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#B9FF4B15"; e.currentTarget.style.borderColor = "#B9FF4B30"; }}>
                <Sparkles className="w-3 h-3" /> Editar com IA
              </button>
            </div>
          )}
        </>
      )}

      {/* AI Edit mode */}
      {isAiEditing && !aiSuggestion && (
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            type="text"
            placeholder="Ex: mais urgente, mais curto, em inglês..."
            className="rounded-lg px-2.5 py-2 text-xs outline-none"
            style={{ background: "#0D0D16", border: "1px solid #B9FF4B44", color: "#E0E0F0" }}
            value={aiInstruction}
            onChange={e => onSetInstruction(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onRunAiRewrite(); if (e.key === "Escape") onCancelAiEdit(); }}
          />
          <div className="flex gap-2">
            <button onClick={onCancelAiEdit}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px]"
              style={{ background: "#1E1E2E", color: "#888899" }}>
              <X className="w-3 h-3" /> Cancelar
            </button>
            <button onClick={onRunAiRewrite} disabled={aiLoading || !aiInstruction.trim()}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold"
              style={{ background: aiLoading || !aiInstruction.trim() ? "#1E1E2E" : "#B9FF4B", color: aiLoading || !aiInstruction.trim() ? "#444466" : "#07080A" }}>
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {aiLoading ? "Reescrevendo..." : "Reescrever"}
            </button>
          </div>
        </div>
      )}

      {/* AI suggestion preview */}
      {aiSuggestion && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3" style={{ color: "#B9FF4B" }} />
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#B9FF4B" }}>Sugestão da IA</p>
          </div>
          <p className="text-xs leading-relaxed px-2.5 py-2 rounded-lg"
            style={{ background: "#0E1A08", border: "1px solid #B9FF4B22", color: "rgba(255,255,255,0.8)" }}>
            {aiSuggestion}
          </p>
          <div className="flex gap-2">
            <button onClick={onDiscardSuggestion}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px]"
              style={{ background: "#1E1E2E", color: "#888899" }}>
              <X className="w-3 h-3" /> Descartar
            </button>
            <button onClick={onApplySuggestion}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold"
              style={{ background: "#B9FF4B", color: "#07080A" }}>
              <Check className="w-3 h-3" /> Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
