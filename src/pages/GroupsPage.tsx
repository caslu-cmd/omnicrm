import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Trash2, Search, X, Check,
  ChevronRight, Edit2, MessageCircle, Loader2,
  BookOpen, ChevronDown, Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LIME = "#B9FF4B";

const COLORS = [
  "#B9FF4B","#60A5FA","#A78BFA","#F97316",
  "#FBBF24","#34D399","#F87171","#E879F9",
];

type Group = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  member_count?: number;
};

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string | null;
  company: string | null;
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  level: string | null;
  modules_count: number | null;
};

type CourseStudent = {
  id: string;
  student_name: string;
  student_email: string | null;
  progress: number | null;
  enrolled_at: string;
};

export default function GroupsPage() {
  const [groups, setGroups]           = useState<Group[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<Group | null>(null);
  const [members, setMembers]         = useState<Contact[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Create modal
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState({ name: "", description: "", color: LIME });
  const [saving, setSaving]           = useState(false);

  // Edit
  const [editMode, setEditMode]       = useState(false);
  const [editForm, setEditForm]       = useState({ name: "", description: "", color: "" });

  // Add contacts modal
  const [showAdd, setShowAdd]         = useState(false);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [addingIds, setAddingIds]     = useState<Set<string>>(new Set());
  const [contactsLoading, setContactsLoading] = useState(false);

  // Delete confirm
  const [deleting, setDeleting]       = useState(false);

  // Tabs
  const [activeTab, setActiveTab]     = useState<"membros" | "cursos">("membros");

  // Cursos tab
  const [courses, setCourses]         = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseStudents, setCourseStudents] = useState<CourseStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  // ── Load groups ────────────────────────────────────────────────
  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: grps } = await (supabase as any)
        .from("contact_groups")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!grps) { setGroups([]); return; }

      // Count members per group
      const withCounts = await Promise.all(grps.map(async (g) => {
        const { count } = await (supabase as any)
          .from("contact_group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", g.id);
        return { ...g, member_count: count ?? 0 };
      }));
      setGroups(withCounts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGroups(); }, []);

  // ── Load courses ───────────────────────────────────────────────
  const loadCourses = async () => {
    setCoursesLoading(true);
    setSelectedCourse(null);
    setCourseStudents([]);
    setExpandedCourses(new Set());
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("courses")
        .select("id, title, description, status, level, modules_count")
        .eq("user_id", user.id)
        .order("title");
      setCourses(data ?? []);
    } finally {
      setCoursesLoading(false);
    }
  };

  const toggleCourse = async (course: Course) => {
    const isExpanded = expandedCourses.has(course.id);
    if (isExpanded) {
      setExpandedCourses(prev => { const n = new Set(prev); n.delete(course.id); return n; });
      return;
    }
    setExpandedCourses(prev => new Set([...prev, course.id]));
    setSelectedCourse(course);
    setStudentsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("course_enrollments")
        .select("id, student_name, student_email, progress, enrolled_at")
        .eq("course_id", course.id)
        .eq("user_id", user.id)
        .order("student_name");
      setCourseStudents(data ?? []);
    } finally {
      setStudentsLoading(false);
    }
  };

  // ── Load members of selected group ────────────────────────────
  const loadMembers = async (group: Group) => {
    setSelected(group);
    setEditMode(false);
    setActiveTab("membros");
    setCourses([]);
    setSelectedCourse(null);
    setCourseStudents([]);
    setExpandedCourses(new Set());
    setMembersLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("contact_group_members")
        .select("contact_id, contacts(id, name, phone, email, status, company)")
        .eq("group_id", group.id);

      const contacts = (data ?? [])
        .map((r: any) => r.contacts)
        .filter(Boolean) as Contact[];
      setMembers(contacts);
    } finally {
      setMembersLoading(false);
    }
  };

  // ── Create group ───────────────────────────────────────────────
  const createGroup = async () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await (supabase as any).from("contact_groups").insert({
        user_id: user.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        color: form.color,
      });
      if (error) throw error;
      toast.success("Grupo criado!");
      setShowCreate(false);
      setForm({ name: "", description: "", color: LIME });
      loadGroups();
    } catch (e) {
      toast.error("Erro ao criar grupo");
    } finally {
      setSaving(false);
    }
  };

  // ── Save edit ──────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!selected || !editForm.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("contact_groups")
        .update({ name: editForm.name, description: editForm.description || null, color: editForm.color, updated_at: new Date().toISOString() })
        .eq("id", selected.id);
      if (error) throw error;
      toast.success("Grupo atualizado!");
      const updated = { ...selected, ...editForm };
      setSelected(updated);
      setEditMode(false);
      loadGroups();
    } finally {
      setSaving(false);
    }
  };

  // ── Delete group ───────────────────────────────────────────────
  const deleteGroup = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await (supabase as any).from("contact_groups").delete().eq("id", selected.id);
      toast.success("Grupo removido");
      setSelected(null);
      setMembers([]);
      loadGroups();
    } finally {
      setDeleting(false);
    }
  };

  // ── Remove member ──────────────────────────────────────────────
  const removeMember = async (contactId: string) => {
    if (!selected) return;
    await (supabase as any).from("contact_group_members")
      .delete()
      .eq("group_id", selected.id)
      .eq("contact_id", contactId);
    setMembers(prev => prev.filter(c => c.id !== contactId));
    setGroups(prev => prev.map(g => g.id === selected.id ? { ...g, member_count: (g.member_count ?? 1) - 1 } : g));
    toast.success("Contato removido do grupo");
  };

  // ── Load all contacts for add modal ───────────────────────────
  const openAddContacts = async () => {
    setShowAdd(true);
    setContactSearch("");
    setAddingIds(new Set());
    setContactsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("contacts")
        .select("id, name, phone, email, status, company")
        .eq("user_id", user!.id)
        .order("name");
      const existing = new Set(members.map(m => m.id));
      setAllContacts((data ?? []).filter(c => !existing.has(c.id)));
    } finally {
      setContactsLoading(false);
    }
  };

  const toggleAdd = (id: string) => {
    setAddingIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const confirmAdd = async () => {
    if (!selected || addingIds.size === 0) return;
    setSaving(true);
    try {
      const rows = [...addingIds].map(contact_id => ({ group_id: selected.id, contact_id }));
      const { error } = await (supabase as any).from("contact_group_members").insert(rows);
      if (error) throw error;
      toast.success(`${addingIds.size} contato(s) adicionado(s)!`);
      setShowAdd(false);
      loadMembers(selected);
      setGroups(prev => prev.map(g => g.id === selected.id
        ? { ...g, member_count: (g.member_count ?? 0) + addingIds.size } : g));
    } finally {
      setSaving(false);
    }
  };

  const filtered = allContacts.filter(c =>
    c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.phone?.includes(contactSearch) ||
    c.email?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="flex gap-0 h-[calc(100vh-64px)] -m-6 overflow-hidden">

      {/* ── Lista de grupos ── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.01)" }}>

        <div className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div>
            <h1 className="text-sm font-bold text-white">Grupos</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{groups.length} grupos</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: LIME, color: "#07080A" }}>
            <Plus className="w-3.5 h-3.5" /> Novo
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-white/30" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="w-8 h-8 mx-auto mb-3 text-white/10" />
              <p className="text-sm text-white/30">Nenhum grupo ainda</p>
              <p className="text-xs text-white/20 mt-1">Clique em "Novo" para criar</p>
            </div>
          ) : groups.map(g => (
            <button key={g.id} onClick={() => loadMembers(g)}
              className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left"
              style={{
                background: selected?.id === g.id ? "rgba(255,255,255,0.05)" : "transparent",
                borderLeft: selected?.id === g.id ? `3px solid ${g.color}` : "3px solid transparent",
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: `${g.color}18`, border: `1.5px solid ${g.color}35`, color: g.color }}>
                {g.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">{g.name}</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {g.member_count ?? 0} contato(s)
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Detalhe do grupo ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <Users className="w-12 h-12 mb-4 text-white/10" />
            <p className="text-white/30 text-sm">Selecione um grupo para ver os contatos</p>
          </div>
        ) : (
          <>
            {/* Header do grupo */}
            <div className="flex items-center gap-4 px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black"
                style={{ background: `${selected.color}18`, border: `1.5px solid ${selected.color}40`, color: selected.color }}>
                {selected.name.charAt(0).toUpperCase()}
              </div>

              {editMode ? (
                <div className="flex-1 flex items-center gap-3">
                  <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white/05 border border-white/10 text-white outline-none" />
                  <input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Descrição (opcional)"
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/05 border border-white/10 text-white/70 outline-none" />
                  <div className="flex gap-1.5">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setEditForm(p => ({ ...p, color: c }))}
                        className="w-5 h-5 rounded-full border-2 transition-transform"
                        style={{ background: c, borderColor: editForm.color === c ? "white" : "transparent", transform: editForm.color === c ? "scale(1.2)" : "scale(1)" }} />
                    ))}
                  </div>
                  <button onClick={saveEdit} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: LIME, color: "#07080A" }}>
                    <Check className="w-3.5 h-3.5" /> Salvar
                  </button>
                  <button onClick={() => setEditMode(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 transition-colors">
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-white truncate">{selected.name}</h2>
                  {selected.description && (
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{selected.description}</p>
                  )}
                </div>
              )}

              {!editMode && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setEditMode(true); setEditForm({ name: selected.name, description: selected.description ?? "", color: selected.color }); }}
                    className="p-2 rounded-lg transition-colors hover:bg-white/05"
                    style={{ color: "rgba(255,255,255,0.4)" }}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={deleteGroup} disabled={deleting}
                    className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                    style={{ color: "rgba(239,68,68,0.5)" }}>
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                  <button onClick={openAddContacts}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: "rgba(185,255,75,0.12)", color: LIME, border: "1px solid rgba(185,255,75,0.25)" }}>
                    <Plus className="w-3.5 h-3.5" /> Adicionar contatos
                  </button>
                  <a href="/whatsapp"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}>
                    <MessageCircle className="w-3.5 h-3.5" /> Disparar WA
                  </a>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-0 px-6 border-b flex-shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              {(["membros", "cursos"] as const).map(tab => (
                <button key={tab} onClick={() => {
                  setActiveTab(tab);
                  if (tab === "cursos" && courses.length === 0) loadCourses();
                }}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-widest transition-colors relative"
                  style={{ color: activeTab === tab ? LIME : "rgba(255,255,255,0.3)" }}>
                  {tab === "membros" ? `Membros (${members.length})` : "Por Curso"}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                      style={{ background: LIME }} />
                  )}
                </button>
              ))}
            </div>

            {/* Conteúdo da aba Membros */}
            {activeTab === "membros" && (
              <div className="flex-1 overflow-y-auto p-6">
                {membersLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-white/30" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="w-10 h-10 mx-auto mb-4 text-white/10" />
                    <p className="text-white/30 text-sm">Nenhum contato neste grupo</p>
                    <button onClick={openAddContacts}
                      className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mx-auto transition-all"
                      style={{ background: "rgba(185,255,75,0.1)", color: LIME, border: "1px solid rgba(185,255,75,0.2)" }}>
                      <Plus className="w-4 h-4" /> Adicionar contatos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-white/30 mb-4 font-semibold uppercase tracking-widest">
                      {members.length} contato(s)
                    </p>
                    {members.map(c => (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl group"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `${selected.color}14`, color: selected.color }}>
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                          <p className="text-xs text-white/35 truncate">
                            {c.phone || c.email || "Sem contato"}
                          </p>
                        </div>
                        {c.status && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                            {c.status}
                          </span>
                        )}
                        <button onClick={() => removeMember(c.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                          style={{ color: "rgba(239,68,68,0.5)" }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo da aba Por Curso */}
            {activeTab === "cursos" && (
              <div className="flex-1 overflow-y-auto p-6">
                {coursesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-white/30" />
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="w-10 h-10 mx-auto mb-4 text-white/10" />
                    <p className="text-white/30 text-sm">Nenhum curso cadastrado</p>
                    <p className="text-xs text-white/20 mt-1">Crie cursos na aba Cursos do workspace do cliente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-white/30 mb-4 font-semibold uppercase tracking-widest">
                      {courses.length} curso(s) — clique para ver alunos
                    </p>
                    {courses.map(course => {
                      const isExpanded = expandedCourses.has(course.id);
                      const isThisLoading = studentsLoading && selectedCourse?.id === course.id;
                      return (
                        <div key={course.id} className="rounded-2xl overflow-hidden"
                          style={{ border: `1px solid ${isExpanded ? "rgba(185,255,75,0.2)" : "rgba(255,255,255,0.06)"}` }}>

                          {/* Cabeçalho do curso */}
                          <button onClick={() => toggleCourse(course)}
                            className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left"
                            style={{ background: isExpanded ? "rgba(185,255,75,0.05)" : "rgba(255,255,255,0.02)" }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: isExpanded ? "rgba(185,255,75,0.15)" : "rgba(255,255,255,0.06)" }}>
                              <BookOpen className="w-4 h-4" style={{ color: isExpanded ? LIME : "rgba(255,255,255,0.4)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{course.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {course.level && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                                    {course.level}
                                  </span>
                                )}
                                <span className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{
                                    background: course.status === "active" ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
                                    color: course.status === "active" ? "#34D399" : "rgba(255,255,255,0.35)"
                                  }}>
                                  {course.status === "active" ? "Ativo" : course.status === "draft" ? "Rascunho" : course.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isExpanded && !isThisLoading && (
                                <a href="/whatsapp"
                                  onClick={e => e.stopPropagation()}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                  style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}>
                                  <MessageCircle className="w-3 h-3" /> Disparar WA
                                </a>
                              )}
                              <ChevronDown className="w-4 h-4 transition-transform"
                                style={{ color: "rgba(255,255,255,0.25)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                            </div>
                          </button>

                          {/* Lista de alunos */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                {isThisLoading ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-4 h-4 animate-spin text-white/30" />
                                  </div>
                                ) : courseStudents.length === 0 ? (
                                  <p className="text-center text-xs text-white/25 py-6">
                                    Nenhum aluno matriculado ainda
                                  </p>
                                ) : (
                                  <div className="p-3 space-y-1.5">
                                    <p className="text-[10px] text-white/25 px-1 mb-2 font-semibold uppercase tracking-widest">
                                      {courseStudents.length} aluno(s)
                                    </p>
                                    {courseStudents.map(student => (
                                      <div key={student.id}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                        style={{ background: "rgba(255,255,255,0.02)" }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                          style={{ background: "rgba(185,255,75,0.1)", color: LIME }}>
                                          {student.student_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-white truncate">{student.student_name}</p>
                                          {student.student_email && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                              <Mail className="w-3 h-3 text-white/25" />
                                              <p className="text-xs text-white/35 truncate">{student.student_email}</p>
                                            </div>
                                          )}
                                        </div>
                                        {student.progress != null && (
                                          <div className="flex-shrink-0 text-right">
                                            <p className="text-xs font-bold" style={{ color: student.progress >= 100 ? "#34D399" : LIME }}>
                                              {student.progress}%
                                            </p>
                                            <div className="w-16 h-1 rounded-full mt-1 overflow-hidden"
                                              style={{ background: "rgba(255,255,255,0.08)" }}>
                                              <div className="h-full rounded-full transition-all"
                                                style={{
                                                  width: `${student.progress}%`,
                                                  background: student.progress >= 100 ? "#34D399" : LIME
                                                }} />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Criar grupo ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-3xl p-6 space-y-5"
              style={{ background: "#0E0F11", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Novo grupo</h3>
                <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white/70">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nome do grupo *"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white/05 border border-white/10 text-white outline-none"
                  onFocus={e => (e.target.style.borderColor = "rgba(185,255,75,0.4)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descrição (opcional)"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white/05 border border-white/10 text-white/70 outline-none"
                  onFocus={e => (e.target.style.borderColor = "rgba(185,255,75,0.4)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                <div>
                  <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-widest">Cor</p>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                        className="w-7 h-7 rounded-full border-2 transition-transform"
                        style={{ background: c, borderColor: form.color === c ? "white" : "transparent", transform: form.color === c ? "scale(1.2)" : "scale(1)" }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 transition-colors border border-white/08">
                  Cancelar
                </button>
                <button onClick={createGroup} disabled={saving || !form.name.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: LIME, color: "#07080A" }}>
                  {saving ? "Criando…" : "Criar grupo"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Adicionar contatos ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl flex flex-col overflow-hidden"
              style={{ background: "#0E0F11", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "80vh" }}>
              <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div>
                  <h3 className="text-base font-bold text-white">Adicionar contatos</h3>
                  <p className="text-xs text-white/35 mt-0.5">{addingIds.size} selecionado(s)</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white/70">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                  <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                    placeholder="Buscar contato…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white/04 border border-white/08 text-white outline-none" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {contactsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-white/30" />
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-center text-white/25 text-sm py-10">
                    {allContacts.length === 0 ? "Todos os contatos já estão neste grupo." : "Nenhum resultado."}
                  </p>
                ) : filtered.map(c => {
                  const checked = addingIds.has(c.id);
                  return (
                    <button key={c.id} onClick={() => toggleAdd(c.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left mb-1"
                      style={{
                        background: checked ? "rgba(185,255,75,0.07)" : "transparent",
                        border: checked ? "1px solid rgba(185,255,75,0.2)" : "1px solid transparent",
                      }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: checked ? "rgba(185,255,75,0.15)" : "rgba(255,255,255,0.06)", color: checked ? LIME : "rgba(255,255,255,0.5)" }}>
                        {checked ? <Check className="w-3.5 h-3.5" /> : c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                        <p className="text-xs text-white/35 truncate">{c.phone || c.email || "Sem contato"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <button onClick={confirmAdd} disabled={saving || addingIds.size === 0}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: LIME, color: "#07080A" }}>
                  {saving ? "Adicionando…" : `Adicionar ${addingIds.size || ""} contato(s)`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
