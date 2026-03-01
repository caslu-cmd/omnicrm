import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, DollarSign, ChevronDown, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Deal {
  id: number;
  name: string;
  company: string;
  value: string;
  contact: string;
  avatar: string;
  daysInStage: number;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
}

const initialStages: Stage[] = [
  { id: "lead", name: "Lead", color: "bg-muted-foreground", deals: [
    { id: 1, name: "Website Redesign", company: "Startup X", value: "R$ 12.000", contact: "Beatriz Lima", avatar: "BL", daysInStage: 2 },
    { id: 2, name: "App Mobile", company: "Digital Agency", value: "R$ 28.000", contact: "Fernanda O.", avatar: "FO", daysInStage: 1 },
  ]},
  { id: "qualification", name: "Qualificação", color: "bg-primary", deals: [
    { id: 3, name: "Licença Enterprise", company: "Mega SA", value: "R$ 78.000", contact: "Carlos Mendes", avatar: "CM", daysInStage: 5 },
    { id: 4, name: "Plataforma EAD", company: "EduTech", value: "R$ 15.000", contact: "Paula Reis", avatar: "PR", daysInStage: 3 },
  ]},
  { id: "proposal", name: "Proposta", color: "bg-accent", deals: [
    { id: 5, name: "Projeto Alpha", company: "Tech Corp", value: "R$ 45.000", contact: "Maria Silva", avatar: "MS", daysInStage: 4 },
  ]},
  { id: "negotiation", name: "Negociação", color: "bg-secondary", deals: [
    { id: 6, name: "Consultoria Beta", company: "Innovation Ltd", value: "R$ 32.000", contact: "João Pereira", avatar: "JP", daysInStage: 7 },
    { id: 7, name: "Integração CRM", company: "Global SA", value: "R$ 22.000", contact: "Roberto Santos", avatar: "RS", daysInStage: 2 },
  ]},
  { id: "closed", name: "Fechado ✓", color: "bg-secondary", deals: [
    { id: 8, name: "Automação Mkt", company: "Growth Co", value: "R$ 18.000", contact: "Lucas Alves", avatar: "LA", daysInStage: 0 },
  ]},
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const PipelinesPage = () => {
  const [stages, setStages] = useState(initialStages);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [newDealStage, setNewDealStage] = useState("");
  const [newDealName, setNewDealName] = useState("");
  const [newDealCompany, setNewDealCompany] = useState("");
  const [newDealValue, setNewDealValue] = useState("");
  const [selectedPipeline, setSelectedPipeline] = useState("Pipeline Principal");
  const [showPipelineMenu, setShowPipelineMenu] = useState(false);
  const [showDealMenu, setShowDealMenu] = useState<number | null>(null);

  const totalValue = stages.flatMap(s => s.deals).reduce((acc, d) => {
    const num = parseFloat(d.value.replace(/[^\d]/g, ""));
    return acc + num;
  }, 0);

  const handleAddDeal = (stageId?: string) => {
    setNewDealStage(stageId || "lead");
    setShowNewDeal(true);
  };

  const handleCreateDeal = () => {
    if (!newDealName.trim()) { toast.error("Nome do deal é obrigatório"); return; }
    const newDeal: Deal = { id: Date.now(), name: newDealName, company: newDealCompany || "—", value: newDealValue ? `R$ ${newDealValue}` : "R$ 0", contact: "Novo", avatar: "N", daysInStage: 0 };
    setStages(prev => prev.map(s => s.id === newDealStage ? { ...s, deals: [...s.deals, newDeal] } : s));
    setShowNewDeal(false);
    setNewDealName(""); setNewDealCompany(""); setNewDealValue("");
    toast.success(`Deal "${newDealName}" criado!`);
  };

  const handleDeleteDeal = (dealId: number) => {
    setStages(prev => prev.map(s => ({ ...s, deals: s.deals.filter(d => d.id !== dealId) })));
    setShowDealMenu(null);
    toast.success("Deal removido");
  };

  const handleMoveDeal = (dealId: number, direction: "next" | "prev") => {
    const stageIndex = stages.findIndex(s => s.deals.some(d => d.id === dealId));
    const targetIndex = direction === "next" ? stageIndex + 1 : stageIndex - 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;
    const deal = stages[stageIndex].deals.find(d => d.id === dealId)!;
    setStages(prev => prev.map((s, i) => {
      if (i === stageIndex) return { ...s, deals: s.deals.filter(d => d.id !== dealId) };
      if (i === targetIndex) return { ...s, deals: [...s.deals, { ...deal, daysInStage: 0 }] };
      return s;
    }));
    setShowDealMenu(null);
    toast.success(`Deal movido para ${stages[targetIndex].name}`);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6 h-full flex flex-col">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">{stages.flatMap(s => s.deals).length} deals · R$ {(totalValue / 1000).toFixed(0)}k total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowPipelineMenu(!showPipelineMenu)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {selectedPipeline} <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {showPipelineMenu && (
              <div className="absolute top-10 right-0 z-50 w-48 rounded-lg border border-border bg-card shadow-elevated p-1.5">
                {["Pipeline Principal", "Pipeline Secundário", "Enterprise"].map(p => (
                  <button key={p} onClick={() => { setSelectedPipeline(p); setShowPipelineMenu(false); toast.info(`Pipeline: ${p}`); }} className={`w-full text-left px-3 py-2 rounded-md text-sm ${selectedPipeline === p ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"}`}>{p}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => handleAddDeal()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Novo Deal
          </button>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {stages.map((stage) => (
          <div key={stage.id} className="flex flex-col w-72 shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
                <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground px-1.5">{stage.deals.length}</span>
              </div>
              <button onClick={() => handleAddDeal(stage.id)} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 space-y-2.5 min-h-0">
              {stage.deals.map((deal) => (
                <motion.div key={deal.id} whileHover={{ scale: 1.02, boxShadow: "0 4px 16px -2px hsl(220 20% 14% / 0.1)" }} className="rounded-xl border border-border bg-card p-4 shadow-card cursor-grab active:cursor-grabbing relative">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">{deal.name}</h4>
                    <div className="relative">
                      <button onClick={() => setShowDealMenu(showDealMenu === deal.id ? null : deal.id)} className="p-0.5 rounded hover:bg-muted text-muted-foreground"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                      {showDealMenu === deal.id && (
                        <div className="absolute right-0 top-6 z-50 w-40 rounded-lg border border-border bg-card shadow-elevated p-1">
                          <button onClick={() => handleMoveDeal(deal.id, "prev")} className="w-full text-left px-3 py-1.5 rounded-md text-xs hover:bg-muted text-foreground">← Mover Anterior</button>
                          <button onClick={() => handleMoveDeal(deal.id, "next")} className="w-full text-left px-3 py-1.5 rounded-md text-xs hover:bg-muted text-foreground">Mover Próximo →</button>
                          <button onClick={() => handleDeleteDeal(deal.id)} className="w-full text-left px-3 py-1.5 rounded-md text-xs hover:bg-destructive/10 text-destructive flex items-center gap-1"><Trash2 className="h-3 w-3" /> Remover</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{deal.company}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <DollarSign className="h-3.5 w-3.5 text-secondary" /> {deal.value}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{deal.avatar}</div>
                      <span className="text-[11px] text-muted-foreground">{deal.daysInStage}d</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              <button onClick={() => handleAddDeal(stage.id)} className="w-full rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>
          </div>
        ))}
      </motion.div>

      {showNewDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-foreground">Novo Deal</h2>
              <button onClick={() => setShowNewDeal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Nome *</label><input value={newDealName} onChange={e => setNewDealName(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Empresa</label><input value={newDealCompany} onChange={e => setNewDealCompany(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Valor (R$)</label><input value={newDealValue} onChange={e => setNewDealValue(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Etapa</label>
              <select value={newDealStage} onChange={e => setNewDealStage(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm">
                {initialStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewDeal(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={handleCreateDeal} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Criar Deal</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PipelinesPage;
