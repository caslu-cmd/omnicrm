import { ExternalLink, CheckCircle2, Users, Calendar, Receipt, FileText, Bot, Upload } from "lucide-react";

const RICO_URL = "https://caluagencia.com.br/conta-report";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail?: string;
  tip?: string;
}

const steps: Step[] = [
  {
    icon: <ExternalLink className="w-5 h-5" />,
    title: "Acesse o Rico",
    description: `Abra o link abaixo e insira a senha de acesso fornecida pela Calu Agência.`,
    detail: RICO_URL,
    tip: "Após o primeiro login, o sistema lembra de você automaticamente — não precisa entrar a senha de novo.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Cadastre os membros da equipe",
    description: 'Vá para a aba "Dashboard" e clique em "Gerenciar Membros". Adicione os nomes de todos os sócios e colaboradores que participam da distribuição.',
    tip: "Membros inativos ficam fora do rateio de despesas. Você pode ativar/desativar a qualquer momento.",
  },
  {
    icon: <Calendar className="w-5 h-5" />,
    title: "Crie o período atual",
    description: 'No "Dashboard", clique em "Novo Período" e informe o mês e o ano (ex: Junho/2026). Todos os lançamentos ficam vinculados ao período selecionado.',
    tip: "Crie um período por mês. Você pode ter vários períodos históricos para comparação.",
  },
  {
    icon: <Receipt className="w-5 h-5" />,
    title: "Insira os lançamentos",
    description: "Use as abas Receitas, Despesas, Impostos e Adiantamentos para registrar cada item manualmente, ou envie uma planilha/PDF diretamente para o Rico.",
    tip: 'Para inserir vários itens de uma vez, use a aba "Agente IA" e envie o arquivo. O Rico lê tudo e registra automaticamente.',
  },
  {
    icon: <Upload className="w-5 h-5" />,
    title: "Como usar o upload de arquivo",
    description: 'Na aba "Agente IA", clique no clipe 📎 e anexe a planilha de prestação de contas do mês (Excel, PDF ou CSV). O Rico identifica todas as receitas, despesas, impostos e adiantamentos e insere no sistema sem você precisar digitar nada.',
    tip: "Após o upload, o Rico mostra um resumo de tudo que foi registrado e alerta se algum item não pôde ser categorizado.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Gere o relatório do mês",
    description: 'Vá para a aba "Relatório" e selecione o período. O sistema calcula automaticamente os honorários de cada membro conforme as regras de distribuição, desconta despesas e adiantamentos, e mostra o saldo final.',
    tip: 'Clique em "Salvar no Dropbox" para enviar o relatório direto para a pasta de Prestações de Contas da GNX.',
  },
  {
    icon: <Bot className="w-5 h-5" />,
    title: "Peça análises ao Rico",
    description: 'Na aba "Agente IA", converse diretamente com o Rico. Ele responde perguntas como "Como estão as finanças de maio?", "Compare junho com maio" ou "Qual membro tem mais adiantamentos?".',
    tip: "O Rico sempre busca os dados reais antes de responder — nunca inventa números.",
  },
];

export default function RicoGuidePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-3xl mx-auto">
            💰
          </div>
          <h1 className="text-2xl font-bold text-white">Primeiros passos com o Rico</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Rico é o agente IA de prestação de contas da GNX.<br />
            Siga os passos abaixo para começar a usar.
          </p>
        </div>

        {/* Link de acesso */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-1">Link de acesso</p>
            <a
              href={RICO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-mono text-sm break-all hover:text-emerald-400 transition-colors"
            >
              {RICO_URL}
            </a>
          </div>
          <a
            href={RICO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Rico
          </a>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Passo {i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-white mt-0.5">{step.title}</h3>
                </div>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed pl-11">{step.description}</p>

              {step.detail && (
                <div className="ml-11">
                  <a
                    href={step.detail}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-emerald-400 hover:underline break-all"
                  >
                    {step.detail}
                  </a>
                </div>
              )}

              {step.tip && (
                <div className="ml-11 flex items-start gap-2 bg-gray-800/50 rounded-xl px-3 py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400 leading-relaxed">{step.tip}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Regras de distribuição */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white">Regras de distribuição de honorários</h3>
          <div className="space-y-2">
            {[
              ["1", "Agência 15% / Responsável 85%"],
              ["2", "Agência 20% / Captação 10% / Responsável 70%"],
              ["3", "Agência 15% / Captação 10% / Responsável 50% / Auxiliar 25%"],
              ["4", "Agência 20% / Responsável 50% / Auxiliar 30%"],
              ["5", "Agência 30% / Responsável 70%"],
            ].map(([num, desc]) => (
              <div key={num} className="flex items-center gap-3">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  {num}
                </span>
                <span className="text-sm text-gray-400">{desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600">Ao lançar uma receita, informe o número da regra e o sistema distribui automaticamente.</p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-700">
          Desenvolvido pela Calu Agência · caluagencia.com.br
        </p>
      </div>
    </div>
  );
}
