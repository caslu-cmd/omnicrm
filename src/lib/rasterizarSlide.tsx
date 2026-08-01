/**
 * Transforma um slide HTML em PNG 1080×1350 — a ponte entre o motor novo e
 * tudo que já existe (baixar, ZIP, agendar, publicar).
 *
 * Renderiza fora da tela num container próprio em vez de fotografar o preview:
 * o preview vive escalado para caber no monitor, e fotografar ele devolveria
 * uma imagem menor e borrada.
 */
import { createRoot } from "react-dom/client";
import { toBlob } from "html-to-image";
import SlideHtml, { type SlideHtmlProps } from "@/components/SlideHtml";
import { FORMAT_SIZE } from "@/lib/carouselRender";

/**
 * O CSS das fontes, embutido como data URI.
 *
 * O rasterizador desenha o HTML dentro de um SVG, e SVG não busca fonte em
 * servidor externo: sem embutir, a peça sai na fonte padrão do sistema — o
 * defeito mais fácil de não perceber, porque a prévia na tela fica CERTA.
 * Buscar isso custa segundos, então guarda uma vez por sessão.
 */
let cssDeFontes: string | null = null;

async function fontesEmbutidas(): Promise<string> {
  if (cssDeFontes !== null) return cssDeFontes;
  const folhas = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    .map((l) => l.href)
    .filter((h) => /fonts\.googleapis\.com/.test(h));

  const partes: string[] = [];
  for (const url of folhas) {
    try {
      const css = await (await fetch(url)).text();
      // Cada @font-face aponta para um .woff2 remoto; troca cada um pelo
      // conteúdo em base64.
      const urls = [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((m) => m[1]);
      let resolvido = css;
      await Promise.all(urls.map(async (u) => {
        try {
          const buf = await (await fetch(u)).arrayBuffer();
          let bin = "";
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.length; i += 8192) {
            bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
          }
          resolvido = resolvido.replace(u, `data:font/woff2;base64,${btoa(bin)}`);
        } catch { /* fonte que não baixa fica como está; o resto continua */ }
      }));
      partes.push(resolvido);
    } catch { /* folha inacessível é ignorada */ }
  }
  cssDeFontes = partes.join("\n");
  return cssDeFontes;
}

/** Espera imagens e fontes antes de fotografar, senão a peça sai pela metade. */
async function esperarPronto(el: HTMLElement) {
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(imgs.map((img) =>
    img.complete
      ? Promise.resolve()
      : new Promise<void>((r) => {
          img.addEventListener("load", () => r(), { once: true });
          // Imagem que não carrega não pode travar a exportação inteira.
          img.addEventListener("error", () => r(), { once: true });
          setTimeout(r, 8000);
        }),
  ));
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

export async function rasterizarSlide(props: SlideHtmlProps): Promise<Blob | null> {
  const [W, H] = FORMAT_SIZE[props.format];
  const container = document.createElement("div");
  // Fora da tela, mas RENDERIZADO: `display:none` faria o navegador não calcular
  // layout nenhum e a peça sairia vazia.
  container.style.cssText = `position:fixed;left:-99999px;top:0;width:${W}px;height:${H}px;`;
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    await new Promise<void>((resolve) => {
      root.render(<SlideHtml {...props} />);
      requestAnimationFrame(() => resolve());
    });
    const el = container.firstElementChild as HTMLElement | null;
    if (!el) return null;
    await esperarPronto(el);

    return await toBlob(el, {
      width: W,
      height: H,
      pixelRatio: 1,
      cacheBust: false,
      fontEmbedCSS: await fontesEmbutidas(),
      skipAutoScale: true,
    });
  } finally {
    // Desmontar fora do ciclo de render do React, senão ele avisa que está
    // sincronizando durante uma renderização.
    setTimeout(() => { root.unmount(); container.remove(); }, 0);
  }
}
