import { useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Plus, Users, PlayCircle, Lock, Unlock, Eye,
  BarChart3, MoreVertical, ChevronRight, Clock, Star, BookOpen, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Course { id: number; title: string; modules: number; students: number; completion: number; level: string; status: "published" | "draft"; thumbnail: string; }
interface Module { id: number; title: string; lessons: number; duration: string; locked: boolean; }

const initialCourses: Course[] = [
  { id: 1, title: "Marketing Digital Avançado", modules: 8, students: 234, completion: 67, level: "Pro", status: "published", thumbnail: "📈" },
  { id: 2, title: "Vendas Consultivas B2B", modules: 6, students: 156, completion: 72, level: "Premium", status: "published", thumbnail: "🤝" },
  { id: 3, title: "Automação de Processos", modules: 10, students: 89, completion: 45, level: "Básico", status: "published", thumbnail: "⚙️" },
  { id: 4, title: "Copywriting para Conversão", modules: 5, students: 0, completion: 0, level: "Pro", status: "draft", thumbnail: "✍️" },
];

const sampleModules: Module[] = [
  { id: 1, title: "Introdução ao Marketing Digital", lessons: 5, duration: "45 min", locked: false },
  { id: 2, title: "SEO e Conteúdo Orgânico", lessons: 8, duration: "1h 20min", locked: false },
  { id: 3, title: "Tráfego Pago: Google Ads", lessons: 7, duration: "1h 10min", locked: false },
  { id: 4, title: "Tráfego Pago: Meta Ads", lessons: 6, duration: "55 min", locked: true },
  { id: 5, title: "E-mail Marketing Avançado", lessons: 5, duration: "50 min", locked: true },
  { id: 6, title: "Analytics e Métricas", lessons: 4, duration: "40 min", locked: true },
  { id: 7, title: "Automações de Marketing", lessons: 6, duration: "1h", locked: true },
  { id: 8, title: "Projeto Final + Certificado", lessons: 3, duration: "30 min", locked: true },
];

const levelColor: Record<string, string> = { Básico: "bg-muted text-muted-foreground", Pro: "bg-primary/10 text-primary", Premium: "bg-accent/10 text-accent-foreground" };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const MembersPage = () => {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [courses, setCourses] = useState(initialCourses);
  const [modules, setModules] = useState(sampleModules);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const totalStudents = courses.reduce((a, b) => a + b.students, 0);

  const handleCreateCourse = () => {
    if (!newTitle.trim()) { toast.error("Título é obrigatório"); return; }
    setCourses(prev => [...prev, { id: Date.now(), title: newTitle, modules: 0, students: 0, completion: 0, level: "Básico", status: "draft", thumbnail: "📚" }]);
    setShowNewCourse(false); setNewTitle("");
    toast.success(`Curso "${newTitle}" criado!`);
  };

  const toggleModuleLock = (id: number) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, locked: !m.locked } : m));
    const mod = modules.find(m => m.id === id);
    toast.success(mod?.locked ? `"${mod.title}" desbloqueado` : `"${mod?.title}" bloqueado`);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold font-display text-foreground">Área de Membros</h1><p className="text-sm text-muted-foreground mt-1">{courses.length} cursos · {totalStudents} alunos</p></div>
        <button onClick={() => setShowNewCourse(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Plus className="h-4 w-4" /> Novo Curso</button>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Alunos Ativos", value: totalStudents.toString(), icon: Users, color: "primary" },
          { label: "Taxa Conclusão", value: `${Math.round(courses.filter(c => c.status === "published").reduce((a, b) => a + b.completion, 0) / Math.max(courses.filter(c => c.status === "published").length, 1))}%`, icon: BarChart3, color: "secondary" },
          { label: "Total de Módulos", value: courses.reduce((a, b) => a + b.modules, 0).toString(), icon: BookOpen, color: "primary" },
          { label: "Nota Média", value: "4.7", icon: Star, color: "accent" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", s.color === "primary" ? "bg-primary/10 text-primary" : s.color === "secondary" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent-foreground")}><s.icon className="h-5 w-5" /></div>
            <div><p className="text-lg font-bold font-display text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {courses.map(c => (
            <motion.div key={c.id} variants={item} onClick={() => setSelectedCourse(c.id)} className={cn("flex items-center gap-4 rounded-xl border bg-card p-5 shadow-card hover:shadow-elevated transition-all cursor-pointer", selectedCourse === c.id ? "border-primary/30" : "border-border")}>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-3xl">{c.thumbnail}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                  <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", levelColor[c.level])}>{c.level}</span>
                  <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", c.status === "published" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground")}>{c.status === "published" ? "Publicado" : "Rascunho"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.modules} módulos · {c.students} alunos</p>
                {c.status === "published" && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 flex-1 max-w-32 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-secondary" style={{ width: `${c.completion}%` }} /></div>
                    <span className="text-[11px] text-muted-foreground">{c.completion}% conclusão</span>
                  </div>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card p-5 space-y-4 overflow-y-auto scrollbar-thin">
          <h3 className="text-sm font-semibold text-foreground">{selectedCourse ? courses.find(c => c.id === selectedCourse)?.title : "Selecione um curso"}</h3>
          {selectedCourse && (
            <div className="space-y-2">
              {modules.map((m, i) => (
                <div key={m.id} onClick={() => m.locked ? toggleModuleLock(m.id) : toast.info(`Abrindo "${m.title}"`)} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer", m.locked ? "border-border bg-muted/30 opacity-60 hover:opacity-80" : "border-border hover:bg-muted/50")}>
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold", m.locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>{m.locked ? <Lock className="h-3.5 w-3.5" /> : i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{m.title}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-2"><span>{m.lessons} aulas</span><span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {m.duration}</span></p>
                  </div>
                  {!m.locked && <PlayCircle className="h-4 w-4 text-primary shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold font-display text-foreground">Novo Curso</h2><button onClick={() => setShowNewCourse(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button></div>
            <div><label className="text-xs font-medium text-muted-foreground">Título *</label><input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewCourse(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={handleCreateCourse} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Criar</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MembersPage;
