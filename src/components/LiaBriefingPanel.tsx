import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Download, RefreshCw, X, CheckCircle2, Users, Paperclip, ClipboardPaste, Send, MessageSquare } from "lucide-react";

const LIA_COLOR = "#38BDF8";
const CALU_GREEN = "#B9FF4B";

interface BriefingData {
  empresa: string;
  segmento: string;
  tempoMercado: string;
  produtos: string;
  faturamento: string;
  clienteIdeal: string;
  faixaEtaria: string;
  canaisPublico: string[];
  dorPrincipal: string;
  concorrentes: string;
  diferencial: string;
  posicaoMercado: string;
  canaisAtivos: string[];
  frequencia: string;
  trafegoPago: string;
  budgetTrafego: string;
  preocupacoes: string;
  meta90dias: string;
  prazoResultados: string;
  jaTentou: string;
  budgetMarketing: string;
}

const EMPTY: BriefingData = {
  empresa: "", segmento: "", tempoMercado: "", produtos: "", faturamento: "",
  clienteIdeal: "", faixaEtaria: "", canaisPublico: [], dorPrincipal: "",
  concorrentes: "", diferencial: "", posicaoMercado: "",
  canaisAtivos: [], frequencia: "", trafegoPago: "", budgetTrafego: "", preocupacoes: "",
  meta90dias: "", prazoResultados: "", jaTentou: "", budgetMarketing: "",
};

const STEPS = ["Empresa", "Público", "Concorrência", "Marketing Atual", "Objetivos"];

const CANAIS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "WhatsApp", "YouTube", "Google", "E-mail", "Site/Blog"];

const toggleArr = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

function CheckRow({ label, checked, onChange, color }: { label: string; checked: boolean; onChange: () => void; color: string }) {
  return (
    <button type="button" onClick={onChange}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all"
      style={{
        background: checked ? `${color}18` : "rgba(255,255,255,0.04)",
        border: `1px solid ${checked ? `${color}40` : "rgba(255,255,255,0.08)"}`,
        color: checked ? color : "rgba(255,255,255,0.5)",
      }}>
      <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: checked ? color : "rgba(255,255,255,0.08)", border: checked ? "none" : "1px solid rgba(255,255,255,0.15)" }}>
        {checked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#07080A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      {label}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
      {children}
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors";
const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: `1px solid rgba(56,189,248,0.2)`,
  color: "#F0F0F0",
};
const inputFocusStyle = { borderColor: "rgba(56,189,248,0.5)", background: "rgba(56,189,248,0.05)" };

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={inputCls} style={inputStyle}
      onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
      onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className={`${inputCls} resize-none`} style={inputStyle}
      onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
      onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={inputCls} style={{ ...inputStyle, cursor: "pointer" }}>
      <option value="">Selecione...</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function buildDiagnosisPrompt(b: BriefingData, clientName: string): string {
  return `Você recebeu o BRIEFING COMPLETO de um cliente. Gere um DIAGNÓSTICO DE MARKETING profundo e personalizado.

=== BRIEFING DO CLIENTE ===
Empresa: ${clientName || b.empresa}
Segmento: ${b.segmento}
Tempo de mercado: ${b.tempoMercado}
Produtos/Serviços: ${b.produtos}
Faturamento mensal: ${b.faturamento}

Público-alvo: ${b.clienteIdeal}
Faixa etária: ${b.faixaEtaria}
Canais do público: ${b.canaisPublico.join(", ")}
Dor principal que resolve: ${b.dorPrincipal}

Concorrentes: ${b.concorrentes}
Diferencial: ${b.diferencial}
Posição no mercado: ${b.posicaoMercado}

Canais de marketing ativos: ${b.canaisAtivos.join(", ")}
Frequência de postagem: ${b.frequencia}
Tráfego pago: ${b.trafegoPago}${b.budgetTrafego ? ` (budget: ${b.budgetTrafego})` : ""}
Preocupações atuais: ${b.preocupacoes}

Meta 90 dias: ${b.meta90dias}
Prazo para resultados: ${b.prazoResultados}
O que já tentou sem sucesso: ${b.jaTentou}
Investimento disponível: ${b.budgetMarketing}

=== ENTREGUE O DIAGNÓSTICO COMPLETO ===

# Diagnóstico de Marketing — ${clientName || b.empresa}
*(Elaborado pela Calu Agência)*

## 1. Diagnóstico Executivo
*(3 bullets com os pontos mais críticos e urgentes)*

## 2. Análise SWOT de Marketing
*(Forças, Fraquezas, Oportunidades, Ameaças — específicas para marketing deste negócio)*

## 3. Análise do Funil Atual
*(Onde está captando, onde está perdendo leads, onde precisa melhorar)*

## 4. Benchmarks do Setor
*(Métricas médias do segmento ${b.segmento}: taxa de engajamento, CPL, ticket médio, crescimento esperado)*

## 5. Top 3 Alavancas de ROI Imediato
*(As 3 ações que mais vão impactar o resultado nos próximos 30 dias — com estimativa de impacto)*

## 6. Roadmap de 90 Dias
*(Semana 1-4: fundação | Semana 5-8: crescimento | Semana 9-12: escala — ações concretas em cada fase)*

## 7. Serviços Recomendados
*(Quais serviços da Calu Agência são prioritários para este cliente — justificando cada um)*

## 8. Checklist de Onboarding
*(Os primeiros 10 itens que precisam ser definidos/entregues nas primeiras 2 semanas)*

Seja profundo, específico e acionável. Use os dados do briefing para personalizar cada seção. Não use respostas genéricas. Português brasileiro.`;
}

function generatePdfHtml(diagnosisText: string, clientName: string, briefingData: BriefingData): string {
  const date = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const mdToHtml = (text: string) => {
    return text
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^• (.+)$/gm, '<li>$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li><span class="num">$1.</span> $2</li>')
      .replace(/(<li>[\s\S]*?<\/li>)(\n(?!<li>))/g, '<ul>$1</ul>$2')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Diagnóstico de Marketing — ${clientName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #07080A;
    color: #E8E8E8;
    font-size: 13px;
    line-height: 1.7;
    padding: 0;
  }

  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 48px 48px;
    min-height: 100vh;
  }

  /* Header */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 32px;
    border-bottom: 2px solid #B9FF4B;
    margin-bottom: 40px;
  }

  .logo-block .logo {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #FFFFFF;
  }
  .logo-block .logo span { color: #B9FF4B; }
  .logo-block .tagline {
    font-size: 10px;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 3px;
  }

  .doc-meta { text-align: right; }
  .doc-meta .doc-title {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  .doc-meta .doc-client {
    font-size: 16px;
    font-weight: 700;
    color: #FFFFFF;
    margin-top: 4px;
  }
  .doc-meta .doc-date {
    font-size: 10px;
    color: rgba(255,255,255,0.3);
    margin-top: 2px;
  }

  /* Briefing summary bar */
  .briefing-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 40px;
  }
  .briefing-item {
    background: rgba(185,255,75,0.06);
    border: 1px solid rgba(185,255,75,0.15);
    border-radius: 12px;
    padding: 12px 14px;
  }
  .briefing-item .bi-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: rgba(185,255,75,0.5);
    margin-bottom: 4px;
  }
  .briefing-item .bi-value {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.85);
  }

  /* Content */
  .content h1 {
    font-size: 22px;
    font-weight: 800;
    color: #FFFFFF;
    margin-bottom: 6px;
    display: none;
  }
  .content h2 {
    font-size: 13px;
    font-weight: 700;
    color: #B9FF4B;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 32px 0 12px;
    padding: 10px 16px;
    background: rgba(185,255,75,0.06);
    border-left: 3px solid #B9FF4B;
    border-radius: 0 8px 8px 0;
  }
  .content p {
    color: rgba(255,255,255,0.78);
    margin-bottom: 10px;
    font-size: 13px;
  }
  .content ul { padding-left: 0; list-style: none; }
  .content li {
    position: relative;
    padding-left: 16px;
    margin-bottom: 6px;
    color: rgba(255,255,255,0.75);
    font-size: 13px;
  }
  .content li::before {
    content: '▸';
    position: absolute;
    left: 0;
    color: #B9FF4B;
    font-size: 10px;
    top: 3px;
  }
  .content li .num {
    color: #B9FF4B;
    font-weight: 700;
    margin-right: 4px;
  }
  .content strong { color: #FFFFFF; font-weight: 600; }
  .content em { color: rgba(255,255,255,0.5); font-style: italic; }

  /* Footer */
  .footer {
    margin-top: 60px;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer .ft-brand {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.3);
  }
  .footer .ft-brand span { color: #B9FF4B; }
  .footer .ft-note {
    font-size: 10px;
    color: rgba(255,255,255,0.2);
  }

  /* Print overrides */
  @media print {
    body { background: #07080A !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 32px 40px; }
    .no-print { display: none; }
  }

  /* Print button */
  .print-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #B9FF4B;
    color: #07080A;
    border: none;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    z-index: 100;
  }
  @media print { .print-btn { display: none; } }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">⬇ Salvar como PDF</button>
<div class="page">
  <div class="header">
    <div class="logo-block">
      <div class="logo">Calu<span>.</span></div>
      <div class="tagline">Agência de Marketing Digital</div>
    </div>
    <div class="doc-meta">
      <div class="doc-title">Diagnóstico de Marketing</div>
      <div class="doc-client">${clientName}</div>
      <div class="doc-date">${date}</div>
    </div>
  </div>

  <div class="briefing-bar">
    <div class="briefing-item">
      <div class="bi-label">Segmento</div>
      <div class="bi-value">${briefingData.segmento || "—"}</div>
    </div>
    <div class="briefing-item">
      <div class="bi-label">Mercado</div>
      <div class="bi-value">${briefingData.tempoMercado || "—"}</div>
    </div>
    <div class="briefing-item">
      <div class="bi-label">Faturamento</div>
      <div class="bi-value">${briefingData.faturamento || "—"}</div>
    </div>
    <div class="briefing-item">
      <div class="bi-label">Budget Mkt</div>
      <div class="bi-value">${briefingData.budgetMarketing || "—"}</div>
    </div>
  </div>

  <div class="content">
    ${mdToHtml(diagnosisText)}
  </div>

  <div class="footer">
    <div class="ft-brand">Calu<span>.</span> Agência de Marketing Digital</div>
    <div class="ft-note">Diagnóstico confidencial — gerado com IA Especializada</div>
  </div>
</div>
</body>
</html>`;
}

const PANEL_AGENTS = [
  { id: "queila",  name: "Queila",  role: "Estrategista",  color: "#FBBF24", initial: "Q",  specialty: "estratégia de marketing, posicionamento e crescimento de negócios" },
  { id: "beatriz", name: "Beatriz", role: "Copywriter",    color: "#A78BFA", initial: "B",  specialty: "copywriting, criação de conteúdo persuasivo e tom de voz de marca" },
  { id: "marina",  name: "Marina",  role: "Social Media",  color: "#60A5FA", initial: "M",  specialty: "gestão de redes sociais, calendário editorial e crescimento orgânico" },
  { id: "rafaela", name: "Rafaela", role: "Tráfego Pago",  color: "#F97316", initial: "R",  specialty: "tráfego pago, performance digital e otimização de campanhas" },
  { id: "laura",   name: "Laura",   role: "Diretora",      color: "#B9FF4B", initial: "La", specialty: "estratégia global de marketing, integração de canais e visão executiva" },
];

interface Props {
  clientId: string;
  clientName: string;
  clientIndustry: string;
  onClose: () => void;
  onBriefingSaved?: (data: BriefingData) => void;
}

export default function LiaBriefingPanel({ clientId, clientName, clientIndustry, onClose, onBriefingSaved }: Props) {
  const [mode, setMode] = useState<"form" | "paste">("form");
  const [pasteText, setPasteText] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const pasteFileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BriefingData>({ ...EMPTY, empresa: clientName, segmento: clientIndustry });
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consultingTeam, setConsultingTeam] = useState(false);
  const [teamProposed, setTeamProposed] = useState(false);
  const [panelView, setPanelView] = useState<"diagnosis" | "pick" | "chat">("diagnosis");
  const [pickedPanelAgent, setPickedPanelAgent] = useState<typeof PANEL_AGENTS[0] | null>(null);
  const [panelChatHistory, setPanelChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [panelChatInput, setPanelChatInput] = useState("");
  const [panelChatLoading, setPanelChatLoading] = useState(false);
  const panelChatEndRef = useRef<HTMLDivElement>(null);
  const panelChatInputRef = useRef<HTMLInputElement>(null);

  const handlePasteFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPasteText((prev) => (prev ? prev + "\n\n" : "") + (ev.target?.result as string ?? ""));
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  const generateFromPaste = async () => {
    if (!pasteText.trim()) return;
    setPasteLoading(true);
    setPasteError(null);
    try {
      const prompt = `Você recebeu o briefing completo do cliente "${clientName}". Analise todo o conteúdo e gere um diagnóstico estratégico de marketing detalhado.

BRIEFING RECEBIDO:
${pasteText}

Com base neste briefing, gere agora o diagnóstico completo em markdown, seguindo o mesmo formato de qualquer diagnóstico profissional de marketing: resumo executivo, análise do cenário atual, oportunidades, pontos críticos, recomendações estratégicas e plano de ação para 90 dias.`;
      const { data: res, error: err } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt: `Você é LIA, Agente de Diagnóstico da Calu Agência. Especialista em análise de marketing, onboarding e diagnóstico estratégico para negócios brasileiros. Entregue diagnósticos profundos, concretos e acionáveis. Português brasileiro.`,
          maxTokens: 12000,
          enableThinking: true,
          thinkingBudget: 8000,
          messages: [{ role: "user", content: prompt }],
        },
      });
      if (err) throw err;
      const diagnosisText = res?.content ?? "";
      setDiagnosis(diagnosisText);
      const syntheticData: BriefingData = { ...EMPTY, empresa: clientName, segmento: clientIndustry, produtos: pasteText.slice(0, 500) };
      try {
        localStorage.setItem(`client-briefing-${clientId}`, JSON.stringify(syntheticData));
        localStorage.setItem(`client-briefing-diagnosis-${clientId}`, diagnosisText.slice(0, 3000));
        localStorage.setItem(`client-briefing-raw-${clientId}`, pasteText.slice(0, 5000));
        onBriefingSaved?.(syntheticData);
      } catch {}
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : String(e));
    } finally {
      setPasteLoading(false);
    }
  };

  const set = <K extends keyof BriefingData>(key: K, val: BriefingData[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const canNext = () => {
    if (step === 0) return data.segmento.trim() && data.tempoMercado && data.produtos.trim();
    if (step === 1) return data.clienteIdeal.trim() && data.dorPrincipal.trim();
    if (step === 2) return data.diferencial.trim();
    if (step === 3) return data.canaisAtivos.length > 0 && data.frequencia;
    if (step === 4) return data.meta90dias && data.budgetMarketing;
    return true;
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = buildDiagnosisPrompt(data, clientName);
      const { data: res, error: err } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt: `Você é LIA, Agente de Diagnóstico da Calu Agência. Especialista em análise de marketing, onboarding e diagnóstico estratégico para negócios brasileiros. Entregue diagnósticos profundos, concretos e acionáveis. Português brasileiro.`,
          maxTokens: 12000,
          enableThinking: true,
          thinkingBudget: 8000,
          messages: [{ role: "user", content: prompt }],
        },
      });
      if (err) throw err;
      const diagnosisText = res?.content ?? "";
      setDiagnosis(diagnosisText);
      // Persist briefing + diagnosis so all agents can use as context
      try {
        localStorage.setItem(`client-briefing-${clientId}`, JSON.stringify(data));
        localStorage.setItem(`client-briefing-diagnosis-${clientId}`, diagnosisText.slice(0, 3000));
        onBriefingSaved?.(data);
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const openPdf = () => {
    if (!diagnosis) return;
    const html = generatePdfHtml(diagnosis, clientName, data);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  const consultarTime = async () => {
    if (!diagnosis || consultingTeam || teamProposed) return;
    setConsultingTeam(true);
    try {
      const AGENTS = [
        { id: "strategist",  name: "Queila",    color: "#FBBF24", role: "Estrategista de Marketing" },
        { id: "copywriter",  name: "Beatriz",   color: "#A78BFA", role: "Copywriter" },
        { id: "traffic",     name: "Rafaela",   color: "#F472B6", role: "Gestora de Tráfego Pago" },
        { id: "social",      name: "Marina",    color: "#34D399", role: "Social Media" },
        { id: "calendario",  name: "Pedro",     color: "#2DD4BF", role: "Planejamento Editorial" },
        { id: "designer",    name: "Marcela",   color: "#D946EF", role: "Designer Visual" },
        { id: "analyst",     name: "Lucas",     color: "#60A5FA", role: "Analista de Dados" },
      ];

      const prompt = `Você é o orquestrador de uma agência de marketing digital chamada Calu Agência.

Com base no briefing e diagnóstico abaixo de "${clientName}", defina quais agentes devem agir e qual ação concreta cada um deve propor.

DIAGNÓSTICO:
${diagnosis}

BRIEFING RESUMIDO:
- Segmento: ${data.segmento}
- Meta 90 dias: ${data.meta90dias}
- Budget marketing: ${data.budgetMarketing}
- Canais ativos: ${(data.canaisAtivos || []).join(", ")}
- Dor principal: ${data.dorPrincipal}
- Diferencial: ${data.diferencial}

AGENTES DISPONÍVEIS:
${AGENTS.map(a => `- ${a.name} (${a.role})`).join("\n")}

Retorne SOMENTE um JSON válido, sem markdown, sem explicação. Array com 3 a 5 propostas, cada uma com:
{
  "agentId": "id do agente",
  "agentName": "nome",
  "agentColor": "cor hex",
  "titulo": "título da ação proposta (máx 60 chars)",
  "descricao": "o que exatamente o agente vai executar (2-3 frases diretas)"
}`;

      const { data: res, error: err } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt: "Você é um orquestrador de agentes de marketing. Retorne SOMENTE JSON válido, sem markdown.",
          maxTokens: 2000,
          messages: [{ role: "user", content: prompt }],
        },
      });
      if (err) throw err;

      let proposals: any[] = [];
      const raw = res?.content ?? "";
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) proposals = JSON.parse(match[0]);
      if (!proposals.length) throw new Error("Nenhuma proposta gerada");

      const rows = proposals.map((p: any) => ({
        client_id: clientId,
        agent_id: p.agentId,
        agent_name: p.agentName,
        agent_color: p.agentColor ?? AGENTS.find(a => a.id === p.agentId)?.color ?? "#B9FF4B",
        titulo: p.titulo,
        descricao: p.descricao,
        status: "pending",
        briefing_context: data as any,
      }));

      const { error: insErr } = await (supabase as any).from("agent_proposals").insert(rows);
      if (insErr) throw insErr;

      setTeamProposed(true);
    } catch (e) {
      console.error("consultarTime error:", e);
    } finally {
      setConsultingTeam(false);
    }
  };

  const buildAgentContext = () => {
    const raw = (() => { try { return localStorage.getItem(`client-briefing-raw-${clientId}`) || ""; } catch { return ""; } })();
    const briefingLines = raw
      ? `BRIEFING DO CLIENTE:\n${raw.slice(0, 4000)}`
      : `CLIENTE: ${clientName}\nSEGMENTO: ${data.segmento}\nPRODUTOS: ${data.produtos}\nPÚBLICO: ${data.clienteIdeal}\nDOR: ${data.dorPrincipal}\nDIFERENCIAL: ${data.diferencial}\nMETA 90 DIAS: ${data.meta90dias}\nBUDGET: ${data.budgetMarketing}`;
    return `${briefingLines}\n\nDIAGNÓSTICO GERADO:\n${(diagnosis ?? "").slice(0, 2000)}`;
  };

  const sendPanelChat = async () => {
    const msg = panelChatInput.trim();
    if (!msg || panelChatLoading || !pickedPanelAgent) return;
    setPanelChatInput("");
    const newHistory = [...panelChatHistory, { role: "user" as const, content: msg }];
    setPanelChatHistory(newHistory);
    setPanelChatLoading(true);
    try {
      const { data: res } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt: `Você é ${pickedPanelAgent.name}, especialista em ${pickedPanelAgent.specialty} da Calu Agência. Responda perguntas sobre o cliente "${clientName}" com base no briefing e diagnóstico abaixo. Seja direto, prático e específico para este cliente. Português brasileiro.\n\n${buildAgentContext()}`,
          maxTokens: 1200,
          messages: newHistory,
        },
      });
      setPanelChatHistory(prev => [...prev, { role: "assistant", content: (res?.content ?? "").trim() || "Sem resposta." }]);
    } catch {
      setPanelChatHistory(prev => [...prev, { role: "assistant", content: "Erro técnico. Tente novamente." }]);
    } finally {
      setPanelChatLoading(false);
      setTimeout(() => panelChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  if (diagnosis) {
    // ── PICK agent ──────────────────────────────────────────────
    if (panelView === "pick") {
      return (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setPanelView("diagnosis")}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.4)" }}>
              ←
            </button>
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Com quem quer conversar?</span>
            <button onClick={onClose} className="ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {PANEL_AGENTS.map((agent) => (
              <button key={agent.id}
                onClick={() => { setPickedPanelAgent(agent); setPanelChatHistory([]); setPanelChatInput(""); setPanelView("chat"); setTimeout(() => panelChatInputRef.current?.focus(), 100); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all w-full"
                style={{ background: `${agent.color}08`, border: `1.5px solid ${agent.color}20` }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${agent.color}50`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${agent.color}20`)}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                  style={{ background: `${agent.color}18`, border: `1.5px solid ${agent.color}40`, color: agent.color }}>
                  {agent.initial}
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: "#fff" }}>{agent.name}</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{agent.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // ── CHAT with agent ──────────────────────────────────────────
    if (panelView === "chat" && pickedPanelAgent) {
      return (
        <div className="flex flex-col" style={{ height: 420 }}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <button onClick={() => setPanelView("pick")}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.4)" }}>
              ←
            </button>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
              style={{ background: `${pickedPanelAgent.color}18`, border: `1.5px solid ${pickedPanelAgent.color}40`, color: pickedPanelAgent.color }}>
              {pickedPanelAgent.initial}
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: "#fff" }}>{pickedPanelAgent.name}</div>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{pickedPanelAgent.role}</div>
            </div>
            <button onClick={onClose} className="ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ minHeight: 0 }}>
            {panelChatHistory.length === 0 && (
              <div className="rounded-xl px-3 py-2.5 text-xs"
                style={{ background: `${pickedPanelAgent.color}08`, border: `1px solid ${pickedPanelAgent.color}18`, color: "rgba(255,255,255,0.75)" }}>
                Olá! Sou {pickedPanelAgent.name}. Já li o briefing e o diagnóstico de {clientName} — pode perguntar!
              </div>
            )}
            {panelChatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="rounded-xl px-3 py-2 text-xs max-w-[88%] whitespace-pre-wrap"
                  style={msg.role === "user"
                    ? { background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.18)", color: "rgba(255,255,255,0.85)", borderRadius: "12px 12px 3px 12px" }
                    : { background: `${pickedPanelAgent.color}08`, border: `1px solid ${pickedPanelAgent.color}18`, color: "rgba(255,255,255,0.78)", borderRadius: "3px 12px 12px 12px" }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {panelChatLoading && (
              <div className="flex gap-1.5 px-3 py-2.5 rounded-xl w-fit"
                style={{ background: `${pickedPanelAgent.color}08`, border: `1px solid ${pickedPanelAgent.color}18` }}>
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: pickedPanelAgent.color }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            )}
            <div ref={panelChatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 mt-2 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
            <input ref={panelChatInputRef} value={panelChatInput}
              onChange={(e) => setPanelChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendPanelChat(); } }}
              placeholder={`Pergunte para ${pickedPanelAgent.name}...`}
              disabled={panelChatLoading}
              className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${pickedPanelAgent.color}28`, color: "#F0F0F0" }}
            />
            <button onClick={sendPanelChat} disabled={!panelChatInput.trim() || panelChatLoading}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
              style={{ background: panelChatInput.trim() ? pickedPanelAgent.color : "rgba(255,255,255,0.06)" }}>
              <Send className="w-3.5 h-3.5" style={{ color: panelChatInput.trim() ? "#07080A" : "rgba(255,255,255,0.3)" }} />
            </button>
          </div>
        </div>
      );
    }

    // ── DIAGNOSIS view (default) ─────────────────────────────────
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold"
            style={{ background: `${LIA_COLOR}18`, border: `1px solid ${LIA_COLOR}35`, color: LIA_COLOR }}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>Diagnóstico gerado!</div>
            <div className="text-[10px]" style={{ color: LIA_COLOR }}>Lia · Agente de Diagnóstico</div>
          </div>
          <button onClick={onClose} className="ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl p-4 mb-4 max-h-56 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${LIA_COLOR}20`, color: "rgba(255,255,255,0.75)" }}>
          {diagnosis}
        </div>

        <div className="flex flex-col gap-2">
          {/* Talk to a specialist */}
          <button onClick={() => setPanelView("pick")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: `${LIA_COLOR}12`, color: LIA_COLOR, border: `1px solid ${LIA_COLOR}30` }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${LIA_COLOR}1e`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = `${LIA_COLOR}12`)}>
            <MessageSquare className="w-4 h-4" /> Conversar com especialista
          </button>

          <button
            onClick={consultarTime}
            disabled={consultingTeam || teamProposed}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all"
            style={{
              background: teamProposed ? "rgba(185,255,75,0.08)" : "rgba(185,255,75,0.12)",
              color: teamProposed ? CALU_GREEN : "#F0F0F0",
              border: `1px solid ${teamProposed ? "rgba(185,255,75,0.4)" : "rgba(255,255,255,0.12)"}`,
            }}>
            {consultingTeam ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Consultando os agentes...</>
            ) : teamProposed ? (
              <><CheckCircle2 className="w-4 h-4" style={{ color: CALU_GREEN }} /> Propostas enviadas para sua aprovação</>
            ) : (
              <><Users className="w-4 h-4" /> Consultar o Time — propor ações</>
            )}
          </button>
          {teamProposed && (
            <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
              Vá até a aba <strong style={{ color: "rgba(255,255,255,0.6)" }}>Aprovações</strong> para revisar e aprovar cada proposta
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={openPdf}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: CALU_GREEN, color: "#07080A", boxShadow: `0 0 20px -4px ${CALU_GREEN}60` }}>
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
            <button
              onClick={() => { setDiagnosis(null); setStep(0); setTeamProposed(false); setPanelView("diagnosis"); setData({ ...EMPTY, empresa: clientName, segmento: clientIndustry }); }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: `${LIA_COLOR}12`, color: LIA_COLOR, border: `1px solid ${LIA_COLOR}25` }}>
              Novo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-8 gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{ background: `${LIA_COLOR}15`, border: `1px solid ${LIA_COLOR}30`, color: LIA_COLOR }}>
            L
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: LIA_COLOR }} />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5" style={{ background: LIA_COLOR }} />
          </span>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Lia está analisando...</div>
          <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Gerando diagnóstico com inteligência avançada</div>
        </div>
        <RefreshCw className="w-4 h-4 animate-spin mt-1" style={{ color: LIA_COLOR }} />
      </div>
    );
  }

  const progress = ((step) / STEPS.length) * 100;

  return (
    <div>
      {/* Mode toggle */}
      {!diagnosis && (
        <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {(["form", "paste"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: mode === m ? `${LIA_COLOR}18` : "transparent",
                color: mode === m ? LIA_COLOR : "rgba(255,255,255,0.35)",
                border: mode === m ? `1px solid ${LIA_COLOR}35` : "1px solid transparent",
              }}>
              {m === "form" ? <><ChevronRight className="w-3 h-3" /> Formulário</> : <><ClipboardPaste className="w-3 h-3" /> Colar texto</>}
            </button>
          ))}
        </div>
      )}

      {/* Paste mode */}
      {mode === "paste" && !diagnosis && (
        <div className="space-y-3">
          <input ref={pasteFileRef} type="file" accept=".txt,.md,.csv,.doc,.docx" className="hidden" onChange={handlePasteFile} />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
              Briefing recebido do cliente
            </span>
            <button onClick={() => pasteFileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px dashed rgba(255,255,255,0.14)" }}>
              <Paperclip className="w-3 h-3" /> Carregar arquivo
            </button>
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Cole aqui o briefing que o cliente te enviou (e-mail, PDF, WhatsApp, planilha...)"}
            rows={8}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${LIA_COLOR}28`, color: "#F0F0F0", outline: "none" }}
          />
          {pasteError && (
            <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
              {pasteError}
            </div>
          )}
          <button
            onClick={generateFromPaste}
            disabled={!pasteText.trim() || pasteLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: LIA_COLOR, color: "#07080A", boxShadow: pasteText.trim() ? `0 0 20px -4px ${LIA_COLOR}50` : "none" }}>
            {pasteLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gerando diagnóstico...</> : "Gerar diagnóstico"}
          </button>
        </div>
      )}

      {/* Form mode */}
      {mode === "form" && !diagnosis && <>
      {/* Step progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: LIA_COLOR }}>
              Etapa {step + 1} de {STEPS.length} — {STEPS[step]}
            </span>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: LIA_COLOR }} />
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1.5 mb-5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 h-1 rounded-full transition-all"
            style={{ background: i < step ? LIA_COLOR : i === step ? `${LIA_COLOR}60` : "rgba(255,255,255,0.07)" }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}>

          {/* STEP 0: Empresa */}
          {step === 0 && (
            <div className="space-y-0">
              <Field>
                <Label>Segmento / Nicho *</Label>
                <Input value={data.segmento} onChange={(v) => set("segmento", v)} placeholder="Ex: Consultoria jurídica, E-commerce de moda..." />
              </Field>
              <Field>
                <Label>Tempo de mercado *</Label>
                <Select value={data.tempoMercado} onChange={(v) => set("tempoMercado", v)} options={[
                  { value: "Menos de 1 ano", label: "Menos de 1 ano" },
                  { value: "1 a 3 anos", label: "1 a 3 anos" },
                  { value: "3 a 10 anos", label: "3 a 10 anos" },
                  { value: "Mais de 10 anos", label: "Mais de 10 anos" },
                ]} />
              </Field>
              <Field>
                <Label>Principais produtos / serviços *</Label>
                <Textarea value={data.produtos} onChange={(v) => set("produtos", v)} placeholder="Descreva o que a empresa vende..." rows={2} />
              </Field>
              <Field>
                <Label>Faturamento mensal estimado</Label>
                <Select value={data.faturamento} onChange={(v) => set("faturamento", v)} options={[
                  { value: "Até R$ 5 mil", label: "Até R$ 5 mil" },
                  { value: "R$ 5 mil – R$ 20 mil", label: "R$ 5 mil – R$ 20 mil" },
                  { value: "R$ 20 mil – R$ 50 mil", label: "R$ 20 mil – R$ 50 mil" },
                  { value: "R$ 50 mil – R$ 150 mil", label: "R$ 50 mil – R$ 150 mil" },
                  { value: "Acima de R$ 150 mil", label: "Acima de R$ 150 mil" },
                ]} />
              </Field>
            </div>
          )}

          {/* STEP 1: Público */}
          {step === 1 && (
            <div className="space-y-0">
              <Field>
                <Label>Quem é o cliente ideal? *</Label>
                <Textarea value={data.clienteIdeal} onChange={(v) => set("clienteIdeal", v)} placeholder="Descreva o perfil do seu cliente ideal..." rows={2} />
              </Field>
              <Field>
                <Label>Faixa etária principal</Label>
                <Select value={data.faixaEtaria} onChange={(v) => set("faixaEtaria", v)} options={[
                  { value: "18-24 anos", label: "18-24 anos" },
                  { value: "25-34 anos", label: "25-34 anos" },
                  { value: "35-44 anos", label: "35-44 anos" },
                  { value: "45-54 anos", label: "45-54 anos" },
                  { value: "55+ anos", label: "55+ anos" },
                  { value: "Misto", label: "Misto / várias faixas" },
                ]} />
              </Field>
              <Field>
                <Label>Onde o público está?</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CANAIS.map((c) => (
                    <CheckRow key={c} label={c} checked={data.canaisPublico.includes(c)}
                      onChange={() => set("canaisPublico", toggleArr(data.canaisPublico, c))} color={LIA_COLOR} />
                  ))}
                </div>
              </Field>
              <Field>
                <Label>Maior dor que você resolve *</Label>
                <Textarea value={data.dorPrincipal} onChange={(v) => set("dorPrincipal", v)} placeholder="Qual problema principal o cliente tem antes de te contratar?" rows={2} />
              </Field>
            </div>
          )}

          {/* STEP 2: Concorrência */}
          {step === 2 && (
            <div className="space-y-0">
              <Field>
                <Label>Principais concorrentes</Label>
                <Input value={data.concorrentes} onChange={(v) => set("concorrentes", v)} placeholder="Nome dos 2-3 principais concorrentes..." />
              </Field>
              <Field>
                <Label>Seu maior diferencial *</Label>
                <Textarea value={data.diferencial} onChange={(v) => set("diferencial", v)} placeholder="O que te faz melhor ou diferente dos concorrentes?" rows={3} />
              </Field>
              <Field>
                <Label>Posição percebida no mercado</Label>
                <Select value={data.posicaoMercado} onChange={(v) => set("posicaoMercado", v)} options={[
                  { value: "Líder (referência no segmento)", label: "Líder (referência no segmento)" },
                  { value: "Challenger (disputando o líder)", label: "Challenger (disputando o líder)" },
                  { value: "Seguidora (estabelecida, não compete pelo topo)", label: "Seguidora (estabelecida)" },
                  { value: "Entrante (nova no mercado)", label: "Entrante (nova no mercado)" },
                  { value: "Não sei dizer", label: "Não sei dizer" },
                ]} />
              </Field>
            </div>
          )}

          {/* STEP 3: Marketing atual */}
          {step === 3 && (
            <div className="space-y-0">
              <Field>
                <Label>Canais de marketing ativos *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CANAIS.map((c) => (
                    <CheckRow key={c} label={c} checked={data.canaisAtivos.includes(c)}
                      onChange={() => set("canaisAtivos", toggleArr(data.canaisAtivos, c))} color={LIA_COLOR} />
                  ))}
                </div>
              </Field>
              <Field>
                <Label>Frequência de postagem *</Label>
                <Select value={data.frequencia} onChange={(v) => set("frequencia", v)} options={[
                  { value: "Não posta regularmente", label: "Não posta regularmente" },
                  { value: "1-2x por semana", label: "1-2x por semana" },
                  { value: "3-4x por semana", label: "3-4x por semana" },
                  { value: "Todos os dias", label: "Todos os dias" },
                  { value: "Múltiplos por dia", label: "Múltiplos por dia" },
                ]} />
              </Field>
              <Field>
                <Label>Investe em tráfego pago?</Label>
                <Select value={data.trafegoPago} onChange={(v) => set("trafegoPago", v)} options={[
                  { value: "Não", label: "Não" },
                  { value: "Sim, já invisto", label: "Sim, já invisto" },
                  { value: "Já investi mas parei", label: "Já investi mas parei" },
                ]} />
              </Field>
              {data.trafegoPago === "Sim, já invisto" && (
                <Field>
                  <Label>Budget mensal em tráfego</Label>
                  <Select value={data.budgetTrafego} onChange={(v) => set("budgetTrafego", v)} options={[
                    { value: "Até R$ 500/mês", label: "Até R$ 500/mês" },
                    { value: "R$ 500–2.000/mês", label: "R$ 500–2.000/mês" },
                    { value: "R$ 2.000–5.000/mês", label: "R$ 2.000–5.000/mês" },
                    { value: "Acima de R$ 5.000/mês", label: "Acima de R$ 5.000/mês" },
                  ]} />
                </Field>
              )}
              <Field>
                <Label>O que mais te preocupa hoje no marketing?</Label>
                <Textarea value={data.preocupacoes} onChange={(v) => set("preocupacoes", v)} placeholder="Ex: Não sei se o Instagram está gerando resultado, perco muito lead no WhatsApp..." rows={2} />
              </Field>
            </div>
          )}

          {/* STEP 4: Objetivos */}
          {step === 4 && (
            <div className="space-y-0">
              <Field>
                <Label>Meta principal dos próximos 90 dias *</Label>
                <Select value={data.meta90dias} onChange={(v) => set("meta90dias", v)} options={[
                  { value: "Gerar mais clientes novos", label: "Gerar mais clientes novos" },
                  { value: "Aumentar visibilidade e autoridade", label: "Aumentar visibilidade e autoridade" },
                  { value: "Lançar um produto/serviço novo", label: "Lançar um produto/serviço novo" },
                  { value: "Entrar em novo canal (ex: TikTok, LinkedIn)", label: "Entrar em novo canal" },
                  { value: "Escalar tráfego pago", label: "Escalar tráfego pago" },
                  { value: "Aumentar ticket médio", label: "Aumentar ticket médio / fidelização" },
                  { value: "Estruturar o marketing do zero", label: "Estruturar o marketing do zero" },
                ]} />
              </Field>
              <Field>
                <Label>Prazo para ver resultados</Label>
                <Select value={data.prazoResultados} onChange={(v) => set("prazoResultados", v)} options={[
                  { value: "30 dias", label: "30 dias (urgente)" },
                  { value: "60 dias", label: "60 dias" },
                  { value: "90 dias", label: "90 dias" },
                  { value: "6 meses", label: "6 meses" },
                ]} />
              </Field>
              <Field>
                <Label>O que já tentou que não funcionou?</Label>
                <Textarea value={data.jaTentou} onChange={(v) => set("jaTentou", v)} placeholder="Ex: Impulsionei posts mas não gerou lead, tentei postagem diária mas não tinha resultado..." rows={2} />
              </Field>
              <Field>
                <Label>Investimento disponível para marketing/mês *</Label>
                <Select value={data.budgetMarketing} onChange={(v) => set("budgetMarketing", v)} options={[
                  { value: "Até R$ 1.000/mês", label: "Até R$ 1.000/mês" },
                  { value: "R$ 1.000–3.000/mês", label: "R$ 1.000–3.000/mês" },
                  { value: "R$ 3.000–7.000/mês", label: "R$ 3.000–7.000/mês" },
                  { value: "R$ 7.000–15.000/mês", label: "R$ 7.000–15.000/mês" },
                  { value: "Acima de R$ 15.000/mês", label: "Acima de R$ 15.000/mês" },
                ]} />
              </Field>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className="mt-3 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
            ← Voltar
          </button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: canNext() ? LIA_COLOR : "rgba(255,255,255,0.06)", color: canNext() ? "#07080A" : "rgba(255,255,255,0.3)", boxShadow: canNext() ? `0 0 20px -4px ${LIA_COLOR}60` : "none" }}>
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={generate}
            disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: canNext() ? CALU_GREEN : "rgba(255,255,255,0.06)", color: canNext() ? "#07080A" : "rgba(255,255,255,0.3)", boxShadow: canNext() ? `0 0 20px -4px ${CALU_GREEN}60` : "none" }}>
            Gerar Diagnóstico
          </button>
        )}
      </div>
      </>}
    </div>
  );
}
