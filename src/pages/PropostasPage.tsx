import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Copy, Trash2, ExternalLink, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ────────────────────────────────────────────────────────
interface Proposta {
  id: string;
  slug: string;
  cliente: string;
  created_at: string;
}

interface FormData {
  cliente: string;
  contato: string;
  whatsapp: string;
  usuarios: string;
  setup: string;
  precoNaoOficial: string;
  precoOficial: string;
}

// ── Slug generator ───────────────────────────────────────────────
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── HTML template ────────────────────────────────────────────────
function gerarHtml(p: {
  cliente: string;
  contato: string;
  whatsapp: string;
  usuarios: number;
  setup: string;
  precoNaoOficial: string;
  precoOficial: string;
}): string {
  const data = new Date().toLocaleDateString("pt-BR");
  const wa = p.whatsapp.replace(/\D/g, "");
  const waLink = `https://wa.me/${wa}?text=Ol%C3%A1%20Caroline%2C%20vi%20a%20proposta%20e%20tenho%20interesse%20em%20fechar!`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposta — ${p.cliente}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f0f0; color: #111111; }
  .page { max-width: 860px; margin: 0 auto; background: #fff; min-height: 100vh; }
  .header { background: #111111; padding: 52px 60px 44px; }
  .marca { font-size: 12px; font-weight: 700; letter-spacing: 0.18em; color: #BFFF00; text-transform: uppercase; margin-bottom: 20px; }
  .header h1 { font-size: 34px; font-weight: 800; color: #fff; line-height: 1.15; margin-bottom: 6px; }
  .header .para { font-size: 14px; color: rgba(255,255,255,0.45); font-weight: 300; margin-bottom: 28px; }
  .accent-bar { height: 3px; width: 52px; background: #BFFF00; }
  .content { padding: 52px 60px 40px; }
  h2 { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #BFFF00; background: #111111; padding: 5px 14px; margin-top: 44px; margin-bottom: 18px; }
  .content > h2:first-child { margin-top: 0; }
  p { font-size: 15px; color: #2a2a2a; line-height: 1.75; margin-bottom: 12px; }
  ul { list-style: none; padding: 0; margin: 4px 0 18px; }
  ul li { font-size: 15px; color: #2a2a2a; line-height: 1.65; padding: 7px 0 7px 22px; position: relative; border-bottom: 1px solid #f2f2f2; }
  ul li::before { content: ''; position: absolute; left: 0; top: 16px; width: 10px; height: 2px; background: #BFFF00; }
  ol { list-style: none; counter-reset: step; padding: 0; margin: 4px 0 18px; }
  ol li { counter-increment: step; font-size: 15px; color: #2a2a2a; line-height: 1.65; padding: 10px 0 10px 52px; position: relative; border-bottom: 1px solid #f2f2f2; }
  ol li::before { content: counter(step); position: absolute; left: 0; top: 8px; width: 30px; height: 30px; background: #111111; color: #BFFF00; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  strong { font-weight: 600; color: #111111; }
  em { font-style: italic; color: #555; }
  .invest-table { width: 100%; border-collapse: collapse; margin: 8px 0 24px; font-size: 14px; }
  .invest-table th { background: #111111; color: #BFFF00; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 10px 16px; text-align: left; }
  .invest-table td { padding: 12px 16px; border-bottom: 1px solid #f2f2f2; color: #2a2a2a; }
  .invest-table tr:last-child td { border-bottom: none; font-weight: 700; font-size: 15px; color: #111111; }
  .invest-table .val { text-align: right; font-weight: 600; white-space: nowrap; }
  .highlight-box { background: #111111; padding: 22px 28px; margin: 18px 0; }
  .highlight-box p { color: rgba(255,255,255,0.75); margin-bottom: 4px; }
  .highlight-box .big-val { font-size: 28px; font-weight: 900; color: #BFFF00; letter-spacing: -0.01em; }
  .highlight-box .label { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-top: 2px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 8px 0 18px; }
  .card { border: 1px solid #e8e8e8; padding: 18px 20px; }
  .card .card-label { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #999; margin-bottom: 6px; }
  .card .card-val { font-size: 20px; font-weight: 800; color: #111111; }
  .card .card-desc { font-size: 12px; color: #888; margin-top: 4px; line-height: 1.5; }
  .risk-badge { display: inline-block; padding: 3px 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-left: 8px; vertical-align: middle; }
  .risk-low { background: #BFFF00; color: #111; }
  .risk-med { background: #FFD600; color: #111; }
  .footer { padding: 22px 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; margin-top: 52px; }
  .footer .marca-footer { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; color: #111111; text-transform: uppercase; }
  .footer .data { font-size: 12px; color: #999; font-weight: 300; }
  @media print {
    body { background: #fff; }
    .page { max-width: 100%; box-shadow: none; }
    h2 { break-after: avoid; page-break-after: avoid; }
    h2 + ul, h2 + ol, h2 + p, h2 + .two-col, h2 + table, h2 + .highlight-box { break-before: avoid; page-break-before: avoid; }
    ul li, ol li, .two-col, .card, .highlight-box, .invest-table, .invest-table tr, .footer { break-inside: avoid; page-break-inside: avoid; }
    .welcome-bar, .cta-bar { display: none; }
  }
  .welcome-bar { background: #BFFF00; padding: 18px 60px; display: flex; align-items: center; gap: 14px; }
  .welcome-bar .w-icon { font-size: 20px; flex-shrink: 0; }
  .welcome-bar .w-text { font-size: 13px; font-weight: 600; color: #111111; line-height: 1.5; }
  .welcome-bar .w-text span { font-weight: 400; color: #333; }
  .cta-bar { background: #111111; padding: 44px 60px; text-align: center; margin-top: 52px; }
  .cta-bar .cta-label { font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #BFFF00; margin-bottom: 14px; }
  .cta-bar h3 { font-size: 24px; font-weight: 800; color: #fff; line-height: 1.3; margin-bottom: 12px; }
  .cta-bar p { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.7; max-width: 540px; margin: 0 auto 28px; }
  .cta-btn { display: inline-block; background: #BFFF00; color: #111111; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 14px 36px; text-decoration: none; border: none; cursor: pointer; }
  .cta-btn:hover { background: #d4ff33; }
</style>
</head>
<body>
<div class="page">

  <div class="welcome-bar">
    <div class="w-icon">👋</div>
    <div class="w-text">
      ${p.contato}, este link foi preparado exclusivamente para a <strong>${p.cliente}</strong>.<br>
      <span>Aqui está a proposta completa da sua nova plataforma de atendimento via WhatsApp.</span>
    </div>
  </div>

  <div class="header">
    <div class="marca">Calu Agência</div>
    <h1>Plataforma de Atendimento<br>Via WhatsApp</h1>
    <div class="para">Proposta comercial preparada para ${p.cliente}</div>
    <div class="accent-bar"></div>
  </div>

  <div class="content">

    <h2>O Contexto</h2>
    <p>A ${p.cliente} possui <strong>${p.usuarios} usuários</strong> que precisam atender clientes via WhatsApp de forma organizada, com histórico de conversas, distribuição de atendimentos e visibilidade gerencial — algo que plataformas isoladas não entregam com a flexibilidade que o crescimento da empresa exige.</p>
    <p>A proposta a seguir apresenta uma <strong>plataforma própria de atendimento multiagente via WhatsApp</strong>, desenvolvida sob medida e hospedada com identidade exclusiva da ${p.cliente}.</p>

    <h2>A Solução</h2>
    <p>Uma plataforma web completa onde todos os ${p.usuarios} atendentes acessam as conversas do WhatsApp da empresa em tempo real, com fila inteligente, histórico e relatórios — tudo centralizado em um único painel.</p>
    <ul>
      <li><strong>Caixa de entrada compartilhada</strong> — todos os atendentes enxergam as conversas em fila</li>
      <li><strong>Atribuição de atendimento</strong> — cada conversa é direcionada a um responsável</li>
      <li><strong>Histórico completo por cliente</strong> — todas as mensagens registradas no banco de dados</li>
      <li><strong>Respostas rápidas</strong> — atalhos de texto para perguntas frequentes</li>
      <li><strong>Transferência entre atendentes</strong> — repasse de conversa sem perder o contexto</li>
      <li><strong>Notificações em tempo real</strong> — alerta ao atendente quando chega nova mensagem</li>
      <li><strong>Tags e categorias</strong> — classificação das conversas por tipo de demanda</li>
      <li><strong>Relatórios gerenciais</strong> — volume de atendimentos, tempo médio, produtividade por atendente</li>
      <li><strong>Acesso via navegador</strong> — sem instalação, funciona em qualquer dispositivo</li>
    </ul>

    <h2>Comparativo de Modalidades</h2>
    <p>Apresentamos duas opções de conexão com o WhatsApp, com características e custos distintos:</p>
    <div class="two-col">
      <div class="card">
        <div class="card-label">Modalidade Recomendada</div>
        <div class="card-val">Via Z-API Oficial</div>
        <div class="card-desc">Conexão estável, número verificado pela Meta, sem risco de ban. Templates aprovados. Indicado para operações críticas.</div>
      </div>
      <div class="card">
        <div class="card-label">Modalidade Alternativa</div>
        <div class="card-val">Via Z-API Não Oficial</div>
        <div class="card-desc">Conexão via QR Code, custo menor por mensagem. Risco de suspensão do número pela Meta se detectado uso automatizado.</div>
      </div>
    </div>
    <p><em>Recomendação:</em> para uma operação com ${p.usuarios} usuários e volume alto de atendimentos, a modalidade oficial garante estabilidade e conformidade com os termos da Meta.</p>

    <h2>Como Funciona — Passo a Passo</h2>
    <ol>
      <li><strong>Conexão do número:</strong> o número de WhatsApp da ${p.cliente} é vinculado à plataforma via Z-API</li>
      <li><strong>Cadastro dos atendentes:</strong> os ${p.usuarios} usuários recebem login individual com permissões configuráveis</li>
      <li><strong>Chegada de mensagem:</strong> o sistema recebe e exibe na fila geral em tempo real</li>
      <li><strong>Atribuição:</strong> o atendente assume a conversa ou é atribuído por um supervisor</li>
      <li><strong>Atendimento:</strong> troca de mensagens direto pelo painel, com histórico visível</li>
      <li><strong>Encerramento:</strong> conversa marcada como resolvida e registrada no histórico</li>
    </ol>

    <h2>Arquitetura Técnica</h2>
    <ul>
      <li><strong>Conexão WhatsApp:</strong> Z-API (recebimento e envio de mensagens via webhook e REST API)</li>
      <li><strong>Backend:</strong> FastAPI — gerencia filas, atribuições e lógica de roteamento</li>
      <li><strong>Banco de dados:</strong> Supabase (PostgreSQL) — armazena conversas, clientes e relatórios</li>
      <li><strong>Frontend:</strong> React — painel do atendente com atualização em tempo real (WebSocket)</li>
      <li><strong>Hospedagem:</strong> servidor dedicado com uptime 99,9% e backup diário</li>
    </ul>

    <h2>Cronograma de Entrega</h2>
    <ol>
      <li><strong>Semana 1:</strong> configuração da infraestrutura, conexão Z-API e banco de dados</li>
      <li><strong>Semana 2:</strong> desenvolvimento do painel de atendimento e fila de conversas</li>
      <li><strong>Semana 3:</strong> atribuição de atendentes, histórico, tags e respostas rápidas</li>
      <li><strong>Semana 4:</strong> relatórios, testes com a equipe, ajustes finais e go-live</li>
    </ol>

    <h2>Investimento</h2>
    <table class="invest-table">
      <thead>
        <tr><th>Item</th><th>Modalidade</th><th class="val">Valor</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Implantação</strong><br><em>Desenvolvimento, configuração e treinamento da equipe</em></td>
          <td>Única vez</td>
          <td class="val">R$ ${p.setup}</td>
        </tr>
        <tr>
          <td><strong>Mensalidade — Plano Não Oficial</strong><br><em>Hospedagem + Z-API + suporte + evolução da plataforma</em></td>
          <td>Recorrente</td>
          <td class="val">R$ ${p.precoNaoOficial}/mês</td>
        </tr>
        <tr>
          <td><strong>Mensalidade — Plano Oficial Meta</strong><br><em>Hospedagem + Z-API Oficial + suporte + evolução da plataforma</em></td>
          <td>Recorrente</td>
          <td class="val">R$ ${p.precoOficial}/mês</td>
        </tr>
      </tbody>
    </table>

    <div class="two-col">
      <div class="highlight-box">
        <p class="label">Plano Não Oficial</p>
        <div class="big-val">R$ ${p.precoNaoOficial}<span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.5)">/mês</span></div>
        <div class="label" style="margin-top:8px">+ R$ ${p.setup} setup <span class="risk-badge risk-med">Risco médio</span></div>
      </div>
      <div class="highlight-box">
        <p class="label">Plano Oficial Meta</p>
        <div class="big-val">R$ ${p.precoOficial}<span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.5)">/mês</span></div>
        <div class="label" style="margin-top:8px">+ R$ ${p.setup} setup <span class="risk-badge risk-low">Sem risco</span></div>
      </div>
    </div>

    <p><em>O valor de setup é cobrado somente no fechamento do contrato — nenhum pagamento antes da decisão.</em></p>

    <h2>O Que Está Incluso na Mensalidade</h2>
    <ul>
      <li>Hospedagem do sistema em servidor dedicado</li>
      <li>Licença Z-API (conexão WhatsApp)</li>
      <li>Suporte técnico via WhatsApp em horário comercial</li>
      <li>Atualizações e melhorias contínuas na plataforma</li>
      <li>Usuários ilimitados — os ${p.usuarios} atendentes sem custo adicional por usuário</li>
      <li>Backup diário dos dados de atendimento</li>
    </ul>

    <h2>Próximos Passos</h2>
    <ol>
      <li>Aprovação da proposta e escolha da modalidade (Oficial ou Não Oficial)</li>
      <li>Assinatura do contrato de prestação de serviços</li>
      <li>Pagamento do setup e início imediato do desenvolvimento</li>
      <li>Reunião de alinhamento para configuração dos usuários e fluxos</li>
      <li>Go-live em até 4 semanas</li>
    </ol>

  </div>

  <div class="cta-bar">
    <div class="cta-label">Próximo passo</div>
    <h3>Pronta para transformar o atendimento<br>da ${p.cliente}?</h3>
    <p>Em 4 semanas sua equipe de ${p.usuarios} atendentes estará operando em uma plataforma própria, profissional e sem depender de soluções genéricas. O setup só é cobrado no fechamento — sem risco para você começar a conversa.</p>
    <a class="cta-btn" href="${waLink}">Quero fechar — falar agora</a>
  </div>

  <div class="footer">
    <div class="marca-footer">Calu Agência</div>
    <div class="data">Elaborada em ${data}</div>
  </div>

</div>
</body>
</html>`;
}

// ── Animation variants ───────────────────────────────────────────
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item      = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const BASE_URL = "https://www.caluagencia.com.br";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2xkZ2l5dGVycWh0aGx1ZGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzQ4NjEsImV4cCI6MjA5Mjg1MDg2MX0.v8xcDbEbbyxv671SYhsWYHs9bbp9J-Q937SknjUiBIE";
const SUPA_URL = "https://proldgiyterqhthludlp.supabase.co";

// ── Main component ───────────────────────────────────────────────
export default function PropostasPage() {
  const [propostas, setPropostas]   = useState<Proposta[]>([]);
  const [loading, setLoading]       = useState(true);
  const [open, setOpen]             = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [copied, setCopied]         = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    cliente: "",
    contato: "",
    whatsapp: "",
    usuarios: "37",
    setup: "3.500",
    precoNaoOficial: "690",
    precoOficial: "990",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("propostas")
      .select("id, slug, cliente, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setPropostas(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.cliente.trim() || !form.contato.trim() || !form.whatsapp.trim()) {
      toast.error("Preencha cliente, contato e WhatsApp");
      return;
    }
    setSaving(true);

    const slug = toSlug(form.cliente);
    const html = gerarHtml({
      cliente: form.cliente.trim(),
      contato: form.contato.trim(),
      whatsapp: form.whatsapp.trim(),
      usuarios: parseInt(form.usuarios) || 37,
      setup: form.setup.trim(),
      precoNaoOficial: form.precoNaoOficial.trim(),
      precoOficial: form.precoOficial.trim(),
    });

    const body = JSON.stringify({
      slug,
      cliente: form.cliente.trim(),
      html_content: html,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
    };

    // use authenticated session token if available
    const { data: { session } } = await supabase.auth.getSession();
    headers["Authorization"] = `Bearer ${session?.access_token ?? ANON_KEY}`;
    headers["Prefer"] = "resolution=merge-duplicates";

    const res = await fetch(`${SUPA_URL}/rest/v1/propostas`, {
      method: "POST",
      headers,
      body,
    });

    setSaving(false);

    if (!res.ok) {
      const err = await res.text();
      toast.error("Erro ao salvar: " + err);
      return;
    }

    toast.success(`Proposta criada! Link: ${BASE_URL}/proposta/${slug}`);
    setOpen(false);
    setForm({ cliente: "", contato: "", whatsapp: "", usuarios: "37", setup: "3.500", precoNaoOficial: "690", precoOficial: "990" });
    load();
  };

  const handleDelete = async (id: string, cliente: string) => {
    if (!confirm(`Excluir proposta de "${cliente}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(id);
    await (supabase as any).from("propostas").delete().eq("id", id);
    setPropostas(prev => prev.filter(p => p.id !== id));
    toast.success("Proposta excluída");
    setDeleting(null);
  };

  const copyLink = (slug: string) => {
    const url = `${BASE_URL}/proposta/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const f = (key: keyof FormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6 min-w-0">

      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#BFFF00]" />
            Propostas Comerciais
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gere e compartilhe propostas personalizadas para cada cliente</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-[#BFFF00] text-black hover:bg-[#d4ff33] font-semibold shrink-0">
          <Plus className="w-4 h-4 mr-1" /> Nova Proposta
        </Button>
      </motion.div>

      {/* List */}
      {loading ? (
        <motion.div variants={item} className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </motion.div>
      ) : propostas.length === 0 ? (
        <motion.div variants={item} className="text-center py-20 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nenhuma proposta criada ainda.</p>
          <p className="text-xs mt-1">Clique em "Nova Proposta" para começar.</p>
        </motion.div>
      ) : (
        <motion.div variants={container} className="grid gap-3">
          {propostas.map(p => (
            <motion.div
              key={p.id}
              variants={item}
              className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">{p.cliente}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")} &middot;{" "}
                  <span className="font-mono">/proposta/{p.slug}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyLink(p.slug)}
                  className="h-8 px-3 text-xs"
                >
                  {copied === p.slug ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="ml-1.5">{copied === p.slug ? "Copiado!" : "Copiar link"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`${BASE_URL}/proposta/${p.slug}`, "_blank")}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(p.id, p.cliente)}
                  disabled={deleting === p.id}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Proposta — WhatsApp Multiusuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Empresa do cliente *</Label>
                <Input placeholder="Locus Contabilidade" {...f("cliente")} />
              </div>

              <div className="space-y-1.5">
                <Label>Nome do contato *</Label>
                <Input placeholder="Carol" {...f("contato")} />
              </div>

              <div className="space-y-1.5">
                <Label>WhatsApp do contato *</Label>
                <Input placeholder="85986408404" {...f("whatsapp")} />
                <p className="text-[11px] text-muted-foreground">Só números, com DDD</p>
              </div>

              <div className="space-y-1.5">
                <Label>Nº de usuários</Label>
                <Input placeholder="37" {...f("usuarios")} />
              </div>

              <div className="space-y-1.5">
                <Label>Setup (R$)</Label>
                <Input placeholder="3.500" {...f("setup")} />
              </div>

              <div className="space-y-1.5">
                <Label>Mensalidade Não Oficial (R$)</Label>
                <Input placeholder="690" {...f("precoNaoOficial")} />
              </div>

              <div className="space-y-1.5">
                <Label>Mensalidade Oficial (R$)</Label>
                <Input placeholder="990" {...f("precoOficial")} />
              </div>
            </div>

            {form.cliente && (
              <p className="text-xs text-muted-foreground">
                Link gerado: <span className="font-mono">/proposta/{toSlug(form.cliente)}</span>
              </p>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#BFFF00] text-black hover:bg-[#d4ff33] font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {saving ? "Gerando..." : "Gerar e salvar proposta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
