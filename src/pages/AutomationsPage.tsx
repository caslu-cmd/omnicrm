import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, Play, Pause, Clock, GitBranch, Mail, MessageSquare, Phone,
  MousePointer, Filter, Timer, Webhook, Plus, Search, MoreVertical,
  CheckCircle2, XCircle, AlertTriangle, ArrowRight, Settings2, Copy,
  Trash2, Eye, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  nodes: number;
  uses: number;
  icon: typeof Zap;
}

interface Automation {
  id: number;
  name: string;
  status: "active" | "paused" | "draft";
  runs: number;
  successRate: number;
  lastRun: string;
  trigger: string;
}

interface WorkflowNode {
  id: string;
  type: "trigger" | "condition" | "action" | "delay" | "webhook";
  label: string;
  icon: typeof Zap;
  x: number;
  y: number;
  config?: string;
}

const templates: AutomationTemplate[] = [
  { id: 1, name: "Follow-up 5 Dias", description: "Sequência automática de 5 dias com e-mail e WhatsApp para novos leads", category: "Vendas", nodes: 8, uses: 1243, icon: Mail },
  { id: 2, name: "Boas-vindas Omnichannel", description: "Mensagem de boas-vindas via canal preferido do contato", category: "Onboarding", nodes: 5, uses: 892, icon: MessageSquare },
  { id: 3, name: "Lead Scoring Automático", description: "Pontua leads com base em interações, aberturas e respostas", category: "Qualificação", nodes: 6, uses: 567, icon: GitBranch },
  { id: 4, name: "Resposta Reviews Google", description: "IA responde automaticamente reviews do Google Meu Negócio com tom ajustável", category: "Reputação", nodes: 4, uses: 334, icon: Zap },
  { id: 5, name: "Agendamento Automático", description: "Envia link de agendamento após qualificação no pipeline", category: "Vendas", nodes: 5, uses: 421, icon: Clock },
  { id: 6, name: "Recuperação de Carrinho", description: "Sequência de recuperação via WhatsApp e e-mail com desconto progressivo", category: "E-commerce", nodes: 7, uses: 789, icon: Phone },
];

const myAutomations: Automation[] = [
  { id: 1, name: "Follow-up Leads Quentes", status: "active", runs: 1847, successRate: 94.2, lastRun: "2 min atrás", trigger: "Novo lead no pipeline" },
  { id: 2, name: "Boas-vindas WhatsApp", status: "active", runs: 3201, successRate: 98.1, lastRun: "15 min atrás", trigger: "Contato criado" },
  { id: 3, name: "Qualificação Automática", status: "paused", runs: 562, successRate: 87.5, lastRun: "1h atrás", trigger: "Form preenchido" },
  { id: 4, name: "Resposta Reviews", status: "active", runs: 89, successRate: 96.0, lastRun: "3h atrás", trigger: "Nova review Google" },
  { id: 5, name: "Re-engajamento Inativos", status: "draft", runs: 0, successRate: 0, lastRun: "Nunca", trigger: "Inativo há 30 dias" },
];

const workflowNodes: WorkflowNode[] = [
  { id: "trigger", type: "trigger", label: "Novo Lead", icon: MousePointer, x: 60, y: 140 },
  { id: "delay1", type: "delay", label: "Esperar 1h", icon: Timer, x: 280, y: 140 },
  { id: "action1", type: "action", label: "Enviar E-mail", icon: Mail, x: 500, y: 80 },
  { id: "condition1", type: "condition", label: "Abriu E-mail?", icon: GitBranch, x: 720, y: 80 },
  { id: "action2", type: "action", label: "WhatsApp", icon: MessageSquare, x: 940, y: 30 },
  { id: "delay2", type: "delay", label: "Esperar 1 dia", icon: Timer, x: 940, y: 150 },
  { id: "action3", type: "action", label: "Follow-up", icon: Mail, x: 1140, y: 150 },
];

const connections = [
  { from: "trigger", to: "delay1" },
  { from: "delay1", to: "action1" },
  { from: "action1", to: "condition1" },
  { from: "condition1", to: "action2", label: "Sim" },
  { from: "condition1", to: "delay2", label: "Não" },
  { from: "delay2", to: "action3" },
];

const nodeColors: Record<string, string> = {
  trigger: "border-primary bg-primary/5",
  condition: "border-accent bg-accent/5",
  action: "border-secondary bg-secondary/5",
  delay: "border-muted-foreground bg-muted",
  webhook: "border-primary bg-primary/5",
};

const nodeIconColors: Record<string, string> = {
  trigger: "text-primary bg-primary/10",
  condition: "text-accent-foreground bg-accent/10",
  action: "text-secondary bg-secondary/10",
  delay: "text-muted-foreground bg-muted",
  webhook: "text-primary bg-primary/10",
};

const statusConfig = {
  active: { label: "Ativo", color: "bg-secondary/10 text-secondary", icon: CheckCircle2 },
  paused: { label: "Pausado", color: "bg-accent/10 text-accent-foreground", icon: Pause },
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: AlertTriangle },
};

const categories = ["Todos", "Vendas", "Onboarding", "Qualificação", "Reputação", "E-commerce"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const AutomationsPage = () => {
  const [tab, setTab] = useState<"my" | "templates" | "builder">("my");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const filteredTemplates = selectedCategory === "Todos"
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6 h-full flex flex-col">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Automações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {myAutomations.filter(a => a.status === "active").length} ativas · {myAutomations.reduce((a, b) => a + b.runs, 0).toLocaleString()} execuções total
          </p>
        </div>
        <button
          onClick={() => setTab("builder")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nova Automação
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {[
          { key: "my", label: "Minhas Automações" },
          { key: "templates", label: "Templates" },
          { key: "builder", label: "Builder Visual" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              tab === t.key ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* My Automations */}
      {tab === "my" && (
        <motion.div variants={item} className="space-y-3">
          {myAutomations.map((auto) => {
            const status = statusConfig[auto.status];
            const StatusIcon = status.icon;
            return (
              <div key={auto.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{auto.name}</h3>
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", status.color)}>
                      <StatusIcon className="h-3 w-3" /> {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Trigger: {auto.trigger} · Última execução: {auto.lastRun}</p>
                </div>
                <div className="hidden md:flex items-center gap-8 text-center">
                  <div>
                    <p className="text-lg font-bold font-display text-foreground">{auto.runs.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground">Execuções</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-display text-foreground">{auto.successRate}%</p>
                    <p className="text-[11px] text-muted-foreground">Sucesso</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {auto.status === "active" ? (
                    <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title="Pausar"><Pause className="h-4 w-4" /></button>
                  ) : (
                    <button className="p-2 rounded-lg hover:bg-muted text-secondary" title="Ativar"><Play className="h-4 w-4" /></button>
                  )}
                  <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Eye className="h-4 w-4" /></button>
                  <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Copy className="h-4 w-4" /></button>
                  <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><MoreVertical className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Templates */}
      {tab === "templates" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="Buscar templates..." className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="flex gap-1.5">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    selectedCategory === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(t => (
              <motion.div
                key={t.id}
                variants={item}
                whileHover={{ y: -2 }}
                className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                    <span className="text-[11px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{t.category}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{t.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t.nodes} nodes · {t.uses.toLocaleString()} usos</span>
                  <span className="text-xs font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Usar template <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Builder */}
      {tab === "builder" && (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Canvas */}
          <div className="flex-1 rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <input
                  defaultValue="Follow-up 5 Dias"
                  className="text-sm font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-0"
                />
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-accent/10 text-accent-foreground">Rascunho</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground">Testar</button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">Ativar</button>
              </div>
            </div>

            {/* Visual Canvas */}
            <div className="flex-1 relative overflow-auto p-8" style={{ minHeight: 300 }}>
              {/* SVG Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 1300, minHeight: 300 }}>
                {connections.map((conn, i) => {
                  const fromNode = workflowNodes.find(n => n.id === conn.from)!;
                  const toNode = workflowNodes.find(n => n.id === conn.to)!;
                  const x1 = fromNode.x + 160;
                  const y1 = fromNode.y + 30;
                  const x2 = toNode.x;
                  const y2 = toNode.y + 30;
                  const mx = (x1 + x2) / 2;
                  return (
                    <g key={i}>
                      <path
                        d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth={2}
                        strokeDasharray={conn.label ? "6,4" : "none"}
                      />
                      {conn.label && (
                        <text x={mx} y={(y1 + y2) / 2 - 8} textAnchor="middle" className="text-[10px] fill-muted-foreground font-medium">
                          {conn.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Nodes */}
              <div className="relative" style={{ minWidth: 1300, minHeight: 250 }}>
                {workflowNodes.map(node => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.04, boxShadow: "0 4px 20px -4px hsl(220 20% 14% / 0.12)" }}
                    onClick={() => setSelectedNode(node.id)}
                    className={cn(
                      "absolute w-40 rounded-xl border-2 p-3 cursor-pointer transition-colors",
                      nodeColors[node.type],
                      selectedNode === node.id && "ring-2 ring-primary/30"
                    )}
                    style={{ left: node.x, top: node.y }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", nodeIconColors[node.type])}>
                        <node.icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{node.type}</p>
                        <p className="text-xs font-medium text-foreground">{node.label}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-72 rounded-xl border border-border bg-card shadow-card p-5 space-y-5 overflow-y-auto scrollbar-thin">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" /> Propriedades
            </h3>

            {selectedNode ? (
              <>
                {(() => {
                  const node = workflowNodes.find(n => n.id === selectedNode)!;
                  return (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                        <p className="text-sm font-medium text-foreground capitalize mt-1">{node.type}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Nome</label>
                        <input defaultValue={node.label} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
                      </div>
                      {node.type === "action" && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Canal</label>
                          <select className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20">
                            <option>E-mail</option>
                            <option>WhatsApp</option>
                            <option>SMS</option>
                          </select>
                        </div>
                      )}
                      {node.type === "delay" && (
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground">Tempo</label>
                            <input type="number" defaultValue={1} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground">Unidade</label>
                            <select className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20">
                              <option>Horas</option>
                              <option>Dias</option>
                              <option>Minutos</option>
                            </select>
                          </div>
                        </div>
                      )}
                      {node.type === "condition" && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Condição</label>
                          <select className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20">
                            <option>Abriu e-mail</option>
                            <option>Clicou no link</option>
                            <option>Respondeu mensagem</option>
                            <option>Score acima de</option>
                          </select>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button className="flex-1 py-2 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center gap-1">
                          <Trash2 className="h-3 w-3" /> Remover
                        </button>
                        <button className="flex-1 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                          <Copy className="h-3 w-3" /> Duplicar
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-8">
                <MousePointer className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Selecione um node para editar suas propriedades</p>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Adicionar Node</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: "trigger", label: "Trigger", icon: MousePointer },
                  { type: "condition", label: "Condição", icon: GitBranch },
                  { type: "action", label: "Ação", icon: Zap },
                  { type: "delay", label: "Delay", icon: Timer },
                  { type: "webhook", label: "Webhook", icon: Webhook },
                  { type: "action", label: "Filtro", icon: Filter },
                ].map((n, i) => (
                  <button key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                    <n.icon className="h-3.5 w-3.5" /> {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AutomationsPage;
