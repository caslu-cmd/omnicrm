import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, User, DollarSign, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  {
    id: "lead", name: "Lead", color: "bg-muted-foreground",
    deals: [
      { id: 1, name: "Website Redesign", company: "Startup X", value: "R$ 12.000", contact: "Beatriz Lima", avatar: "BL", daysInStage: 2 },
      { id: 2, name: "App Mobile", company: "Digital Agency", value: "R$ 28.000", contact: "Fernanda O.", avatar: "FO", daysInStage: 1 },
    ],
  },
  {
    id: "qualification", name: "Qualificação", color: "bg-primary",
    deals: [
      { id: 3, name: "Licença Enterprise", company: "Mega SA", value: "R$ 78.000", contact: "Carlos Mendes", avatar: "CM", daysInStage: 5 },
      { id: 4, name: "Plataforma EAD", company: "EduTech", value: "R$ 15.000", contact: "Paula Reis", avatar: "PR", daysInStage: 3 },
    ],
  },
  {
    id: "proposal", name: "Proposta", color: "bg-accent",
    deals: [
      { id: 5, name: "Projeto Alpha", company: "Tech Corp", value: "R$ 45.000", contact: "Maria Silva", avatar: "MS", daysInStage: 4 },
    ],
  },
  {
    id: "negotiation", name: "Negociação", color: "bg-secondary",
    deals: [
      { id: 6, name: "Consultoria Beta", company: "Innovation Ltd", value: "R$ 32.000", contact: "João Pereira", avatar: "JP", daysInStage: 7 },
      { id: 7, name: "Integração CRM", company: "Global SA", value: "R$ 22.000", contact: "Roberto Santos", avatar: "RS", daysInStage: 2 },
    ],
  },
  {
    id: "closed", name: "Fechado ✓", color: "bg-secondary",
    deals: [
      { id: 8, name: "Automação Mkt", company: "Growth Co", value: "R$ 18.000", contact: "Lucas Alves", avatar: "LA", daysInStage: 0 },
    ],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const PipelinesPage = () => {
  const [stages] = useState(initialStages);

  const totalValue = stages.flatMap(s => s.deals).reduce((acc, d) => {
    const num = parseFloat(d.value.replace(/[^\d]/g, ""));
    return acc + num;
  }, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6 h-full flex flex-col">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stages.flatMap(s => s.deals).length} deals · R$ {(totalValue / 1000).toFixed(0)}k total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Pipeline Principal <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Novo Deal
          </button>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <motion.div variants={item} className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {stages.map((stage) => (
          <div key={stage.id} className="flex flex-col w-72 shrink-0">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
                <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground px-1.5">
                  {stage.deals.length}
                </span>
              </div>
              <button className="p-1 rounded-md hover:bg-muted text-muted-foreground"><Plus className="h-4 w-4" /></button>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2.5 min-h-0">
              {stage.deals.map((deal) => (
                <motion.div
                  key={deal.id}
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 16px -2px hsl(220 20% 14% / 0.1)" }}
                  className="rounded-xl border border-border bg-card p-4 shadow-card cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">{deal.name}</h4>
                    <button className="p-0.5 rounded hover:bg-muted text-muted-foreground"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{deal.company}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <DollarSign className="h-3.5 w-3.5 text-secondary" />
                      {deal.value}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {deal.avatar}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{deal.daysInStage}d</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Add card */}
              <button className="w-full rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default PipelinesPage;
