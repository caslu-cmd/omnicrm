import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, X, Layers, PackageCheck } from "lucide-react";

const LIME = "#B9FF4B";

type Template = "overlay" | "split" | "card";
type Ratio = "3:4" | "9:16" | "1:1" | "16:9" | "4:3";

interface PostCanvasProps {
  imageUrl: string;
  brandColor: string;
  clientName?: string;
  initialHeadline?: string;
  initialBody?: string;
  initialCta?: string;
  onClose: () => void;
}

const CANVAS_SIZES: Record<Ratio, [number, number]> = {
  "3:4":  [1080, 1440],
  "9:16": [1080, 1920],
  "1:1":  [1080, 1080],
  "16:9": [1920, 1080],
  "4:3":  [1080,  810],
};

const FORMATS: { ratio: Ratio; label: string; platform: string }[] = [
  { ratio: "3:4",  label: "Feed Portrait",  platform: "Instagram Feed" },
  { ratio: "9:16", label: "Stories / Reels", platform: "Instagram · TikTok" },
  { ratio: "1:1",  label: "Feed Square",    platform: "Instagram · LinkedIn" },
  { ratio: "16:9", label: "Landscape",      platform: "YouTube · Banner" },
];

function previewSize(ratio: Ratio): { w: number; h: number } {
  const [cW, cH] = CANVAS_SIZES[ratio];
  const maxH = 200, maxW = 240;
  const s = Math.min(maxH / cH, maxW / cW);
  return { w: Math.round(cW * s), h: Math.round(cH * s) };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number, maxLines = 4,
): number {
  const words = text.split(" ");
  let line = "", currentY = y, lineCount = 0;
  for (const word of words) {
    if (lineCount >= maxLines) break;
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
      lineCount++;
    } else { line = test; }
  }
  if (line.trim() && lineCount < maxLines) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

export default function PostCanvas({
  imageUrl, brandColor, clientName,
  initialHeadline = "Headline do post",
  initialBody = "Texto secundário aqui",
  initialCta = "Saiba mais →",
  onClose,
}: PostCanvasProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [template, setTemplate] = useState<Template>("overlay");
  const [headline, setHeadline] = useState(initialHeadline);
  const [body, setBody] = useState(initialBody);
  const [cta, setCta] = useState(initialCta);
  const [rendering, setRendering] = useState(false);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);

  const ctaTextColor = isLight(brandColor) ? "#000000" : "#FFFFFF";

  // Pre-load image once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoadedImg(img);
    img.onerror = () => setLoadedImg(null);
    img.src = imageUrl;
  }, [imageUrl]);

  const drawToCanvas = useCallback((canvas: HTMLCanvasElement, cW: number, cH: number, img: HTMLImageElement | null) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = cW;
    canvas.height = cH;

    const pad = Math.round(cW * 0.074);
    const headlineSize = Math.round(cW * 0.062);
    const bodySize = Math.round(cW * 0.034);
    const ctaSize = Math.round(cW * 0.03);

    const drawImg = (clipX = 0, clipY = 0, clipW = cW, clipH = cH) => {
      if (!img?.width) {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(clipX, clipY, clipW, clipH);
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, clipY, clipW, clipH);
      ctx.clip();
      const sc = Math.max(clipW / img.width, clipH / img.height);
      ctx.drawImage(img,
        clipX + (clipW - img.width * sc) / 2,
        clipY + (clipH - img.height * sc) / 2,
        img.width * sc, img.height * sc,
      );
      ctx.restore();
    };

    if (template === "overlay") {
      drawImg();
      const grad = ctx.createLinearGradient(0, cH * 0.38, 0, cH);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.45, "rgba(0,0,0,0.72)");
      grad.addColorStop(1, "rgba(0,0,0,0.94)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cW, cH);
      ctx.fillStyle = brandColor;
      ctx.fillRect(0, 0, cW, Math.round(cH * 0.007));

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${headlineSize}px Inter, sans-serif`;
      ctx.textBaseline = "top";
      let y = wrapText(ctx, headline, pad, cH * 0.58, cW - pad * 2, headlineSize * 1.25, 3);
      y += headlineSize * 0.4;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = `400 ${bodySize}px Inter, sans-serif`;
      y = wrapText(ctx, body, pad, y, cW - pad * 2, bodySize * 1.5, 3);
      if (cta.trim()) {
        const bW = Math.round(ctx.measureText(cta).width + cW * 0.1);
        const bH = Math.round(cH * 0.072);
        const bX = pad, bY = Math.round(cH - bH - cH * 0.06);
        ctx.fillStyle = brandColor;
        roundRect(ctx, bX, bY, bW, bH, bH / 2);
        ctx.fillStyle = ctaTextColor;
        ctx.font = `700 ${ctaSize}px Inter, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(cta, bX + bH * 0.55, bY + bH / 2);
      }
    }

    else if (template === "split") {
      ctx.fillStyle = "#07080A";
      ctx.fillRect(0, 0, cW, cH);
      const isPortrait = cH > cW;

      if (!isPortrait) {
        const half = cW / 2;
        drawImg(half, 0, half, cH);
        const fade = ctx.createLinearGradient(half, 0, half + cW * 0.18, 0);
        fade.addColorStop(0, "#07080A");
        fade.addColorStop(1, "rgba(7,8,10,0)");
        ctx.fillStyle = fade;
        ctx.fillRect(half, 0, cW * 0.2, cH);
        ctx.fillStyle = brandColor;
        ctx.fillRect(0, 0, Math.round(cW * 0.007), cH);
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
          const bX = Math.round(pad * 1.5), bY = Math.round(y + headlineSize * 0.7);
          ctx.fillStyle = brandColor;
          roundRect(ctx, bX, bY, bW, bH, bH / 2);
          ctx.fillStyle = ctaTextColor;
          ctx.font = `700 ${ctaSize}px Inter, sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillText(cta, bX + bH * 0.5, bY + bH / 2);
        }
      } else {
        const imgZone = Math.round(cH * 0.52);
        drawImg(0, 0, cW, imgZone);
        const fade = ctx.createLinearGradient(0, imgZone - cH * 0.1, 0, imgZone + cH * 0.02);
        fade.addColorStop(0, "rgba(7,8,10,0)");
        fade.addColorStop(1, "#07080A");
        ctx.fillStyle = fade;
        ctx.fillRect(0, imgZone - cH * 0.1, cW, cH * 0.12);
        ctx.fillStyle = brandColor;
        ctx.fillRect(0, imgZone, cW, Math.round(cH * 0.006));
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
          const bX = pad, bY = Math.round(cH - bH - cH * 0.05);
          ctx.fillStyle = brandColor;
          roundRect(ctx, bX, bY, bW, bH, bH / 2);
          ctx.fillStyle = ctaTextColor;
          ctx.font = `700 ${ctaSize * 1.1}px Inter, sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillText(cta, bX + bH * 0.55, bY + bH / 2);
        }
      }
    }

    else if (template === "card") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, cW, cH);
      const headerH = Math.round(cH * 0.055);
      ctx.fillStyle = brandColor;
      ctx.fillRect(0, 0, cW, headerH);
      const imgH = Math.round(cH * 0.48);
      drawImg(0, headerH, cW, imgH);
      const imgFade = ctx.createLinearGradient(0, headerH + imgH - imgH * 0.22, 0, headerH + imgH);
      imgFade.addColorStop(0, "rgba(255,255,255,0)");
      imgFade.addColorStop(1, "rgba(255,255,255,0.9)");
      ctx.fillStyle = imgFade;
      ctx.fillRect(0, headerH + imgH - imgH * 0.22, cW, imgH * 0.22);
      const textTop = headerH + imgH + Math.round(cH * 0.025);
      ctx.fillStyle = "#0F1117";
      ctx.font = `700 ${headlineSize}px Inter, sans-serif`;
      ctx.textBaseline = "top";
      let y = wrapText(ctx, headline, pad, textTop, cW - pad * 2, headlineSize * 1.25, 2);
      y += bodySize * 0.5;
      ctx.fillStyle = "#555555";
      ctx.font = `400 ${bodySize}px Inter, sans-serif`;
      y = wrapText(ctx, body, pad, y, cW - pad * 2, bodySize * 1.55, 3);
      if (cta.trim()) {
        const bW = Math.round(ctx.measureText(cta).width + cW * 0.08);
        const bH = Math.round(cH * 0.065);
        const bX = pad, bY = Math.round(cH - bH - cH * 0.05);
        ctx.fillStyle = brandColor;
        roundRect(ctx, bX, bY, bW, bH, Math.round(bH * 0.22));
        ctx.fillStyle = ctaTextColor;
        ctx.font = `700 ${ctaSize}px Inter, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(cta, bX + bH * 0.45, bY + bH / 2);
      }
      if (clientName) {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.font = `500 ${Math.round(cW * 0.022)}px Inter, sans-serif`;
        ctx.textBaseline = "bottom";
        ctx.textAlign = "right";
        ctx.fillText(clientName, cW - pad, cH - Math.round(cH * 0.022));
        ctx.textAlign = "left";
      }
    }
  }, [headline, body, cta, brandColor, template, clientName, ctaTextColor]);

  // Redraw all canvases whenever content or image changes
  useEffect(() => {
    if (loadedImg === undefined) return; // still loading
    setRendering(true);
    FORMATS.forEach((fmt, i) => {
      const canvas = canvasRefs.current[i];
      if (!canvas) return;
      const [cW, cH] = CANVAS_SIZES[fmt.ratio];
      drawToCanvas(canvas, cW, cH, loadedImg);
    });
    setRendering(false);
  }, [drawToCanvas, loadedImg]);

  const downloadFormat = (index: number) => {
    const canvas = canvasRefs.current[index];
    if (!canvas) return;
    const fmt = FORMATS[index];
    const [cW, cH] = CANVAS_SIZES[fmt.ratio];
    const a = document.createElement("a");
    a.download = `${fmt.ratio.replace(":", "x")}-${template}-${Date.now()}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const downloadAll = () => FORMATS.forEach((_, i) => downloadFormat(i));

  const TEMPLATES: { id: Template; label: string }[] = [
    { id: "overlay", label: "Overlay" },
    { id: "split",   label: "Split"   },
    { id: "card",    label: "Card"    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex gap-5 w-full"
        style={{ maxWidth: 1100, maxHeight: "92vh" }}
      >
        {/* ── Left: controls ── */}
        <div
          className="flex flex-col gap-4 flex-shrink-0 overflow-y-auto"
          style={{ width: 260, paddingRight: 4 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: LIME }} />
              <span className="text-sm font-bold" style={{ color: "#F0F0F0" }}>Compositor</span>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
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
            <div className="flex gap-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all"
                  style={{
                    background: template === t.id ? `${brandColor}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${template === t.id ? `${brandColor}60` : "rgba(255,255,255,0.08)"}`,
                    color: template === t.id ? brandColor : "rgba(255,255,255,0.4)",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text fields */}
          {[
            { label: "Headline",    value: headline, set: setHeadline, rows: 2 },
            { label: "Corpo",       value: body,     set: setBody,     rows: 3 },
            { label: "CTA",         value: cta,      set: setCta,      rows: 1 },
          ].map((f) => (
            <div key={f.label}>
              <div className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                style={{ color: "rgba(255,255,255,0.3)" }}>{f.label}</div>
              <textarea
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                rows={f.rows}
                className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#F0F0F0", outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = `${brandColor}50`)}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
              />
            </div>
          ))}

          {/* Download all */}
          <button
            onClick={downloadAll}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold mt-auto transition-all"
            style={{ background: LIME, color: "#07080A", boxShadow: "0 0 24px -4px rgba(185,255,75,0.35)" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            <PackageCheck className="w-4 h-4" />
            Baixar Todos (4 formatos)
          </button>
        </div>

        {/* ── Right: format grid ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ minHeight: "100%" }}>
            {FORMATS.map((fmt, i) => {
              const { w, h } = previewSize(fmt.ratio);
              const [cW, cH] = CANVAS_SIZES[fmt.ratio];
              return (
                <div key={fmt.ratio}
                  className="flex flex-col rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

                  {/* Format label */}
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <div className="text-xs font-bold" style={{ color: "#F0F0F0" }}>{fmt.label}</div>
                      <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {fmt.platform} · {cW}×{cH}px
                      </div>
                    </div>
                    <div className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                      style={{ background: `${brandColor}18`, color: brandColor }}>
                      {fmt.ratio}
                    </div>
                  </div>

                  {/* Canvas preview */}
                  <div className="flex flex-col items-center justify-center py-3 px-3 gap-3"
                    style={{ background: "rgba(0,0,0,0.3)", flex: 1 }}>
                    <div className="relative rounded-lg overflow-hidden"
                      style={{ width: w, height: h, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
                      <canvas
                        ref={(el) => { canvasRefs.current[i] = el; }}
                        style={{ width: w, height: h, display: "block" }}
                      />
                      {rendering && (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: "rgba(0,0,0,0.45)" }}>
                          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: `${LIME} transparent transparent transparent` }} />
                        </div>
                      )}
                    </div>

                    {/* Per-format download */}
                    <button
                      onClick={() => downloadFormat(i)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.7)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${brandColor}20`;
                        e.currentTarget.style.borderColor = `${brandColor}50`;
                        e.currentTarget.style.color = brandColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                      }}>
                      <Download className="w-3 h-3" />
                      Baixar {cW}×{cH}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
