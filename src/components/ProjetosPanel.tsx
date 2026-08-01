/**
 * Projetos do cliente: cada projeto guarda seus arquivos, e a orquestradora
 * (Luna) é acionada JÁ COM esse material.
 *
 * Existe porque anexar arquivo solto não se sustentava: o material se perdia a
 * cada demanda e precisava ser reanexado. Aqui o texto extraído fica gravado no
 * banco — a extração acontece uma vez e vale em qualquer máquina.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { FolderPlus, Paperclip, Loader2, Trash2, Play, FileText, ChevronLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lerDocumentos, EXTENSOES_ACEITAS } from "@/lib/lerDocumento";

const LIME = "#B9FF4B";

interface Projeto {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
  arquivos?: number;
}

interface Arquivo {
  id: string;
  nome: string;
  tipo: string | null;
  tamanho: number | null;
  texto: string | null;
  erro: string | null;
}

interface Props {
  clientId: string;
  clientName: string;
  clientIndustry?: string;
  /** Dispara a orquestração com o material do projeto já lido. */
  onAcionar: (dados: { projeto: Projeto; documentos: { nome: string; conteudo: string }[]; demanda: string }) => void;
}

const caixa = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" };

export default function ProjetosPanel({ clientId, clientName, clientIndustry, onAcionar }: Props) {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [aberto, setAberto] = useState<Projeto | null>(null);
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [subindo, setSubindo] = useState(false);
  const [demanda, setDemanda] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const carregar = useCallback(async () => {
    if (!clientId) return;
    setCarregando(true);
    const { data } = await (supabase as any)
      .from("client_projects")
      .select("id, nome, descricao, created_at, project_files(count)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setProjetos(
      ((data ?? []) as any[]).map((p) => ({
        id: p.id, nome: p.nome, descricao: p.descricao, created_at: p.created_at,
        arquivos: p.project_files?.[0]?.count ?? 0,
      })),
    );
    setCarregando(false);
  }, [clientId]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrir = async (p: Projeto) => {
    setAberto(p);
    setArquivos([]);
    const { data } = await (supabase as any)
      .from("project_files")
      .select("id, nome, tipo, tamanho, texto, erro")
      .eq("project_id", p.id)
      .order("created_at");
    setArquivos((data ?? []) as Arquivo[]);
  };

  const criar = async () => {
    if (!nome.trim()) { toast.error("Dê um nome ao projeto."); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Sua sessão expirou."); return; }
    const { data, error } = await (supabase as any)
      .from("client_projects")
      .insert({ user_id: session.user.id, client_id: clientId, nome: nome.trim(), descricao: descricao.trim() || null })
      .select("id, nome, descricao, created_at")
      .single();
    if (error) { toast.error("Não consegui criar o projeto."); return; }
    setNome(""); setDescricao(""); setCriando(false);
    await carregar();
    abrir({ ...(data as Projeto), arquivos: 0 });
  };

  const anexar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !aberto) return;
    setSubindo(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sua sessão expirou."); return; }

      // Extrai AQUI e grava o texto: os agentes leem do banco, e um arquivo
      // ilegível é registrado como tal em vez de virar silêncio.
      const lidos = await lerDocumentos(files);
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const lido = lidos[i];
        const caminho = `${session.user.id}/${aberto.id}/${Date.now()}-${f.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("projetos").upload(caminho, f, { upsert: false });
        if (upErr) toast.error(`Não consegui guardar ${f.name}: ${upErr.message}`);

        await (supabase as any).from("project_files").insert({
          project_id: aberto.id,
          user_id: session.user.id,
          nome: f.name,
          tipo: f.type || null,
          tamanho: f.size,
          storage_path: upErr ? null : caminho,
          texto: lido.erro ? null : lido.conteudo,
          erro: lido.erro ?? null,
        });
        if (lido.erro) toast.error(`${f.name}: ${lido.erro}`);
      }
      await abrir(aberto);
      await carregar();
      toast.success(files.length === 1 ? "Arquivo anexado." : `${files.length} arquivos anexados.`);
    } finally {
      setSubindo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remover = async (a: Arquivo) => {
    await (supabase as any).from("project_files").delete().eq("id", a.id);
    if (aberto) await abrir(aberto);
    await carregar();
  };

  const acionar = () => {
    if (!aberto) return;
    const legiveis = arquivos.filter((a) => a.texto?.trim());
    if (!legiveis.length) { toast.error("Nenhum arquivo legível neste projeto."); return; }
    if (!demanda.trim()) { toast.error("Diga o que a Luna deve fazer com esse material."); return; }
    onAcionar({
      projeto: aberto,
      documentos: legiveis.map((a) => ({ nome: a.nome, conteudo: a.texto as string })),
      demanda: demanda.trim(),
    });
  };

  const kb = (n: number | null) => (n ? `${Math.round(n / 1024)} KB` : "—");

  // ── Lista de projetos ──
  if (!aberto) {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[15px] font-bold" style={{ color: "#F0F0F0" }}>Projetos de {clientName}</div>
            <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.42)" }}>
              Cada projeto guarda seus arquivos. A Luna é acionada já com esse material lido.
            </div>
          </div>
          <button onClick={() => setCriando((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: LIME, color: "#07080A" }}>
            <FolderPlus className="w-3.5 h-3.5" /> Novo projeto
          </button>
        </div>

        {criando && (
          <div className="rounded-2xl p-4 space-y-2.5" style={caixa}>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do projeto — ex.: Lançamento da linha de inverno"
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
              style={{ ...caixa, color: "#E8E8E8" }} />
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2}
              placeholder="O que é esse projeto (opcional)"
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
              style={{ ...caixa, color: "#E8E8E8" }} />
            <div className="flex gap-2">
              <button onClick={criar} className="px-3.5 py-2 rounded-xl text-[12px] font-bold" style={{ background: LIME, color: "#07080A" }}>Criar</button>
              <button onClick={() => setCriando(false)} className="px-3.5 py-2 rounded-xl text-[12px] font-semibold" style={{ ...caixa, color: "rgba(255,255,255,0.6)" }}>Cancelar</button>
            </div>
          </div>
        )}

        {carregando ? (
          <div className="flex items-center gap-2 text-[13px] py-8 justify-center" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Loader2 className="w-4 h-4 animate-spin" /> carregando…
          </div>
        ) : projetos.length === 0 ? (
          <div className="rounded-2xl p-8 text-center text-[13px]" style={{ ...caixa, color: "rgba(255,255,255,0.45)" }}>
            Nenhum projeto ainda. Crie um e anexe o briefing, o contrato ou o material da campanha.
          </div>
        ) : (
          <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {projetos.map((p) => (
              <button key={p.id} onClick={() => abrir(p)} className="text-left rounded-2xl p-4 transition-all hover:brightness-125" style={caixa}>
                <div className="text-[14px] font-bold mb-1" style={{ color: "#F0F0F0" }}>{p.nome}</div>
                {p.descricao && <div className="text-[12px] mb-2 line-clamp-2" style={{ color: "rgba(255,255,255,0.45)" }}>{p.descricao}</div>}
                <div className="text-[11px] flex items-center gap-1.5" style={{ color: LIME }}>
                  <Paperclip className="w-3 h-3" /> {p.arquivos} {p.arquivos === 1 ? "arquivo" : "arquivos"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Dentro de um projeto ──
  const legiveis = arquivos.filter((a) => a.texto?.trim()).length;
  return (
    <div className="p-5 space-y-4">
      <button onClick={() => { setAberto(null); setDemanda(""); }}
        className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
        <ChevronLeft className="w-3.5 h-3.5" /> Todos os projetos
      </button>

      <div>
        <div className="text-[17px] font-bold" style={{ color: "#F0F0F0" }}>{aberto.nome}</div>
        {aberto.descricao && <div className="text-[12.5px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{aberto.descricao}</div>}
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={caixa}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.65)" }}>Arquivos do projeto</span>
          <button onClick={() => inputRef.current?.click()} disabled={subindo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}>
            {subindo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
            {subindo ? "Lendo…" : "Anexar arquivos"}
          </button>
          <input ref={inputRef} type="file" multiple accept={EXTENSOES_ACEITAS} onChange={anexar} className="hidden" />
        </div>

        {arquivos.length === 0 ? (
          <div className="text-[12.5px] py-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Nenhum arquivo. Aceita PDF, DOCX, TXT, MD, CSV, JSON e HTML.
          </div>
        ) : (
          <div className="space-y-1.5">
            {arquivos.map((a) => (
              <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={caixa}>
                {a.erro
                  ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F0A87C" }} />
                  : <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: LIME }} />}
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] truncate" style={{ color: "#E8E8E8" }}>{a.nome}</div>
                  <div className="text-[10.5px]" style={{ color: a.erro ? "#F0A87C" : "rgba(255,255,255,0.35)" }}>
                    {a.erro ?? `${kb(a.tamanho)} · ${(a.texto ?? "").length.toLocaleString("pt-BR")} caracteres lidos`}
                  </div>
                </div>
                <button onClick={() => remover(a)} className="p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={{ background: `${LIME}0A`, border: `1px solid ${LIME}2A` }}>
        <div className="text-[12px] font-bold" style={{ color: LIME }}>Acionar a Luna com este material</div>
        <textarea value={demanda} onChange={(e) => setDemanda(e.target.value)} rows={3}
          placeholder={`O que o time deve fazer com esses arquivos? Ex.: "leia o briefing e monte o calendário do mês para ${clientName}${clientIndustry ? ` (${clientIndustry})` : ""}"`}
          className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
          style={{ ...caixa, color: "#E8E8E8" }} />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            {legiveis} {legiveis === 1 ? "arquivo vai" : "arquivos vão"} junto para cada agente que ela acionar.
          </span>
          <button onClick={acionar} disabled={!legiveis}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: legiveis ? LIME : "rgba(255,255,255,0.08)", color: legiveis ? "#07080A" : "rgba(255,255,255,0.35)" }}>
            <Play className="w-3.5 h-3.5" /> Acionar Luna
          </button>
        </div>
      </div>
    </div>
  );
}
