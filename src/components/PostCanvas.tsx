import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Layers } from "lucide-react";

const LIME = "#B9FF4B";

type Template = "overlay" | "split" | "card";
type Ratio = "4:5" | "1:1" | "9:16" | "16:9" | "4:3" | "3:4";

interface PostCanvasProps {
  imageUrl: string;
  brandColor: string;
  clientName?: string;
  aspectRatio?: string;
  initialHeadline?: string;
  initialBody?: string;
  initialCta?: string;
  onClose: () => void;
}

const CANVAS_SIZES: Record<Ratio, [number, number]> = {
  "4:5":  [1080, 1350],
  "1:1":  [1080, 1080],
  "9:16": [1080, 1920],
  "16:9": [1920, 1080],
  "4:3":  [1080, 810],
  "3:4":  [1080, 1440],
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  let lineCount = 0;
  for (const word of words) {
    if (lineCount >= maxLines) break;
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
      lineCount++;
    } else {
      line = test;
    }
  }
  if (line.trim() && lineCount < maxLines) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function isLight(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

export default function PostCanvas({
  imageUrl, brandColor, clientName, aspectRatio = "1:1",
  initialHeadline = "Headline do post", initialBody = "Texto secundário aqui",
  initialCta = "Saiba mais →",
  onClose,
}: PostCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<Template>("overlay");
  const [headline, setHeadline] = useState(initialHeadline);
  const [body, setBody] = useState(initialBody);
  const [cta, setCta] = useState(initialCta);
  const [rendering, setRendering] = useState(false);

  const ratio = (Object.keys(CANVAS_SIZES).includes(aspectRatio) ? aspectRatio : "4:5") as Ratio;
  const [cW, cH] = CANVAS_SIZES[ratio];

  const maxW = 420;
  const maxH = 620;
  const scale = Math.min(maxW / cW, maxH / cH);
  const displayW = Math.round(cW * scale);
  const displayH = Math.round(cH * scale);

  const ctaTextColor = isLight(brandColor) ? "#000000" : "#FFFFFF";

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = cW;
    canvas.height = cH;
    setRendering(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res) => {
      img.onload = () => res();
      img.onerror = () => res();
      img.src = imageUrl;
    });

    const pad = Math.round(cW * 0.074);
    const headlineSize = Math.round(cW * 0.062);
    const bodySize = Math.round(cW * 0.034);
    const ctaSize = Math.round(cW * 0.03);

    // ── TEMPLATE: OVERLAY ────────────────────────────────────────
    if (template === "overlay") {
      // Background image full bleed
      if (img.width) {
        const scale = Math.max(cW / img.width, cH / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        ctx.drawImage(img, (cW - sw) / 2, (cH - sh) / 2, sw, sh);
      } else {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, cW, cH);
      }

      // Dark gradient overlay — bottom 55%
      const grad = ctx.createLinearGradient(0, cH * 0.38, 0, cH);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.45, "rgba(0,0,0,0.72)");
      grad.addColorStop(1, "rgba(0,0,0,0.94)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cW, cH);

      // Brand accent bar top
      ctx.fillStyle = brandColor;
      ctx.fillRect(0, 0, cW, Math.round(cH * 0.007));

      // Headline
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${headlineSize}px Inter, sans-serif`;
      ctx.textBaseline = "top";
      let y = wrapText(ctx, headline, pad, cH * 0.6, cW - pad * 2, headlineSize * 1.25, 3);

      // Body
      y += headlineSize * 0.4;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = `400 ${bodySize}px Inter, sans-serif`;
      y = wrapText(ctx, body, pad, y, cW - pad * 2, bodySize * 1.5, 3);

      // CTA pill
      if (cta.trim()) {
        const bW = Math.round(ctx.measureText(cta).width + cW * 0.1);
        const bH = Math.round(cH * 0.072);
        const bX = pad;
        const bY = Math.round(cH - bH - cH * 0.06);
        ctx.fillStyle = brandColor;
        roundRect(ctx, bX, bY, bW, bH, bH / 2);
        ctx.fillStyle = ctaTextColor;
        ctx.font = `700 ${ctaSize}px Inter, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(cta, bX + bH * 0.55, bY + bH / 2);
      }
    }

    // ── TEMPLATE: SPLIT ──────────────────────────────────────────
    else if (template === "split") {
      ctx.fillStyle = "#07080A";
      ctx.fillRect(0, 0, cW, cH);

      const isPortrait = cH > cW;

      if (!isPortrait) {
        // Landscape: image fills right half
        if (img.width) {
          const half = cW / 2;
          ctx.save();
          ctx.beginPath();
          ctx.rect(half, 0, half, cH);
          ctx.clip();
          const sc = Math.max(half / img.width, cH / img.height);
          ctx.drawImage(img, half + (half - img.width * sc) / 2, (cH - img.height * sc) / 2, img.width * sc, img.height * sc);
          ctx.restore();
          // Fade edge
          const fade = ctx.createLinearGradient(half, 0, half + cW * 0.18, 0);
          fade.addColorStop(0, "#07080A");
          fade.addColorStop(1, "rgba(7,8,10,0)");
          ctx.fillStyle = fade;
          ctx.fillRect(half, 0, cW * 0.2, cH);
        }
        // Brand accent left bar
        ctx.fillStyle = brandColor;
        ctx.fillRect(0, 0, Math.round(cW * 0.007), cH);
        // Text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 ${headlineSize}px Inter, sans-serif`;
        ctx.textBaseline = "top";
        let y = wrapText(ctx, headline, pad * 1.5, cH * 0.28, cW * 0.44, headlineSize * 1.25, 3);
        y += headlineSize * 0.45;
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = `400 ${bodySize}px Inter, sans-serif`;
        y = wrapText(ctx, body, pad * 1.5, y, cW * 0.42, bodySize * 1.5, 4);
        if (cta.trim()) {
          const bW = Math.round(ctx.measureText(cta).width + cW * 0.07);
          const bH = Math.round(cH * 0.072);
          const bX = Math.round(pad * 1.5);
          const bY = Math.round(y + headlineSize * 0.7);
          ctx.fillStyle = brandColor;
          roundRect(ctx, bX, bY, bW, bH, bH / 2);
          ctx.fillStyle = ctaTextColor;
          ctx.font = `700 ${ctaSize}px Inter, sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillText(cta, bX + bH * 0.5, bY + bH / 2);
        }
      } else {
        // Portrait: image top 52%
        const imgZone = Math.round(cH * 0.52);
        if (img.width) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, cW, imgZone);
          ctx.clip();
          const sc = Math.max(cW / img.width, imgZone / img.height);
          ctx.drawImage(img, (cW - img.width * sc) / 2, (imgZone - img.height * sc) / 2, img.width * sc, img.height * sc);
          ctx.restore();
        }
        // Fade bottom of image
        const fade = ctx.createLinearGradient(0, imgZone - cH * 0.1, 0, imgZone + cH * 0.02);
        fade.addColorStop(0, "rgba(7,8,10,0)");
        fade.addColorStop(1, "#07080A");
        ctx.fillStyle = fade;
        ctx.fillRect(0, imgZone - cH * 0.1, cW, cH * 0.12);
        // Brand stripe
        ctx.fillStyle = brandColor;
        ctx.fillRect(0, imgZone, cW, Math.round(cH * 0.006));
        // Text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 ${headlineSize * 1.1}px Inter, sans-serif`;
        ctx.textBaseline = "top";
        let y = wrapText(ctx, headline, pad, imgZone + pad * 0.8, cW - pad * 2, headlineSize * 1.3, 3);
        y += bodySize * 0.8;
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = `400 ${bodySize * 1.1}px Inter, sans-serif`;
        y = wrapText(ctx, body, pad, y, cW - pad * 2, bodySize * 1.55, 4);
        if (cta.trim()) {
          const bW = Math.round(ctx.measureText(cta).width + cW * 0.1);
          const bH = Math.round(cH * 0.068);
          const bX = pad;
          const bY = Math.round(cH - bH - cH * 0.05);
          ctx.fillStyle = brandColor;
          roundRect(ctx, bX, bY, bW, bH, bH / 2);
          ctx.fillStyle = ctaTextColor;
          ctx.font = `700 ${ctaSize * 1.1}px Inter, sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillText(cta, bX + bH * 0.55, bY + bH / 2);
        }
      }
    }

    // ── TEMPLATE: CARD ───────────────────────────────────────────
    else if (template === "card") {
      // White background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, cW, cH);

      // Brand color header
      const headerH = Math.round(cH * 0.055);
      ctx.fillStyle = brandColor;
      ctx.fillRect(0, 0, cW, headerH);

      // Image zone
      const imgTop = headerH;
      const imgH = Math.round(cH * 0.48);
      if (img.width) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, imgTop, cW, imgH);
        ctx.clip();
        const sc = Math.max(cW / img.width, imgH / img.height);
        ctx.drawImage(img, (cW - img.width * sc) / 2, imgTop + (imgH - img.height * sc) / 2, img.width * sc, img.height * sc);
        ctx.restore();
      }
      // Bottom shadow on image
      const imgFade = ctx.createLinearGradient(0, imgTop + imgH - imgH * 0.22, 0, imgTop + imgH);
      imgFade.addColorStop(0, "rgba(255,255,255,0)");
      imgFade.addColorStop(1, "rgba(255,255,255,0.9)");
      ctx.fillStyle = imgFade;
      ctx.fillRect(0, imgTop + imgH - imgH * 0.22, cW, imgH * 0.22);

      // Text area
      const textTop = imgTop + imgH + Math.round(cH * 0.025);
      ctx.fillStyle = "#0F1117";
      ctx.font = `700 ${headlineSize}px Inter, sans-serif`;
      ctx.textBaseline = "top";
      let y = wrapText(ctx, headline, pad, textTop, cW - pad * 2, headlineSize * 1.25, 2);
      y += bodySize * 0.5;
      ctx.fillStyle = "#555555";
      ctx.font = `400 ${bodySize}px Inter, sans-serif`;
      y = wrapText(ctx, body, pad, y, cW - pad * 2, bodySize * 1.55, 3);

      // CTA
      if (cta.trim()) {
        const bW = Math.round(ctx.measureText(cta).width + cW * 0.08);
        const bH = Math.round(cH * 0.065);
        const bX = pad;
        const bY = Math.round(cH - bH - cH * 0.05);
        ctx.fillStyle = brandColor;
        roundRect(ctx, bX, bY, bW, bH, Math.round(bH * 0.22));
        ctx.fillStyle = ctaTextColor;
        ctx.font = `700 ${ctaSize}px Inter, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(cta, bX + bH * 0.45, bY + bH / 2);
      }

      // Client name watermark
      if (clientName) {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.font = `500 ${Math.round(cW * 0.022)}px Inter, sans-serif`;
        ctx.textBaseline = "bottom";
        ctx.textAlign = "right";
        ctx.fillText(clientName, cW - pad, cH - Math.round(cH * 0.022));
        ctx.textAlign = "left";
      }
    }

    setRendering(false);
  }, [imageUrl, headline, body, cta, brandColor, template, cW, cH, clientName, ctaTextColor]);

  useEffect(() => { draw(); }, [draw]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `post-${template}-${ratio.replace(":", "x")}-${Date.now()}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const TEMPLATES: { id: Template; label: string; hint: string }[] = [
    { id: "overlay", label: "Overlay",  hint: "Imagem full + texto sobre" },
    { id: "split",   label: "Split",    hint: "Imagem + área de texto" },
    { id: "card",    label: "Card",     hint: "Layout editorial limpo" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex gap-6 w-full"
        style={{ maxWidth: 860, maxHeight: "90vh" }}
      >
        {/* Preview canvas */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          <div className="relative rounded-xl overflow-hidden"
            style={{ width: displayW, height: displayH, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <canvas
              ref={canvasRef}
              style={{ width: displayW, height: displayH, display: "block" }}
            />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}>
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: `${LIME} transparent transparent transparent` }} />
              </div>
            )}
          </div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            {cW} × {cH}px · {ratio} · {TEMPLATES.find(t => t.id === template)?.label}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: LIME }} />
              <span className="text-sm font-bold" style={{ color: "#F0F0F0" }}>Compositor de Post</span>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
              <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
          </div>

          {/* Templates */}
          <div>
            <div className="text-[10px] uppercase tracking-widest font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.3)" }}>Template</div>
            <div className="flex gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className="flex-1 py-2 px-2 rounded-xl text-[11px] font-semibold transition-all"
                  style={{
                    background: template === t.id ? `${brandColor}18` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${template === t.id ? `${brandColor}50` : "rgba(255,255,255,0.08)"}`,
                    color: template === t.id ? brandColor : "rgba(255,255,255,0.4)",
                  }}>
                  {t.label}
                  <div className="text-[9px] font-normal mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{t.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Text fields */}
          {[
            { label: "Headline",     value: headline, set: setHeadline, rows: 2, hint: "Título principal, impactante" },
            { label: "Corpo",        value: body,     set: setBody,     rows: 3, hint: "Texto de apoio" },
            { label: "CTA (botão)",  value: cta,      set: setCta,      rows: 1, hint: "Ex: Saiba mais →" },
          ].map((f) => (
            <div key={f.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: "rgba(255,255,255,0.3)" }}>{f.label}</span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>{f.hint}</span>
              </div>
              <textarea
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                onBlur={draw}
                rows={f.rows}
                className="w-full rounded-xl px-3 py-2.5 text-sm resize-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#F0F0F0",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = `${brandColor}50`)}
              />
            </div>
          ))}

          {/* Download */}
          <button
            onClick={download}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold mt-auto transition-all"
            style={{ background: LIME, color: "#07080A", boxShadow: "0 0 24px -4px rgba(185,255,75,0.4)" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            <Download className="w-4 h-4" />
            Baixar PNG — {cW}×{cH}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
