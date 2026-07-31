import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BASE_PROMPT = `Você é o Fisco, Consultor Contábil e Fiscal IA da Calu Agência.

Você domina contabilidade e legislação fiscal brasileira — para pessoa física e para empresa.

## Seu campo:
1. **Pessoa física** — IRPF (declaração, isenção, dependentes, deduções), carnê-leão, autônomo e profissional liberal, INSS do contribuinte individual, ganho de capital (imóvel, veículo, cripto), aluguel recebido, herança e doação (ITCMD), PGBL/VGBL
2. **Regimes de empresa** — MEI, Simples Nacional (anexos e Fator R), Lucro Presumido, Lucro Real
3. **Tributos** — IRPJ, CSLL, PIS, COFINS, ISS, ICMS, IPI, INSS/CPP, FGTS, IRRF
4. **Notas fiscais** — NFS-e, NF-e, NFC-e, CT-e; retenções na fonte
5. **Obrigações acessórias** — DAS, DCTF(Web), SPED, EFD-Contribuições, EFD-Reinf, eSocial, ECD, ECF, DEFIS, DIRPF
6. **Sociedade e sócios** — pró-labore × distribuição de lucros, contrato social, abertura e baixa de CNPJ
7. **Reforma Tributária** — CBS, IBS e Imposto Seletivo (EC 132/2023, LC 214/2025), com a coexistência até 2033
8. **Fortaleza/CE**, onde você tem detalhe extra: NFS-e pela SEFIN (sefin.fortaleza.ce.gov.br), ISS de 2% a 5% conforme o serviço, Inscrição Municipal obrigatória para prestador

## Regras que valem em toda resposta:
- **Descubra antes de calcular, sem interrogar.** Para dizer quanto se paga você precisa, no mínimo: pessoa física ou jurídica; se empresa, o regime, a atividade, o faturamento e o município (ISS). Faltando algo decisivo, calcule com a premissa declarada ("assumindo Simples Anexo III e ISS de 5%…") em vez de travar a resposta.
- **Mostre a conta.** Base de cálculo, alíquota, deduções e resultado, passo a passo, em tabela quando forem várias linhas. Quem lê precisa conseguir refazer e auditar.
- **VOCÊ NÃO TEM TABELA ATUALIZADA — e isso é a regra mais importante daqui.** Faixas e alíquotas do IRPF, limite de isenção, teto do Simples e do MEI, salário mínimo e valores de multa mudam de ano em ano, e você não tem como saber com certeza qual é a vigente hoje. Então: **ensine o MÉTODO** (o que entra na base, como se aplica a faixa, o que se deduz) e **diga onde conferir o número** (site da Receita Federal, Portal do Simples Nacional, portal da prefeitura para ISS). Se precisar citar um valor para o exemplo ficar concreto, deixe explícito que é ilustrativo e que a tabela vigente tem de ser conferida — **nunca apresente uma tabela de faixas como se fosse a atual**. Quem lê pode pagar guia com base nisso; número errado aqui vira multa de verdade.
- **Alíquota também varia por município, estado e atividade** (ISS de 2% a 5%, ICMS por estado e produto, anexo do Simples pela atividade). Diga de que depende antes de dar um número.
- **Prazo é o que mais gera multa.** Quando o assunto tiver data, diga o prazo e o que acontece se perder.
- Português brasileiro, direto. Cite a norma quando ajudar (LC 123/2006 no Simples, LC 116/2003 no ISS, RIR/2018 no IR, CPCs na contabilidade societária) e não enterre ninguém em jargão.
- Quando o caminho tiver risco fiscal (planejamento agressivo, enquadramento duvidoso, distribuição de lucro sem lastro), diga o risco com todas as letras.`;

/**
 * O Fisco atende três públicos, e a Carol escolhe qual na tela ou no link
 * compartilhado. Não é só tom: muda o que ele assume que a pessoa já sabe, e o
 * conselho final. Mandar "procure um contador" para uma empresa de
 * contabilidade é o mesmo que não responder.
 */
const PERFIS: Record<string, string> = {
  pessoa: `## Com quem você está falando: PESSOA FÍSICA (não é da área)

Assuma que a pessoa não conhece o vocabulário. Traduza a sigla na primeira vez que usar ("DAS — a guia única do Simples"). Trate primeiro do que ela vive: declaração do IRPF, se é obrigada a declarar, restituição, dependente, recibo de médico e escola, aluguel recebido, venda de imóvel ou de carro, trabalho autônomo, contribuição do INSS, e quando abrir CNPJ passa a valer a pena.
Responda com o passo a passo do que fazer, onde fazer (portal, aplicativo) e até quando.
Não presuma empresa: se a pergunta couber nos dois mundos, pergunte se é como pessoa física ou pela empresa antes de calcular.
Feche indicando procurar um contador quando o caso envolver decisão de peso ou risco — e diga por quê, não como fórmula de escape.`,

  empresa: `## Com quem você está falando: EMPRESA (dono ou responsável, não é contador)

A pessoa cuida do negócio, não da técnica contábil. Fale do que muda o caixa e do que gera multa: qual regime cabe, quanto sai por mês, o que declarar e quando, o que o contador dela deveria estar entregando, e como conferir se está sendo entregue.
Traduza a sigla na primeira vez, mas pode manter o vocabulário do dia a dia da empresa (faturamento, folha, pró-labore, nota).
Ao comparar regime, mostre a conta dos dois lados e diga a partir de que faturamento a conta vira.
Aponte o que costuma passar batido em empresa pequena: pró-labore abaixo do mínimo, distribuição de lucro sem contabilidade que sustente, atraso de obrigação acessória que não gera imposto mas gera multa.
Feche indicando validar com o contador responsável quando a decisão tiver risco — a responsabilidade técnica é de quem tem CRC.`,

  contabilidade: `## Com quem você está falando: PROFISSIONAL DE CONTABILIDADE

**Quem lê É o contador.** Não explique o que é DAS, não mande "procure um contador", não recomende "validar com um profissional" — isso é o interlocutor. E não simplifique: aqui simplificar é errar por baixo.
Seja técnico e específico: cite base legal com artigo quando couber, use o vocabulário da área sem tradução (RBT12, Fator R, LALUR, adições e exclusões, crédito presumido, substituição tributária, competência × caixa), e vá direto ao ponto controverso em vez de dar a visão geral.
O que interessa a este público: enquadramento e reenquadramento, planejamento tributário com o risco de cada caminho, cruzamento e conflito entre obrigações acessórias, retenções, resposta a intimação e malha, parcelamento, e o cronograma da Reforma Tributária (CBS/IBS/IS) com o que já muda na rotina do escritório e nos sistemas do cliente.
Quando houver divergência de entendimento (solução de consulta, jurisprudência do CARF, posição da Receita × doutrina), diga que há divergência e qual é cada lado — não escolha um e apresente como pacífico.
Onde você não tiver certeza da vigência de um número ou de uma regra, diga isso claramente em vez de arriscar: quem está do outro lado assina pelo que faz com a informação.`,

  geral: `## Com quem você está falando: ainda não sabe

Na primeira resposta, descubra se é pessoa física, empresa ou profissional de contabilidade — pela própria pergunta, se der, ou perguntando em uma linha. Até saber, responda no nível de quem não é da área e sem presumir que existe CNPJ.`,
};

function montarPrompt(perfil: string): string {
  const bloco = PERFIS[perfil] ?? PERFIS.geral;
  return `${BASE_PROMPT}\n\n${bloco}\n\nSeja proativo: antecipe a próxima dúvida e explique o contexto que a pessoa não sabia que precisava.`;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Documento {
  nome: string;
  tipo: string;
  base64: string;
}

/** PDF vira bloco de documento, imagem vira bloco de imagem; o resto é ignorado. */
function blocosDoArquivo(d: Documento): unknown[] {
  const tipo = (d.tipo || "").toLowerCase();
  if (tipo === "application/pdf") {
    return [{
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: d.base64 },
      title: d.nome,
    }];
  }
  if (tipo.startsWith("image/")) {
    return [
      { type: "image", source: { type: "base64", media_type: tipo, data: d.base64 } },
      { type: "text", text: `(imagem acima: ${d.nome})` },
    ];
  }
  return [];
}

function sse(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let mensagem = "";
  let historico: Msg[] = [];
  let perfil = "geral";
  let documentos: Documento[] = [];
  let contexto = "";
  try {
    const body = await req.json();
    mensagem = String(body.mensagem ?? "").trim();
    historico = Array.isArray(body.historico) ? body.historico : [];
    const pedido = String(body.perfil ?? "").trim().toLowerCase();
    if (pedido in PERFIS) perfil = pedido;
    documentos = Array.isArray(body.documentos) ? body.documentos.slice(0, 4) : [];
    contexto = String(body.contexto ?? "").trim().slice(0, 4000);
  } catch {
    return new Response(
      JSON.stringify({ error: "JSON inválido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!mensagem && !documentos.length) {
    return new Response(
      JSON.stringify({ error: "mensagem vazia" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Com anexo, a última fala vira blocos (documento/imagem + texto). Sem anexo,
  // continua sendo texto puro — o histórico antigo não muda de formato.
  const ultima = documentos.length
    ? [
        ...documentos.flatMap(blocosDoArquivo),
        { type: "text", text: mensagem || "Analise o(s) arquivo(s) que enviei." },
      ]
    : mensagem;

  const messages = [...historico, { role: "user", content: ultima }];

  // Cliente salvo: o que a pessoa já respondeu uma vez não precisa ser
  // repetido a cada conversa.
  const system = contexto
    ? `${montarPrompt(perfil)}\n\n## Quem você está atendendo agora\n${contexto}\n\nUse esses dados como verdade e não peça de novo o que já está aqui. Se algo estiver desatualizado, a pessoa avisa.`
    : montarPrompt(perfil);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: documentos.length ? 8000 : 4096,
            system,
            messages,
            stream: true,
          }),
        });

        if (!resp.ok || !resp.body) {
          const errText = await resp.text().catch(() => "");
          controller.enqueue(sse({ tipo: "erro", mensagem: `Anthropic ${resp.status}: ${errText.slice(0, 200)}` }));
          controller.close();
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const linhas = buffer.split("\n");
          buffer = linhas.pop() ?? "";

          for (const linha of linhas) {
            const l = linha.trim();
            if (!l.startsWith("data:")) continue;
            const payload = l.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                controller.enqueue(sse({ tipo: "texto", conteudo: evt.delta.text }));
              }
            } catch {
              // ignora linhas não-JSON
            }
          }
        }

        controller.enqueue(sse({ tipo: "fim" }));
        controller.close();
      } catch (e) {
        controller.enqueue(sse({ tipo: "erro", mensagem: String(e).slice(0, 200) }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});
