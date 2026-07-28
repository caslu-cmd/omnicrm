// Consentimento de cookies (LGPD, Lei 13.709/2018).
//
// A plataforma não usa rastreadores de terceiros hoje: o que existe é
// armazenamento essencial (sessão do Supabase) e preferências locais
// (identidade visual, rascunhos, painéis abertos). O banner registra a
// escolha do titular e as telas consultam esta biblioteca antes de guardar
// qualquer coisa que não seja essencial.

export type CategoriaCookie = "essenciais" | "preferencias" | "analise";

export type Consentimento = {
  essenciais: true; // sempre ativos: sem eles não há login
  preferencias: boolean;
  analise: boolean;
  versao: number;
  decididoEm: string;
};

const CHAVE = "calu-consentimento-cookies";
export const VERSAO_POLITICA = 1;

export function lerConsentimento(): Consentimento | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const c = JSON.parse(bruto) as Consentimento;
    // Política nova exige nova decisão.
    if (c.versao !== VERSAO_POLITICA) return null;
    return c;
  } catch {
    return null;
  }
}

export function salvarConsentimento(escolha: { preferencias: boolean; analise: boolean }) {
  const c: Consentimento = {
    essenciais: true,
    preferencias: escolha.preferencias,
    analise: escolha.analise,
    versao: VERSAO_POLITICA,
    decididoEm: new Date().toISOString(),
  };
  localStorage.setItem(CHAVE, JSON.stringify(c));
  window.dispatchEvent(new CustomEvent("calu-consentimento", { detail: c }));
  return c;
}

export function revogarConsentimento() {
  localStorage.removeItem(CHAVE);
  window.dispatchEvent(new CustomEvent("calu-consentimento", { detail: null }));
}

/** Pergunte antes de gravar preferência local que não seja essencial. */
export function podeUsar(categoria: CategoriaCookie): boolean {
  if (categoria === "essenciais") return true;
  const c = lerConsentimento();
  if (!c) return false;
  return categoria === "preferencias" ? c.preferencias : c.analise;
}
