import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layout, Download, Pencil, Trash2, Plus, Loader2, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SavedLP {
  id: string;
  title: string;
  slug: string;
  html_content: string;
  created_at: string;
  client_id: string | null;
}

function downloadHtml(html: string, name: string) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([html], { type: "text/html" })),
    download: `${name}.html`,
  });
  a.click();
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item      = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function PagesPage() {
  const [pages, setPages]     = useState<SavedLP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("landing_pages")
      .select("id, title, slug, html_content, created_at, client_id")
      .order("created_at", { ascending: false });
    if (!error && data) setPages(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(id);
    const { error } = await (supabase as any).from("landing_pages").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); setDeleting(null); return; }
    setPages(prev => prev.filter(p => p.id !== id));
    toast.success("Página excluída");
    setDeleting(null);
  };

  const filtered = search
    ? pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : pages;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6 min-w-0">

      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Landing Pages</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : `${pages.length} página${pages.length !== 1 ? "s" : ""} criada${pages.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={load} className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => window.open("/tomas", "_blank")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nova Landing Page
          </button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar páginas..."
          className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={item} className="flex flex-col items-center gap-4 py-32 text-center text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
            <Layout className="h-7 w-7 opacity-40" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {search ? "Nenhuma página encontrada" : "Nenhuma landing page criada ainda"}
            </p>
            {!search && (
              <p className="text-xs mt-1 opacity-60">
                Gere sua primeira LP no Tomás e ela aparecerá aqui
              </p>
            )}
          </div>
          {!search && (
            <button
              onClick={() => window.open("/tomas", "_blank")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Criar primeira LP
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(page => (
            <motion.div
              key={page.id}
              variants={item}
              className="group rounded-xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5"
            >
              {/* Thumbnail */}
              <div
                className="relative overflow-hidden bg-muted cursor-pointer"
                style={{ height: 190 }}
                onClick={() => window.open(`/tomas?pageId=${page.id}`, "_blank")}
              >
                <iframe
                  srcDoc={page.html_content}
                  sandbox="allow-same-origin"
                  scrolling="no"
                  title={page.title}
                  style={{
                    width: 1280,
                    height: 900,
                    transform: "scale(0.195)",
                    transformOrigin: "top left",
                    pointerEvents: "none",
                    border: "none",
                  }}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                  <span className="flex items-center gap-1.5 text-white text-xs font-semibold bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Pencil className="h-3 w-3" /> Abrir no Editor
                  </span>
                </div>
              </div>

              {/* Info + actions */}
              <div className="p-4">
                <p className="text-sm font-semibold text-foreground truncate" title={page.title}>{page.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(page.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <button
                    onClick={() => window.open(`/tomas?pageId=${page.id}`, "_blank")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => downloadHtml(page.html_content, page.slug || page.title)}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Baixar HTML"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(page.id, page.title)}
                    disabled={deleting === page.id}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50"
                    title="Excluir"
                  >
                    {deleting === page.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
