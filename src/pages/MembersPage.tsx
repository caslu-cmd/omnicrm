import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Plus, Users, Eye, X, Pencil, Trash2,
  Clock, BookOpen, Image, Upload, UserPlus, CheckCircle,
  Send, Award, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: string;
  level: string | null;
  modules_count: number | null;
  created_at: string;
  whatsapp_group_id: string | null;
  cert_template_url: string | null;
}

interface Enrollment {
  id: string;
  course_id: string;
  student_name: string;
  student_email: string | null;
  student_phone: string | null;
  progress: number | null;
  enrolled_at: string;
  completed_at: string | null;
}

interface WpGroup { id: string; name: string; participants: number; }

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const statusTabs = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "ended", label: "Encerrados" },
  { id: "draft", label: "Programação" },
];

const wpMediaLabels: Record<string, string> = {
  text: "💬 Texto", image: "🖼️ Imagem", video: "🎥 Vídeo", audio: "🎵 Áudio", link: "🔗 Link",
};

const MembersPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseDetailTab, setCourseDetailTab] = useState<"alunos" | "whatsapp" | "certificados">("alunos");

  // Course modals
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseLevel, setCourseLevel] = useState("Básico");
  const [courseStatus, setCourseStatus] = useState("draft");
  const [courseModules, setCourseModules] = useState("0");
  const [courseImage, setCourseImage] = useState<File | null>(null);
  const [courseImagePreview, setCourseImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enrollment modal
  const [showNewEnrollment, setShowNewEnrollment] = useState(false);
  const [enrollName, setEnrollName] = useState("");
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollPhone, setEnrollPhone] = useState("");

  // WhatsApp for course
  const [courseWpGroups, setCourseWpGroups] = useState<WpGroup[]>([]);
  const [courseWpLoading, setCourseWpLoading] = useState(false);
  const [courseWpTarget, setCourseWpTarget] = useState("");
  const [courseWpMediaType, setCourseWpMediaType] = useState<"text" | "image" | "video" | "audio" | "link">("text");
  const [courseWpMessage, setCourseWpMessage] = useState("");
  const [courseWpMediaData, setCourseWpMediaData] = useState<string | null>(null);
  const [courseWpMediaName, setCourseWpMediaName] = useState("");
  const [courseWpCaption, setCourseWpCaption] = useState("");
  const [courseWpSending, setCourseWpSending] = useState(false);
  const [courseWpResult, setCourseWpResult] = useState<string | null>(null);
  const courseWpFileRef = useRef<HTMLInputElement>(null);

  // Certificates
  const [certTemplate, setCertTemplate] = useState<string | null>(null);
  const [certTemplateName, setCertTemplateName] = useState("");
  const [certSendingId, setCertSendingId] = useState<string | null>(null);
  const certFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    const [coursesRes, enrollRes] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("course_enrollments").select("*").order("enrolled_at", { ascending: false }),
    ]);
    setCourses((coursesRes.data as unknown as Course[]) || []);
    setEnrollments((enrollRes.data as unknown as Enrollment[]) || []);
    setLoading(false);
  };

  const filteredCourses = courses.filter(c => {
    if (activeTab === "active") return c.status === "published";
    if (activeTab === "ended") return c.status === "ended";
    if (activeTab === "draft") return c.status === "draft";
    return true;
  });

  const getEnrollmentCount = (courseId: string) => enrollments.filter(e => e.course_id === courseId).length;
  const totalStudents = new Set(enrollments.map(e => e.student_email || e.student_name)).size;

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("course-images").upload(path, file);
    if (error) { toast.error("Erro ao enviar imagem"); return null; }
    return supabase.storage.from("course-images").getPublicUrl(path).data.publicUrl;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCourseImage(file);
    setCourseImagePreview(URL.createObjectURL(file));
  };

  const resetCourseForm = () => {
    setCourseTitle(""); setCourseDesc(""); setCourseLevel("Básico");
    setCourseStatus("draft"); setCourseModules("0");
    setCourseImage(null); setCourseImagePreview(null);
  };

  const handleCreateCourse = async () => {
    if (!courseTitle.trim() || !user) { toast.error("Título é obrigatório"); return; }
    setUploading(true);
    let imageUrl: string | null = null;
    if (courseImage) imageUrl = await uploadImage(courseImage);
    const { error } = await supabase.from("courses").insert({
      user_id: user.id, title: courseTitle, description: courseDesc || null,
      image_url: imageUrl, status: courseStatus, level: courseLevel,
      modules_count: parseInt(courseModules) || 0,
    });
    setUploading(false);
    if (error) { toast.error("Erro ao criar curso"); return; }
    setShowNewCourse(false); resetCourseForm();
    toast.success(`Curso "${courseTitle}" criado!`);
    fetchAll();
  };

  const openEditCourse = (c: Course) => {
    setSelectedCourse(c);
    setCourseTitle(c.title); setCourseDesc(c.description || "");
    setCourseLevel(c.level || "Básico"); setCourseStatus(c.status);
    setCourseModules(String(c.modules_count || 0));
    setCourseImagePreview(c.image_url); setCourseImage(null);
    setShowEditCourse(true);
  };

  const handleSaveEditCourse = async () => {
    if (!selectedCourse || !courseTitle.trim()) return;
    setUploading(true);
    let imageUrl = selectedCourse.image_url;
    if (courseImage) { const u = await uploadImage(courseImage); if (u) imageUrl = u; }
    const { error } = await supabase.from("courses").update({
      title: courseTitle, description: courseDesc || null, image_url: imageUrl,
      status: courseStatus, level: courseLevel, modules_count: parseInt(courseModules) || 0,
    }).eq("id", selectedCourse.id);
    setUploading(false);
    if (error) { toast.error("Erro ao editar curso"); return; }
    setShowEditCourse(false); resetCourseForm();
    toast.success("Curso atualizado!"); fetchAll();
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Excluir este curso e todos os inscritos?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir curso"); return; }
    if (selectedCourse?.id === id) setSelectedCourse(null);
    toast.success("Curso excluído!"); fetchAll();
  };

  const handleAddEnrollment = async () => {
    if (!enrollName.trim() || !selectedCourse || !user) return;
    const { error } = await supabase.from("course_enrollments").insert({
      course_id: selectedCourse.id, user_id: user.id,
      student_name: enrollName, student_email: enrollEmail || null,
      student_phone: enrollPhone || null,
    });
    if (error) { toast.error("Erro ao inscrever aluno"); return; }
    setShowNewEnrollment(false); setEnrollName(""); setEnrollEmail(""); setEnrollPhone("");
    toast.success(`${enrollName} inscrito(a)!`); fetchAll();
  };

  const handleDeleteEnrollment = async (id: string) => {
    const { error } = await supabase.from("course_enrollments").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover inscrito"); return; }
    toast.success("Inscrito removido!"); fetchAll();
  };

  // ── WhatsApp ──────────────────────────────────────────────────
  const loadCourseGroups = async () => {
    setCourseWpLoading(true); setCourseWpResult(null);
    try {
      const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "groups" } });
      setCourseWpGroups(Array.isArray(data) ? data : []);
      if (!Array.isArray(data) || data.length === 0) toast.error("Nenhum grupo encontrado");
    } catch { toast.error("Erro ao carregar grupos"); }
    setCourseWpLoading(false);
  };

  const handleCourseWpFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCourseWpMediaName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCourseWpMediaData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const sendCourseWpMessage = async () => {
    if (!courseWpTarget) { toast.error("Selecione um grupo ou digite um número"); return; }
    const hasMedia = courseWpMediaType !== "text" && courseWpMediaType !== "link" && !!courseWpMediaData;
    if (!hasMedia && !courseWpMessage.trim()) { toast.error("Digite uma mensagem"); return; }
    setCourseWpSending(true); setCourseWpResult(null);
    try {
      const body: Record<string, any> = { action: "send", phone: courseWpTarget, message: courseWpMessage };
      if (hasMedia) {
        body.mediaType = courseWpMediaType;
        body.mediaData = courseWpMediaData;
        body.caption = courseWpCaption || courseWpMessage;
      }
      const { error } = await supabase.functions.invoke("whatsapp", { body });
      if (error) throw error;
      setCourseWpResult("Mensagem enviada com sucesso!");
      toast.success("Mensagem enviada!");
    } catch (e: any) { toast.error(e?.message ?? "Erro ao enviar"); }
    setCourseWpSending(false);
  };

  // ── Certificados ──────────────────────────────────────────────
  const handleCertTemplateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertTemplateName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCertTemplate(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generateCertificate = (studentName: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new (window as any).Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const fontSize = Math.max(40, Math.round(img.width * 0.045));
        ctx.font = `bold ${fontSize}px Georgia, serif`;
        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.08)";
        ctx.shadowBlur = 6;
        ctx.fillText(studentName, canvas.width / 2, img.height * 0.62);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = certTemplate!;
    });

  const sendCertificate = async (enrollment: Enrollment) => {
    if (!certTemplate) { toast.error("Selecione um template de certificado primeiro"); return; }
    if (!enrollment.student_phone) { toast.error(`${enrollment.student_name} não tem telefone cadastrado`); return; }
    setCertSendingId(enrollment.id);
    try {
      const certImage = await generateCertificate(enrollment.student_name);
      const caption = `🎓 Parabéns, ${enrollment.student_name}! Aqui está seu certificado de conclusão do curso "${selectedCourse?.title}".`;
      const { error } = await supabase.functions.invoke("whatsapp", {
        body: { action: "send", phone: enrollment.student_phone, mediaType: "image", mediaData: certImage, caption },
      });
      if (error) throw error;
      toast.success(`Certificado enviado para ${enrollment.student_name}!`);
    } catch (e: any) { toast.error(e?.message ?? "Erro ao enviar certificado"); }
    setCertSendingId(null);
  };

  const sendAllCertificates = async (list: Enrollment[]) => {
    if (!certTemplate) { toast.error("Selecione um template primeiro"); return; }
    const withPhone = list.filter(e => e.student_phone);
    if (!withPhone.length) { toast.error("Nenhum aluno com telefone cadastrado"); return; }
    let sent = 0;
    for (const enrollment of withPhone) {
      setCertSendingId(enrollment.id);
      try {
        const certImage = await generateCertificate(enrollment.student_name);
        const caption = `🎓 Parabéns, ${enrollment.student_name}! Aqui está seu certificado de conclusão do curso "${selectedCourse?.title}".`;
        await supabase.functions.invoke("whatsapp", {
          body: { action: "send", phone: enrollment.student_phone, mediaType: "image", mediaData: certImage, caption },
        });
        sent++;
      } catch {}
      await new Promise(r => setTimeout(r, 1200));
    }
    setCertSendingId(null);
    toast.success(`${sent} certificados enviados!`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const courseEnrollments = selectedCourse ? enrollments.filter(e => e.course_id === selectedCourse.id) : [];

  const CourseFormFields = () => (
    <>
      <div><label className="text-xs font-medium text-muted-foreground">Título *</label><input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
      <div><label className="text-xs font-medium text-muted-foreground">Descrição</label><textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} rows={2} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-muted-foreground">Nível</label>
          <select value={courseLevel} onChange={e => setCourseLevel(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm">
            {["Básico", "Intermediário", "Avançado", "Pro", "Premium"].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div><label className="text-xs font-medium text-muted-foreground">Status</label>
          <select value={courseStatus} onChange={e => setCourseStatus(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm">
            <option value="draft">Programação</option>
            <option value="published">Ativo</option>
            <option value="ended">Encerrado</option>
          </select>
        </div>
      </div>
      <div><label className="text-xs font-medium text-muted-foreground">Nº de Módulos</label><input type="number" value={courseModules} onChange={e => setCourseModules(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Imagem do Curso (1080×1080)</label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <div onClick={() => fileInputRef.current?.click()} className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted/30 h-40 cursor-pointer hover:border-primary/40 transition-colors overflow-hidden">
          {courseImagePreview
            ? <img src={courseImagePreview} alt="Preview" className="h-full w-full object-cover" />
            : <div className="flex flex-col items-center gap-2 text-muted-foreground"><Image className="h-8 w-8" /><span className="text-xs">Clique para selecionar</span></div>}
        </div>
      </div>
    </>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold font-display text-foreground break-words">Cursos & Membros</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{courses.length} cursos · {totalStudents} alunos</p>
        </div>
        <button onClick={() => { resetCourseForm(); setShowNewCourse(true); }} className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Novo Curso</span><span className="sm:hidden">Novo</span>
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Alunos", value: totalStudents, icon: Users, cls: "bg-primary/10 text-primary" },
          { label: "Cursos Ativos", value: courses.filter(c => c.status === "published").length, icon: BookOpen, cls: "bg-secondary/10 text-secondary" },
          { label: "Programação", value: courses.filter(c => c.status === "draft").length, icon: Clock, cls: "bg-primary/10 text-primary" },
          { label: "Encerrados", value: courses.filter(c => c.status === "ended").length, icon: CheckCircle, cls: "bg-accent/10 text-accent-foreground" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", s.cls)}><s.icon className="h-5 w-5" /></div>
            <div><p className="text-lg font-bold font-display text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </motion.div>

      {/* Filter tabs */}
      <motion.div variants={item} className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {statusTabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", activeTab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{t.label}</button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses list */}
        <div className="lg:col-span-2 space-y-3">
          {filteredCourses.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">Nenhum curso nesta categoria</div>}
          {filteredCourses.map(c => (
            <motion.div key={c.id} variants={item}
              onClick={() => { setSelectedCourse(c); setCourseDetailTab("alunos"); }}
              className={cn("flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card hover:shadow-elevated transition-all cursor-pointer", selectedCourse?.id === c.id ? "border-primary/40" : "border-border")}>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted overflow-hidden shrink-0">
                {c.image_url ? <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" /> : <GraduationCap className="h-7 w-7 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                  <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", c.status === "published" ? "bg-secondary/10 text-secondary" : c.status === "ended" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                    {c.status === "published" ? "Ativo" : c.status === "ended" ? "Encerrado" : "Programação"}
                  </span>
                  {c.level && <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-accent/10 text-accent-foreground">{c.level}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.modules_count || 0} módulos · {getEnrollmentCount(c.id)} inscritos</p>
                {c.description && <p className="text-xs text-muted-foreground mt-1 truncate">{c.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={e => { e.stopPropagation(); openEditCourse(c); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Pencil className="h-4 w-4" /></button>
                <button onClick={e => { e.stopPropagation(); handleDeleteCourse(c.id); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Course detail panel ───────────────────────────── */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col max-h-[82vh]">
          {selectedCourse ? (
            <>
              {selectedCourse.image_url && (
                <img src={selectedCourse.image_url} alt={selectedCourse.title} className="w-full aspect-video object-cover shrink-0" />
              )}
              <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin flex-1">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{selectedCourse.title}</h3>
                  {selectedCourse.description && <p className="text-xs text-muted-foreground mt-0.5">{selectedCourse.description}</p>}
                </div>

                {/* Detail tabs */}
                <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                  {(["alunos", "whatsapp", "certificados"] as const).map(t => (
                    <button key={t} onClick={() => setCourseDetailTab(t)}
                      className={cn("flex-1 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                        courseDetailTab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                      {t === "alunos" ? `👥 Alunos (${courseEnrollments.length})` : t === "whatsapp" ? "💬 WhatsApp" : "🎓 Certificados"}
                    </button>
                  ))}
                </div>

                {/* ── Alunos ──────────────────────────────────── */}
                {courseDetailTab === "alunos" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{courseEnrollments.length} inscritos</span>
                      <button onClick={() => setShowNewEnrollment(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <UserPlus className="h-3.5 w-3.5" /> Inscrever
                      </button>
                    </div>
                    {courseEnrollments.map(e => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30">
                        <div>
                          <p className="text-xs font-medium text-foreground">{e.student_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {e.student_email || "sem e-mail"} · {e.student_phone || "⚠️ sem telefone"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{e.progress ?? 0}% concluído</p>
                        </div>
                        <button onClick={() => handleDeleteEnrollment(e.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {courseEnrollments.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhum inscrito</p>}
                  </div>
                )}

                {/* ── WhatsApp ─────────────────────────────────── */}
                {courseDetailTab === "whatsapp" && (
                  <div className="space-y-3">
                    {/* Group / number */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Grupo ou número</label>
                        <button onClick={loadCourseGroups} disabled={courseWpLoading}
                          className="flex items-center gap-1 text-[10px] text-primary hover:underline disabled:opacity-50">
                          <RefreshCw className={cn("h-3 w-3", courseWpLoading && "animate-spin")} /> Carregar grupos
                        </button>
                      </div>
                      {courseWpGroups.length > 0 ? (
                        <select value={courseWpTarget} onChange={e => setCourseWpTarget(e.target.value)}
                          className="w-full rounded-lg border border-input bg-background py-2 px-3 text-sm">
                          <option value="">Selecione um grupo...</option>
                          {courseWpGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.participants})</option>)}
                        </select>
                      ) : (
                        <input value={courseWpTarget} onChange={e => setCourseWpTarget(e.target.value)}
                          placeholder="ID do grupo ou número (5511...)"
                          className="w-full rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
                      )}
                    </div>

                    {/* Media type */}
                    <div className="flex gap-1.5 flex-wrap">
                      {(["text", "image", "video", "audio", "link"] as const).map(t => (
                        <button key={t}
                          onClick={() => { setCourseWpMediaType(t); setCourseWpMediaData(null); setCourseWpMediaName(""); }}
                          className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all",
                            courseWpMediaType === t
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "text-muted-foreground border-border hover:border-primary/20")}>
                          {wpMediaLabels[t]}
                        </button>
                      ))}
                    </div>

                    {/* File upload */}
                    {courseWpMediaType !== "text" && courseWpMediaType !== "link" && (
                      <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border-2 border-dashed border-input bg-muted/20 hover:border-primary/30 transition-colors">
                        <input ref={courseWpFileRef} type="file" className="hidden"
                          accept={courseWpMediaType === "image" ? "image/*" : courseWpMediaType === "video" ? "video/*" : "audio/*"}
                          onChange={handleCourseWpFile} />
                        <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs truncate" style={{ color: courseWpMediaName ? "hsl(var(--primary))" : undefined }}>
                          {courseWpMediaName || "Selecionar arquivo"}
                        </span>
                      </label>
                    )}

                    {/* Caption */}
                    {(courseWpMediaType === "image" || courseWpMediaType === "video") && (
                      <input value={courseWpCaption} onChange={e => setCourseWpCaption(e.target.value)}
                        placeholder="Legenda (opcional)..."
                        className="w-full rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
                    )}

                    {/* Message */}
                    <textarea value={courseWpMessage} onChange={e => setCourseWpMessage(e.target.value)}
                      rows={courseWpMediaType === "text" ? 4 : 2}
                      placeholder={courseWpMediaType === "link" ? "Cole o link aqui..." : courseWpMediaType === "text" ? "Digite a mensagem..." : "Texto adicional (opcional)..."}
                      className="w-full rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none" />

                    <button onClick={sendCourseWpMessage} disabled={courseWpSending || !courseWpTarget}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                      style={{ background: "#25D366", color: "#fff" }}>
                      {courseWpSending
                        ? <><RefreshCw className="h-4 w-4 animate-spin" /> Enviando…</>
                        : <><Send className="h-4 w-4" /> Enviar</>}
                    </button>

                    {courseWpResult && (
                      <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-secondary/10 text-secondary border border-secondary/20">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0" /> {courseWpResult}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Certificados ──────────────────────────────── */}
                {courseDetailTab === "certificados" && (
                  <div className="space-y-4">
                    {/* Template upload */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                        Layout do certificado (imagem)
                      </label>
                      <input ref={certFileRef} type="file" accept="image/*" className="hidden" onChange={handleCertTemplateSelect} />
                      <div onClick={() => certFileRef.current?.click()}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border-2 border-dashed border-input bg-muted/20 hover:border-primary/30 transition-colors">
                        <Award className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-xs truncate" style={{ color: certTemplateName ? "hsl(var(--primary))" : undefined }}>
                          {certTemplateName || "Clique para selecionar o layout"}
                        </span>
                      </div>
                      {certTemplate && (
                        <img src={certTemplate} alt="Template" className="mt-2 w-full rounded-lg border border-border object-contain max-h-36" />
                      )}
                      {!certTemplate && (
                        <p className="text-[11px] text-muted-foreground mt-2">
                          O nome do aluno será inserido automaticamente no centro do certificado.
                        </p>
                      )}
                    </div>

                    {certTemplate && courseEnrollments.length > 0 && (
                      <>
                        <button
                          onClick={() => sendAllCertificates(courseEnrollments)}
                          disabled={!!certSendingId}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-all disabled:opacity-40">
                          {certSendingId ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                          Enviar para todos ({courseEnrollments.filter(e => e.student_phone).length} com telefone)
                        </button>

                        <div className="space-y-2">
                          {courseEnrollments.map(e => (
                            <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-foreground truncate">{e.student_name}</p>
                                <p className="text-[10px] text-muted-foreground">{e.student_phone || "⚠️ sem telefone"}</p>
                              </div>
                              <button
                                onClick={() => sendCertificate(e)}
                                disabled={!!certSendingId || !e.student_phone}
                                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 shrink-0"
                                style={{ background: "#25D366", color: "#fff" }}>
                                {certSendingId === e.id
                                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  : <><Send className="h-3 w-3" /> Enviar</>}
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {certTemplate && courseEnrollments.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum aluno inscrito neste curso</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Eye className="h-8 w-8 mb-2" />
              <p className="text-sm">Selecione um curso</p>
            </div>
          )}
        </div>
      </div>

      {/* ── New Course Modal ──────────────────────────────────── */}
      {showNewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-foreground">Novo Curso</h2>
              <button onClick={() => setShowNewCourse(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <CourseFormFields />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewCourse(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={handleCreateCourse} disabled={uploading} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                {uploading ? "Enviando..." : "Criar Curso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Course Modal ─────────────────────────────────── */}
      {showEditCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-foreground">Editar Curso</h2>
              <button onClick={() => { setShowEditCourse(false); resetCourseForm(); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <CourseFormFields />
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowEditCourse(false); resetCourseForm(); }} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={handleSaveEditCourse} disabled={uploading} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                {uploading ? "Enviando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enrollment Modal ──────────────────────────────────── */}
      {showNewEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-foreground">Inscrever Aluno</h2>
              <button onClick={() => setShowNewEnrollment(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground">Curso: <strong>{selectedCourse?.title}</strong></p>
            <div><label className="text-xs font-medium text-muted-foreground">Nome *</label><input value={enrollName} onChange={e => setEnrollName(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">E-mail</label><input value={enrollEmail} onChange={e => setEnrollEmail(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">WhatsApp <span className="text-muted-foreground/60">(para envio de certificado)</span></label>
              <input value={enrollPhone} onChange={e => setEnrollPhone(e.target.value)} placeholder="5511999999999" className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewEnrollment(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={handleAddEnrollment} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Inscrever</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MembersPage;
