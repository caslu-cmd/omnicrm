import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, FileText, Loader2, AlertCircle, CheckCircle2, AlertTriangle,
  ChevronLeft, ChevronRight, Copy, Download, Printer, RefreshCw, Calculator,
  ClipboardList, HelpCircle, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

const API = `${SUPABASE_URL}/functions/v1/fisco-diagnostico`;

const GOLD = "#F59E0B";
const GOLD_DIM = "#F59E0B22";
const GOLD_BORDER = "#F59E0B44";

export type PerfilId = "pessoa" | "empresa" | "contabilidade";

/**
 * O questionário é o que separa este diagnóstico de um chat: sem regime,
 * faturamento, folha e município não há como calcular nada — e perguntar isso
 * no meio da conversa vira interrogatório.
 */
type Campo = {
  id: string;
  pergunta: string;
  tipo: "texto" | "numero" | "escolha" | "multipla" | "longo";
  opcoes?: string[];
  ajuda?: string;
  obrigatorio?: boolean;
};

const PERGUNTAS: Record<PerfilId, Campo[]> = {
  pessoa: [
    { id: "renda_tipo", pergunta: "De onde vem a sua renda hoje?", tipo: "multipla", obrigatorio: true,
      opcoes: ["Salário com carteira assinada", "Trabalho por conta própria / autônomo", "Aposentadoria ou pensão", "Aluguel de imóvel", "Sou sócio de empresa", "Investimentos", "Estou sem renda no momento"] },
    { id: "renda_valor", pergunta: "Quanto você recebe por mês, somando tudo (valor bruto)?", tipo: "numero", ajuda: "Aproximado já ajuda", obrigatorio: true },
    { id: "recebe_de", pergunta: "Você recebe de pessoa física (cliente direto, inquilino) ou só de empresa?", tipo: "escolha",
      opcoes: ["Só de empresa", "De pessoa física também", "Só de pessoa física", "Não sei dizer"],
      ajuda: "Isso define se existe carnê-leão a pagar todo mês" },
    { id: "dependentes", pergunta: "Quantos dependentes você tem?", tipo: "numero" },
    { id: "despesas", pergunta: "Teve gasto com saúde, escola/faculdade ou previdência privada no ano?", tipo: "longo",
      ajuda: "Diga o que teve e o valor aproximado — é o que pode ser deduzido" },
    { id: "vendeu_bem", pergunta: "Vendeu imóvel, veículo, ações ou cripto nos últimos 12 meses?", tipo: "longo",
      ajuda: "Se sim: o que era, por quanto comprou e por quanto vendeu" },
    { id: "inss", pergunta: "Você contribui para o INSS?", tipo: "escolha",
      opcoes: ["Sim, descontado do salário", "Sim, pago por conta própria (GPS/DAS)", "Não contribuo", "Não sei"] },
    { id: "declarou", pergunta: "Declarou Imposto de Renda no ano passado?", tipo: "escolha",
      opcoes: ["Sim, e ficou tudo certo", "Sim, mas caí na malha", "Não declarei", "Não sei se precisava"] },
    { id: "tem_cnpj", pergunta: "Você tem CNPJ (MEI ou outro)?", tipo: "escolha",
      opcoes: ["Não tenho", "Tenho MEI", "Tenho empresa (não MEI)", "Estou pensando em abrir"] },
    { id: "duvida", pergunta: "Qual é a sua dúvida ou o que te preocupa?", tipo: "longo", obrigatorio: true,
      ajuda: "Escreva com suas palavras — é isso que o diagnóstico vai responder" },
  ],

  empresa: [
    { id: "atividade", pergunta: "O que a empresa faz? (atividade principal / CNAE)", tipo: "texto", obrigatorio: true },
    { id: "regime", pergunta: "Qual o regime tributário atual?", tipo: "escolha", obrigatorio: true,
      opcoes: ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real", "Não sei"] },
    { id: "anexo", pergunta: "Se for Simples, sabe qual anexo?", tipo: "escolha",
      opcoes: ["Anexo I - comércio", "Anexo II - indústria", "Anexo III - serviços", "Anexo IV - construção/limpeza/vigilância", "Anexo V - serviços técnicos", "Não sei", "Não se aplica"] },
    { id: "rbt12", pergunta: "Faturamento dos últimos 12 meses (R$)", tipo: "numero", obrigatorio: true,
      ajuda: "É o RBT12 — a base do cálculo do Simples" },
    { id: "faturamento_mes", pergunta: "Faturamento médio por mês (R$)", tipo: "numero", obrigatorio: true },
    { id: "folha", pergunta: "Folha mensal, incluindo pró-labore e encargos (R$)", tipo: "numero", obrigatorio: true,
      ajuda: "Decisivo: é o que define o Fator R e pode tirar a empresa do Anexo V" },
    { id: "funcionarios", pergunta: "Quantos funcionários registrados?", tipo: "numero" },
    { id: "prolabore", pergunta: "Os sócios que trabalham na empresa têm pró-labore definido?", tipo: "escolha",
      opcoes: ["Sim, todos", "Só um deles", "Ninguém tem", "Não sei"] },
    { id: "local", pergunta: "Município e estado da empresa", tipo: "texto", obrigatorio: true,
      ajuda: "Define ISS (2% a 5%) e ICMS" },
    { id: "vende_para", pergunta: "Vende para quem?", tipo: "multipla",
      opcoes: ["Consumidor final", "Outras empresas", "Governo / licitação", "Fora do estado", "Exterior"] },
    { id: "notas", pergunta: "Que nota fiscal a empresa emite?", tipo: "multipla",
      opcoes: ["NFS-e (serviço)", "NF-e (mercadoria)", "NFC-e (varejo)", "CT-e (transporte)", "Não emite nota"] },
    { id: "lucros", pergunta: "A empresa distribui lucro aos sócios?", tipo: "escolha",
      opcoes: ["Sim, com contabilidade completa (ECD)", "Sim, sem contabilidade completa", "Não distribui", "Não sei"] },
    { id: "pendencias", pergunta: "Tem débito, parcelamento, obrigação atrasada ou notificação?", tipo: "longo" },
    { id: "duvida", pergunta: "O que você quer resolver com este diagnóstico?", tipo: "longo", obrigatorio: true },
  ],

  contabilidade: [
    { id: "caso", pergunta: "Descreva o caso concreto", tipo: "longo", obrigatorio: true,
      ajuda: "Quanto mais específico, mais técnico consigo ser" },
    { id: "objetivo", pergunta: "O que você quer deste diagnóstico?", tipo: "escolha", obrigatorio: true,
      opcoes: ["Parecer técnico sobre a tese", "Revisão de enquadramento / reenquadramento", "Checklist de obrigações e prazos", "Impacto da Reforma Tributária no cliente", "Subsídio para resposta a intimação/malha", "Revisão de cálculo e memória"] },
    { id: "regime_cliente", pergunta: "Regime do cliente em questão", tipo: "escolha", obrigatorio: true,
      opcoes: ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real", "Entidade sem fins lucrativos", "Pessoa física"] },
    { id: "cnae", pergunta: "Atividade / CNAE e anexo aplicado", tipo: "texto" },
    { id: "numeros", pergunta: "Números relevantes (RBT12, folha, margem, base, retenções)", tipo: "longo",
      ajuda: "Coloque os valores que sustentam a conta" },
    { id: "obrigacoes", pergunta: "Obrigações envolvidas", tipo: "multipla",
      opcoes: ["PGDAS-D / DAS", "DEFIS", "DCTFWeb", "EFD-Contribuições", "EFD-ICMS/IPI", "EFD-Reinf", "eSocial", "ECD", "ECF", "DIRPF", "Nenhuma específica"] },
    { id: "contencioso", pergunta: "Há autuação, intimação, malha ou parcelamento em curso?", tipo: "longo" },
    { id: "tese", pergunta: "Qual o entendimento que você já tem?", tipo: "longo",
      ajuda: "Digo se concordo, onde diverge e qual é o risco de cada caminho" },
    { id: "periodo", pergunta: "Período de apuração / competência", tipo: "texto" },
  ],
};

const PERFIL_META: Record<PerfilId, { label: string; desc: string }> = {
  pessoa: { label: "Pessoa física", desc: "IRPF, carnê-leão, INSS, venda de bens" },
  empresa: { label: "Empresa", desc: "Regime, carga tributária, obrigações, pró-labore" },
  contabilidade: { label: "Escritório de contabilidade", desc: "Técnico, com base legal e divergências" },
};

const DOCS_SUGERIDOS: Record<PerfilId, string[]> = {
  pessoa: ["Informe de rendimentos", "Recibo/nota de despesa médica ou escolar", "Contrato ou escritura de venda de bem", "Declaração do ano anterior"],
  empresa: ["Cartão CNPJ", "Extrato do Simples (PGDAS-D)", "Balancete ou DRE", "Folha de pagamento", "Notas emitidas no mês"],
  contabilidade: ["Balancete / razão", "PGDAS-D ou DCTFWeb", "Intimação ou auto de infração", "Memória de cálculo atual"],
};

const MAX_ARQUIVOS = 4;
const MAX_MB = 4;

type Achado = { gravidade?: string; titulo?: string; detalhe?: string; base_legal?: string };
type LinhaCalc = { descricao?: string; valor?: string };
type Calculo = { titulo?: string; linhas?: LinhaCalc[]; observacao?: string };
type Acao = { prioridade?: number; o_que?: string; como?: string; prazo?: string; risco_se_nao_fizer?: string; responsavel?: string };
type Relatorio = {
  titulo?: string;
  resumo?: string;
  situacao?: { item?: string; valor?: string }[];
  achados?: Achado[];
  calculos?: Calculo[];
  acoes?: Acao[];
  documentos_analisados?: { nome?: string; o_que_encontrei?: string }[];
  faltou_informar?: string[];
  conferir_vigencia?: string[];
};

const GRAVIDADE: Record<string, { cor: string; label: string; Icone: typeof AlertCircle }> = {
  critico: { cor: "#F87171", label: "Crítico", Icone: ShieldAlert },
  atencao: { cor: "#FBBF24", label: "Atenção", Icone: AlertTriangle },
  ok: { cor: "#34D399", label: "Está certo", Icone: CheckCircle2 },
};

function lerArquivo(f: File): Promise<string> {
  return new Promise((ok, erro) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = () => erro(new Error(`Não consegui ler ${f.name}`));
    r.readAsDataURL(f);
  });
}

/** Texto puro para copiar/baixar — sem asterisco, um item por linha. */
function relatorioEmTexto(r: Relatorio, perfil: PerfilId): string {
  const L: string[] = [];
  L.push(r.titulo || "Diagnóstico do Fisco");
  L.push(`Perfil: ${PERFIL_META[perfil].label}`);
  L.push(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`);
  L.push("");
  if (r.resumo) { L.push("RESUMO"); L.push(r.resumo); L.push(""); }
  if (r.situacao?.length) {
    L.push("SITUAÇÃO");
    r.situacao.forEach((s) => L.push(`${s.item}: ${s.valor}`));
    L.push("");
  }
  if (r.achados?.length) {
    L.push("O QUE ENCONTREI");
    r.achados.forEach((a) => {
      L.push(`[${GRAVIDADE[a.gravidade ?? "atencao"]?.label ?? "Atenção"}] ${a.titulo}`);
      if (a.detalhe) L.push(`  ${a.detalhe}`);
      if (a.base_legal) L.push(`  Base: ${a.base_legal}`);
    });
    L.push("");
  }
  if (r.calculos?.length) {
    L.push("CONTAS");
    r.calculos.forEach((c) => {
      L.push(c.titulo ?? "Cálculo");
      c.linhas?.forEach((l) => L.push(`  ${l.descricao}: ${l.valor}`));
      if (c.observacao) L.push(`  Observação: ${c.observacao}`);
      L.push("");
    });
  }
  if (r.acoes?.length) {
    L.push("O QUE PRECISA SER FEITO");
    r.acoes.forEach((a, i) => {
      L.push(`${a.prioridade ?? i + 1}. ${a.o_que}`);
      if (a.como) L.push(`   Como: ${a.como}`);
      if (a.prazo) L.push(`   Prazo: ${a.prazo}`);
      if (a.responsavel) L.push(`   Responsável: ${a.responsavel}`);
      if (a.risco_se_nao_fizer) L.push(`   Se não fizer: ${a.risco_se_nao_fizer}`);
      L.push("");
    });
  }
  if (r.documentos_analisados?.length) {
    L.push("DOCUMENTOS ANALISADOS");
    r.documentos_analisados.forEach((d) => L.push(`${d.nome}: ${d.o_que_encontrei}`));
    L.push("");
  }
  if (r.faltou_informar?.length) {
    L.push("FALTOU INFORMAR");
    r.faltou_informar.forEach((f) => L.push(`- ${f}`));
    L.push("");
  }
  if (r.conferir_vigencia?.length) {
    L.push("CONFERIR NA FONTE OFICIAL ANTES DE USAR");
    r.conferir_vigencia.forEach((c) => L.push(`- ${c}`));
    L.push("");
  }
  L.push("Este diagnóstico orienta e não substitui a responsabilidade técnica de contador com CRC.");
  return L.join("\n");
}

export default function FiscoDiagnostico({ perfilInicial = "empresa" as PerfilId }) {
  const [etapa, setEtapa] = useState<0 | 1 | 2 | 3>(0);
  const [perfil, setPerfil] = useState<PerfilId>(perfilInicial);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const inputFile = useRef<HTMLInputElement>(null);

  const campos = PERGUNTAS[perfil];
  const faltando = useMemo(
    () => campos.filter((c) => c.obrigatorio && !String(respostas[c.id] ?? "").trim()),
    [campos, respostas],
  );

  const setResposta = (id: string, v: string) => setRespostas((p) => ({ ...p, [id]: v }));

  const toggleMultipla = (id: string, opcao: string) => {
    const atual = (respostas[id] ?? "").split(" | ").filter(Boolean);
    const novo = atual.includes(opcao) ? atual.filter((o) => o !== opcao) : [...atual, opcao];
    setResposta(id, novo.join(" | "));
  };

  const addArquivos = (lista: FileList | null) => {
    if (!lista) return;
    const novos: File[] = [];
    for (const f of Array.from(lista)) {
      if (arquivos.length + novos.length >= MAX_ARQUIVOS) {
        toast.error(`Máximo de ${MAX_ARQUIVOS} arquivos.`);
        break;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name} passa de ${MAX_MB} MB.`);
        continue;
      }
      const ok = f.type === "application/pdf" || f.type.startsWith("image/");
      if (!ok) { toast.error(`${f.name}: envie PDF ou imagem.`); continue; }
      novos.push(f);
    }
    setArquivos((p) => [...p, ...novos]);
  };

  const analisar = async () => {
    if (faltando.length) {
      setEtapa(1);
      toast.error(`Faltam ${faltando.length} resposta(s) obrigatória(s).`);
      return;
    }
    setCarregando(true);
    setErro("");
    try {
      const documentos = await Promise.all(
        arquivos.map(async (f) => ({ nome: f.name, tipo: f.type, base64: await lerArquivo(f) })),
      );
      const payload = {
        perfil,
        observacoes,
        respostas: campos
          .filter((c) => String(respostas[c.id] ?? "").trim())
          .map((c) => ({ pergunta: c.pergunta, resposta: respostas[c.id] })),
        documentos,
      };

      const resp = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          apikey: SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error ?? `Erro ${resp.status}`);
      setRelatorio(data.relatorio as Relatorio);
      setEtapa(3);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao gerar o diagnóstico";
      setErro(msg);
      toast.error(msg);
    } finally {
      setCarregando(false);
    }
  };

  const recomecar = () => {
    setRelatorio(null);
    setRespostas({});
    setArquivos([]);
    setObservacoes("");
    setErro("");
    setEtapa(0);
  };

  const baixar = () => {
    if (!relatorio) return;
    const blob = new Blob([relatorioEmTexto(relatorio, perfil)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `diagnostico-fisco-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const ETAPAS = ["Perfil", "Perguntas", "Documentos", "Relatório"];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6" style={{ background: "#07080A" }}>
      <div className="max-w-3xl mx-auto">

        {/* Trilha */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {ETAPAS.map((nome, i) => {
            const ativo = i === etapa;
            const feito = i < etapa;
            return (
              <div key={nome} className="flex items-center gap-2">
                <button
                  onClick={() => { if (i < etapa && !carregando) setEtapa(i as 0 | 1 | 2 | 3); }}
                  disabled={i > etapa}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                  style={{
                    background: ativo ? GOLD_DIM : feito ? "rgba(52,211,153,0.08)" : "#141420",
                    border: `1px solid ${ativo ? GOLD : feito ? "rgba(52,211,153,0.3)" : "#2A2A3A"}`,
                    color: ativo ? GOLD : feito ? "#34D399" : "#666680",
                    cursor: i < etapa ? "pointer" : "default",
                  }}
                >
                  {feito ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
                  {nome}
                </button>
                {i < ETAPAS.length - 1 && <ChevronRight className="w-3 h-3" style={{ color: "#2A2A3A" }} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* ── 0. Perfil ── */}
          {etapa === 0 && (
            <motion.div key="p0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: "#F0F0F0" }}>Diagnóstico contábil e fiscal</h2>
              <p className="text-sm mb-5" style={{ color: "#77778A" }}>
                Responda o questionário, anexe o que tiver e receba um relatório com o que precisa ser feito,
                em ordem de prioridade e com prazo.
              </p>

              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>Para quem é</p>
              <div className="flex flex-col gap-2">
                {(Object.keys(PERFIL_META) as PerfilId[]).map((id) => {
                  const ativo = id === perfil;
                  return (
                    <button key={id} onClick={() => setPerfil(id)}
                      className="text-left px-4 py-3 rounded-2xl transition-all"
                      style={{ background: ativo ? GOLD_DIM : "#141420", border: `1px solid ${ativo ? GOLD : "#2A2A3A"}` }}>
                      <span className="block text-sm font-bold" style={{ color: ativo ? GOLD : "#D0D0E0" }}>
                        {PERFIL_META[id].label}
                      </span>
                      <span className="block text-xs mt-0.5" style={{ color: "#77778A" }}>{PERFIL_META[id].desc}</span>
                    </button>
                  );
                })}
              </div>

              <button onClick={() => setEtapa(1)}
                className="mt-6 w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: GOLD, color: "#07080A" }}>
                Começar <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ── 1. Perguntas ── */}
          {etapa === 1 && (
            <motion.div key="p1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: "#F0F0F0" }}>
                {PERFIL_META[perfil].label} — o que preciso saber
              </h2>
              <p className="text-sm mb-5" style={{ color: "#77778A" }}>
                O que estiver marcado com ponto é o que muda a conclusão. O resto, responda o que souber.
              </p>

              <div className="flex flex-col gap-4">
                {campos.map((c) => (
                  <div key={c.id} className="rounded-2xl p-4" style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#D0D0E0" }}>
                      {c.obrigatorio && <span style={{ color: GOLD }}>• </span>}
                      {c.pergunta}
                    </label>
                    {c.ajuda && <p className="text-[11px] mb-2" style={{ color: "#55556A" }}>{c.ajuda}</p>}

                    {c.tipo === "longo" && (
                      <textarea rows={3} value={respostas[c.id] ?? ""} onChange={(e) => setResposta(c.id, e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-y"
                        style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }} />
                    )}

                    {(c.tipo === "texto" || c.tipo === "numero") && (
                      <input type={c.tipo === "numero" ? "number" : "text"} value={respostas[c.id] ?? ""}
                        onChange={(e) => setResposta(c.id, e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }} />
                    )}

                    {c.tipo === "escolha" && (
                      <div className="flex flex-wrap gap-2">
                        {c.opcoes?.map((o) => {
                          const ativo = respostas[c.id] === o;
                          return (
                            <button key={o} onClick={() => setResposta(c.id, o)}
                              className="px-3 py-1.5 rounded-full text-xs transition-all"
                              style={{ background: ativo ? GOLD_DIM : "#141420", border: `1px solid ${ativo ? GOLD : "#2A2A3A"}`, color: ativo ? GOLD : "#9999AA" }}>
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {c.tipo === "multipla" && (
                      <div className="flex flex-wrap gap-2">
                        {c.opcoes?.map((o) => {
                          const ativo = (respostas[c.id] ?? "").split(" | ").includes(o);
                          return (
                            <button key={o} onClick={() => toggleMultipla(c.id, o)}
                              className="px-3 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5"
                              style={{ background: ativo ? GOLD_DIM : "#141420", border: `1px solid ${ativo ? GOLD : "#2A2A3A"}`, color: ativo ? GOLD : "#9999AA" }}>
                              {ativo && <CheckCircle2 className="w-3 h-3" />}
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={() => setEtapa(0)} className="px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#8888A0" }}>
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button onClick={() => setEtapa(2)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background: GOLD, color: "#07080A" }}>
                  Anexar documentos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {faltando.length > 0 && (
                <p className="text-[11px] mt-2 text-center" style={{ color: "#FBBF24" }}>
                  Faltam {faltando.length} resposta(s) marcada(s) com ponto — sem elas o diagnóstico fica raso.
                </p>
              )}
            </motion.div>
          )}

          {/* ── 2. Documentos ── */}
          {etapa === 2 && (
            <motion.div key="p2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: "#F0F0F0" }}>Documentos (opcional, mas muda tudo)</h2>
              <p className="text-sm mb-4" style={{ color: "#77778A" }}>
                PDF ou foto, até {MAX_ARQUIVOS} arquivos de {MAX_MB} MB. Eu leio o conteúdo e comparo com o que você respondeu.
                Os arquivos não ficam guardados: são usados só nesta análise.
              </p>

              <div className="rounded-2xl p-3 mb-4" style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>O que costuma ajudar</p>
                <div className="flex flex-wrap gap-2">
                  {DOCS_SUGERIDOS[perfil].map((d) => (
                    <span key={d} className="px-2.5 py-1 rounded-full text-[11px]"
                      style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#8888A0" }}>{d}</span>
                  ))}
                </div>
              </div>

              <button onClick={() => inputFile.current?.click()}
                className="w-full py-8 rounded-2xl flex flex-col items-center gap-2 transition-all"
                style={{ background: "#0D0D14", border: `1px dashed ${GOLD_BORDER}` }}>
                <Upload className="w-6 h-6" style={{ color: GOLD }} />
                <span className="text-sm font-semibold" style={{ color: "#C0C0D0" }}>Escolher arquivos</span>
                <span className="text-[11px]" style={{ color: "#55556A" }}>PDF, JPG ou PNG</span>
              </button>
              <input ref={inputFile} type="file" multiple accept="application/pdf,image/*" className="hidden"
                onChange={(e) => { addArquivos(e.target.files); e.currentTarget.value = ""; }} />

              {arquivos.length > 0 && (
                <div className="flex flex-col gap-2 mt-3">
                  {arquivos.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: "#141420", border: "1px solid #2A2A3A" }}>
                      <FileText className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                      <span className="flex-1 text-xs truncate" style={{ color: "#C0C0D0" }}>{f.name}</span>
                      <span className="text-[10px]" style={{ color: "#55556A" }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button onClick={() => setArquivos((p) => p.filter((_, n) => n !== i))}>
                        <X className="w-3.5 h-3.5" style={{ color: "#666680" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#D0D0E0" }}>
                  Quer contar mais alguma coisa?
                </label>
                <textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Qualquer detalhe que o questionário não perguntou"
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-y"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }} />
              </div>

              {erro && (
                <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl mt-4"
                  style={{ background: "#2A1010", border: "1px solid #5A2020", color: "#F87171" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button onClick={() => setEtapa(1)} disabled={carregando}
                  className="px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#8888A0" }}>
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button onClick={analisar} disabled={carregando}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background: carregando ? "#3A2E10" : GOLD, color: carregando ? GOLD : "#07080A" }}>
                  {carregando
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando com critério…</>
                    : <>Gerar diagnóstico <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
              {carregando && (
                <p className="text-[11px] mt-3 text-center" style={{ color: "#55556A" }}>
                  Estou lendo os documentos, conferindo contra o questionário e montando a memória de cálculo.
                  Costuma levar de 1 a 2 minutos.
                </p>
              )}
            </motion.div>
          )}

          {/* ── 3. Relatório ── */}
          {etapa === 3 && relatorio && (
            <motion.div key="p3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} id="fisco-relatorio">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                <h2 className="text-lg font-bold" style={{ color: "#F0F0F0" }}>{relatorio.titulo ?? "Diagnóstico"}</h2>
                <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: GOLD_DIM, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>
                  {PERFIL_META[perfil].label}
                </span>
              </div>
              {relatorio.resumo && (
                <p className="text-sm leading-relaxed mb-5" style={{ color: "#A0A0B8" }}>{relatorio.resumo}</p>
              )}

              {!!relatorio.situacao?.length && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}>
                  <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#444466" }}>Situação</p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    {relatorio.situacao.map((s, i) => (
                      <div key={i}>
                        <div className="text-[11px]" style={{ color: "#55556A" }}>{s.item}</div>
                        <div className="text-sm font-semibold" style={{ color: "#D0D0E0" }}>{s.valor}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!relatorio.acoes?.length && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(245,158,11,0.05)", border: `1px solid ${GOLD_BORDER}` }}>
                  <p className="text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: GOLD }}>
                    <ClipboardList className="w-3 h-3" /> O que precisa ser feito
                  </p>
                  <div className="flex flex-col gap-3">
                    {relatorio.acoes.map((a, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5"
                          style={{ background: GOLD_DIM, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>
                          {a.prioridade ?? i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "#E0E0F0" }}>{a.o_que}</p>
                          {a.como && <p className="text-xs mt-1 leading-relaxed" style={{ color: "#9999AA" }}>{a.como}</p>}
                          <div className="flex gap-x-4 gap-y-1 flex-wrap mt-1.5 text-[11px]">
                            {a.prazo && <span style={{ color: "#FBBF24" }}>Prazo: {a.prazo}</span>}
                            {a.responsavel && <span style={{ color: "#66668A" }}>Quem faz: {a.responsavel}</span>}
                          </div>
                          {a.risco_se_nao_fizer && (
                            <p className="text-[11px] mt-1" style={{ color: "#F87171" }}>Se não fizer: {a.risco_se_nao_fizer}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!relatorio.achados?.length && (
                <div className="flex flex-col gap-2 mb-4">
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: "#444466" }}>O que encontrei</p>
                  {relatorio.achados.map((a, i) => {
                    const g = GRAVIDADE[a.gravidade ?? "atencao"] ?? GRAVIDADE.atencao;
                    return (
                      <div key={i} className="rounded-2xl p-3.5 flex gap-3" style={{ background: "#0D0D14", border: `1px solid ${g.cor}33` }}>
                        <g.Icone className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: g.cor }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "#D0D0E0" }}>{a.titulo}</p>
                          {a.detalhe && <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8888A0" }}>{a.detalhe}</p>}
                          {a.base_legal && <p className="text-[11px] mt-1" style={{ color: "#55556A" }}>{a.base_legal}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!!relatorio.calculos?.length && (
                <div className="flex flex-col gap-3 mb-4">
                  <p className="text-[10px] uppercase tracking-widest flex items-center gap-1.5" style={{ color: "#444466" }}>
                    <Calculator className="w-3 h-3" /> As contas
                  </p>
                  {relatorio.calculos.map((c, i) => (
                    <div key={i} className="rounded-2xl p-4" style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}>
                      <p className="text-sm font-semibold mb-2" style={{ color: "#D0D0E0" }}>{c.titulo}</p>
                      <div className="flex flex-col">
                        {c.linhas?.map((l, n) => (
                          <div key={n} className="flex justify-between gap-3 py-1.5 text-xs"
                            style={{ borderBottom: n < (c.linhas?.length ?? 0) - 1 ? "1px solid #1A1A28" : "none" }}>
                            <span style={{ color: "#8888A0" }}>{l.descricao}</span>
                            <span className="font-semibold text-right" style={{ color: "#E0E0F0" }}>{l.valor}</span>
                          </div>
                        ))}
                      </div>
                      {c.observacao && <p className="text-[11px] mt-2" style={{ color: "#55556A" }}>{c.observacao}</p>}
                    </div>
                  ))}
                </div>
              )}

              {!!relatorio.documentos_analisados?.length && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#444466" }}>Documentos analisados</p>
                  {relatorio.documentos_analisados.map((d, i) => (
                    <p key={i} className="text-xs mb-1.5" style={{ color: "#8888A0" }}>
                      <span style={{ color: "#C0C0D0" }}>{d.nome}</span> — {d.o_que_encontrei}
                    </p>
                  ))}
                </div>
              )}

              {!!relatorio.faltou_informar?.length && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}>
                  <p className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "#444466" }}>
                    <HelpCircle className="w-3 h-3" /> Faltou informar
                  </p>
                  {relatorio.faltou_informar.map((f, i) => (
                    <p key={i} className="text-xs mb-1" style={{ color: "#8888A0" }}>{f}</p>
                  ))}
                </div>
              )}

              {!!relatorio.conferir_vigencia?.length && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.25)" }}>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#FBBF24" }}>
                    Conferir na fonte oficial antes de usar
                  </p>
                  {relatorio.conferir_vigencia.map((c, i) => (
                    <p key={i} className="text-xs mb-1" style={{ color: "#C8B57A" }}>{c}</p>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-center mb-5" style={{ color: "#444466" }}>
                Este diagnóstico orienta e não substitui a responsabilidade técnica de contador com CRC.
              </p>

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { navigator.clipboard.writeText(relatorioEmTexto(relatorio, perfil)); toast.success("Relatório copiado"); }}
                  className="flex-1 min-w-[130px] py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#C0C0D0" }}>
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
                <button onClick={baixar}
                  className="flex-1 min-w-[130px] py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#C0C0D0" }}>
                  <Download className="w-3.5 h-3.5" /> Baixar
                </button>
                <button onClick={() => window.print()}
                  className="flex-1 min-w-[130px] py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#C0C0D0" }}>
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </button>
                <button onClick={recomecar}
                  className="flex-1 min-w-[130px] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
                  style={{ background: GOLD, color: "#07080A" }}>
                  <RefreshCw className="w-3.5 h-3.5" /> Novo diagnóstico
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
