import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, DollarSign, ChevronDown, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Deal = Tables<"deals">;

const stageConfig = [
  { id: "lead", name: "Lead", color: "bg-muted-foreground" },
  { id: "qualification", name: "Qualificação", color: "bg-primary" },
  { id: "proposal", name: "Proposta", color: "bg-accent" },
  { id: "negotiation", name: "Negociação", color: "bg-secondary" },
  { id: "closed", name: "Fechado ✓", color: "bg-secondary" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const PipelinesPage = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [newDealStage, setNewDealStage] = useState("lead");
  const [newDealName, setNewDealName] = useState("");
  const [newDealCompany, setNewDealCompany] = useState("");
  const [newDealValue, setNewDealValue] = useState("");
  const [selectedPipeline, setSelectedPipeline] = useState("Pipeline Principal");
  const [showPipelineMenu, setShowPipelineMenu] = useState(false);
  const [showDealMenu, setShowDealMenu] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchDeals();
  }, [user]);

  const fetchDeals = async () => {
    const { data, error } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar deals"); return; }
    setDeals(data || []);
    setLoading(false);
  };

  const totalValue = deals.reduce((acc, d) => acc + (d.value ?? 0), 0);

  const handleAddDeal = (stageId?: string) => {
    setNewDealStage(stageId || "lead");
    setShowNewDeal(true);
  };

  const handleCreateDeal = async () => {
    if (!newDealName.trim()) { toast.error("Nome do deal é obrigatório"); return; }
    if (!user) return;
    const { error } = await supabase.from("deals").insert({
      user_id: user.id,
      name: newDealName,
      company: newDealCompany || null,
      value: newDealValue ? parseFloat(newDealValue) : 0,
      stage: newDealStage,
    });
    if (error) { toast.error("Erro ao criar deal"); return; }
    setShowNewDeal(false);
    setNewDealName(""); setNewDealCompany(""); setNewDealValue("");
    toast.success(`Deal "${newDealName}" criado!`);
    fetchDeals();
  };

  const handleDeleteDeal = async (dealId: string) => {
    const { error } = await supabase.from("deals").delete().eq("id", dealId);
    if (error) { toast.error("Erro ao remover deal"); return; }
    setShowDealMenu(null);
    toast.success("Deal removido");
    fetchDeals();
  };

  const handleMoveDeal = async (dealId: string, direction: "next" | "prev") => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    const currentIdx = stageConfig.findIndex(s => s.id === deal.stage);
    const targetIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;
    if (targetIdx < 0 || targetIdx >= stageConfig.length) return;
    const { error } = await supabase.from("deals").update({ stage: stageConfig[targetIdx].id, days_in_stage: 0 }).eq("id", dealId);
    if (error) { toast.error("Erro ao mover deal"); return; }
    setShowDealMenu(null);
    toast.success(`Deal movido para ${stageConfig[targetIdx].name}`);
    fetchDeals();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6 h-full flex flex-col">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">{deals.length} deals · R$ {(totalValue / 1000).toFixed(0)}k total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowPipelineMenu(!showPipelineMenu)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {selectedPipeline} <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {showPipelineMenu && (
              <div className="absolute top-10 right-0 z-50 w-48 rounded-lg border border-border bg-card shadow-elevated p-1.5">
                {["Pipeline Principal", "Pipeline Secundário", "Enterprise"].map(p => (
                  <button key={p} onClick={() => { setSelectedPipeline(p); setShowPipelineMenu(false); }} className={`w-full text-left px-3 py-2 rounded-md text-sm ${selectedPipeline === p ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"}`}>{p}</button>
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
        {stageConfig.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage.id);
          return (
            <div key={stage.id} className="flex flex-col w-72 shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
                  <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground px-1.5">{stageDeals.length}</span>
                </div>
                <button onClick={() => handleAddDeal(stage.id)} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 space-y-2.5 min-h-0">
                {stageDeals.map((deal) => (
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
                    <p className="text-xs text-muted-foreground mb-3">{deal.company || "—"}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <DollarSign className="h-3.5 w-3.5 text-secondary" /> R$ {(deal.value ?? 0).toLocaleString("pt-BR")}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                          {(deal.contact || "N").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] text-muted-foreground">{deal.days_in_stage ?? 0}d</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <button onClick={() => handleAddDeal(stage.id)} className="w-full rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> Adicionar
                </button>
              </div>
            </div>
          );
        })}
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
                {stageConfig.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
