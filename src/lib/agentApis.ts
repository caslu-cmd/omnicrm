// Endereços dos agentes que rodam fora do Supabase (serviços Python).
//
// Eles nasceram apontando para localhost, o que funciona na máquina da agência
// e falha em silêncio para qualquer outra pessoa no app publicado. Aqui a URL
// vem de variável de ambiente e, quando não existe, a tela avisa que o agente
// ainda não está publicado em vez de tentar um endereço que ninguém alcança.

function readApi(value: unknown): string | null {
  const url = typeof value === "string" ? value.trim().replace(/\/$/, "") : "";
  return url.length > 0 ? url : null;
}

/** Pixel — WordPress (sites, posts, SEO) */
export const PIXEL_API = readApi(import.meta.env.VITE_PIXEL_API_URL);

/** Apolo — geração de apostilas */
export const APOLO_API = readApi(import.meta.env.VITE_APOLO_API_URL);

/** Bobby — editor de vídeo */
export const BOBBY_API = readApi(import.meta.env.VITE_BOBBY_API_URL);

export const AGENT_OFFLINE_MSG =
  "Este agente ainda não está publicado. Ele roda como serviço próprio (Python) e " +
  "precisa de uma URL configurada para funcionar fora da máquina da agência.";
