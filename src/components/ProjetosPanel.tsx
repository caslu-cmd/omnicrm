/**
 * Projetos do cliente: cada projeto guarda seus arquivos, e a orquestradora
 * (Aira) é acionada JÁ COM esse material.
 *
 * Existe porque anexar arquivo solto não se sustentava: o material se perdia a
 * cada demanda e precisava ser reanexado. Aqui o texto extraído fica gravado no
 * banco — a extração acontece uma vez e vale em qualquer máquina.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { FolderPlus, Paperclip, Loader2, Trash2, Play, FileText, ChevronLeft, AlertTriangle, Link as LinkIcon } from "lucide-react";
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
  /** Agentes habilitados para este cliente, para ela poder chamar um só. */
  agentes?: { id: string; name: string; role?: string }[];
  /** Dispara a orquestração com o material do projeto já lido. */
  onAcionar: (dados: {
    projeto: Projeto;
    documentos: { nome: string; conteudo: string }[];
    demanda: string;
    /** Entra todo mundo, em vez de a Aira escolher um subconjunto. */
    todoOTime: boolean;
    /** Quando preenchido, SÓ estes trabalham — a Aira não escolhe. */
    somenteEstes?: string[];
  }) => void;
}

const caixa = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" };

export default function ProjetosPanel({ clientId, clientName, clientIndustry, agentes, onAcionar }: Props) {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [aberto, setAberto] = useState<Projeto | null>(null);
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [subindo, setSubindo] = useState(false);
  const [demanda, setDemanda] = useState("");
  const [novoLink, setNovoLink] = useState("");
  const [lendoLink, setLendoLink] = useState(false);
  /**
   * Quem trabalha neste acionamento.
   * "time" = todo mundo (o que ela pediu como padrão) · "aira" = a Aira escolhe
   * · "um" = um agente só, para quando ela quer só a Marcela produzindo posts
   * em cima do material do projeto.
   */
  const [quem, setQuem] = useState<"time" | "aira" | "um">("time");
  const [agenteUnico, setAgenteUnico] = useState("");

  /**
   * Produção em lote: quantos posts únicos, quantos carrosséis e em que
   * formatos. Vira uma linha exata no pedido do agente — "faça uns posts"
   * devolve quantidade aleatória, e ela precisa de número fechado para o mês.
   */
  const [qtdPosts, setQtdPosts] = useState(0);
  const [qtdCarrosseis, setQtdCarrosseis] = useState(0);
  const [comFeed, setComFeed] = useState(true);
  const [comStory, setComStory] = useState(true);

  const linhaDeProducao = () => {
    const partes: string[] = [];
    if (qtdPosts > 0) partes.push(`${qtdPosts} ${qtdPosts === 1 ? "post único" : "posts únicos"} (uma arte só)`);
    if (qtdCarrosseis > 0) partes.push(`${qtdCarrosseis} ${qtdCarrosseis === 1 ? "carrossel" : "carrosséis"} (múltiplos slides, indique quantos slides cada um tem)`);
    if (!partes.length) return "";
    const formatos = [comFeed && "Feed 4:5 (1080×1350)", comStory && "Story 9:16 (1080×1920)"].filter(Boolean);
    const linhaFormato = formatos.length
      ? ` Entregue CADA peça nos formatos: ${formatos.join(" e ")} — a versão de Story é adaptação da mesma peça, não conteúdo novo.`
      : "";
    return `\n\nQUANTIDADE EXATA — entregue ${partes.join(" e ")}, numerados.${linhaFormato} Não entregue a mais nem a menos.`;
  };
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

  /**
   * Link vira material do projeto igual a um arquivo: guardamos o TEXTO da
   * página no momento em que ela é adicionada. Assim o agente lê o que a Carol
   * viu, o site pode sair do ar depois, e nenhuma conversa paga o custo de
   * rebuscar a página toda vez.
   */
  const adicionarLink = async () => {
    const url = novoLink.trim();
    if (!url || !aberto) return;
    setLendoLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sua sessão expirou."); return; }
      const { data, error } = await supabase.functions.invoke("ler-link", { body: { url } });
      if (error) { toast.error("Não consegui ler o link."); return; }
      const lida = data as { url: string; conteudo: string; erro?: string; titulo?: string };
      await (supabase as any).from("project_files").insert({
        project_id: aberto.id,
        user_id: session.user.id,
        nome: lida.titulo ? `${lida.titulo} — ${lida.url}` : lida.url,
        tipo: "link",
        tamanho: lida.conteudo?.length ?? 0,
        storage_path: null,
        texto: lida.erro ? null : lida.conteudo,
        erro: lida.erro ?? null,
      });
      if (lida.erro) toast.error(`${url}: ${lida.erro}`);
      else toast.success("Link lido e guardado no projeto.");
      setNovoLink("");
      await abrir(aberto);
      await carregar();
    } finally {
      setLendoLink(false);
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
    if (!demanda.trim()) { toast.error("Diga o que a Aira deve fazer com esse material."); return; }
    if (quem === "um" && !agenteUnico) { toast.error("Escolha qual agente vai trabalhar."); return; }
    onAcionar({
      projeto: aberto,
      documentos: legiveis.map((a) => ({ nome: a.nome, conteudo: a.texto as string })),
      demanda: demanda.trim() + linhaDeProducao(),
      todoOTime: quem === "time",
      somenteEstes: quem === "um" ? [agenteUnico] : undefined,
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
              Cada projeto guarda seus arquivos. A Aira é acionada já com esse material lido.
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
          /* O anexo e o link vivem DENTRO de um projeto. Sem projeto, a tela
             era um texto e um botão pequeno no canto — e a Carol concluiu, com
             razão, que não existia opção de anexar. Aqui o caminho é o próprio
             vazio. */
          <button onClick={() => setCriando(true)}
            className="w-full rounded-2xl p-10 flex flex-col items-center gap-3 transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(185,255,75,0.35)" }}>
            <FolderPlus className="w-8 h-8" style={{ color: LIME }} />
            <span className="text-[15px] font-bold" style={{ color: "#F0F0F0" }}>Criar o primeiro projeto</span>
            <span className="text-[12.5px] max-w-md" style={{ color: "rgba(255,255,255,0.45)" }}>
              É dentro do projeto que você anexa arquivos e links. Depois é só acionar a Aira,
              e o time inteiro trabalha com esse material.
            </span>
          </button>
        ) : (
          <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {projetos.map((p) => (
              <button key={p.id} onClick={() => abrir(p)} className="text-left rounded-2xl p-4 transition-all hover:brightness-125" style={caixa}>
                <div className="text-[14px] font-bold mb-1" style={{ color: "#F0F0F0" }}>{p.nome}</div>
                {p.descricao && <div className="text-[12px] mb-2 line-clamp-2" style={{ color: "rgba(255,255,255,0.45)" }}>{p.descricao}</div>}
                <div className="text-[11px] flex items-center justify-between gap-2" style={{ color: LIME }}>
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3 h-3" /> {p.arquivos} {p.arquivos === 1 ? "item" : "itens"}
                  </span>
                  {/* Diz o que o clique faz: o cartão não parecia clicável, e é
                      só dentro dele que existe anexar arquivo e link. */}
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>abrir para anexar →</span>
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

        {/* Link entra como material, igual a um arquivo */}
        <div className="flex gap-2">
          <input
            value={novoLink}
            onChange={(e) => setNovoLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarLink(); } }}
            placeholder="Cole um link — site do cliente, notícia, referência"
            className="flex-1 px-3 py-2 rounded-xl text-[12.5px] outline-none"
            style={{ ...caixa, color: "#E8E8E8" }}
          />
          <button onClick={adicionarLink} disabled={!novoLink.trim() || lendoLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-bold flex-shrink-0"
            style={{ background: novoLink.trim() ? LIME : "rgba(255,255,255,0.06)", color: novoLink.trim() ? "#07080A" : "rgba(255,255,255,0.35)" }}>
            {lendoLink ? <Loader2 className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
            {lendoLink ? "Lendo…" : "Ler link"}
          </button>
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
                  : a.tipo === "link"
                    ? <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: LIME }} />
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
        <div className="text-[12px] font-bold" style={{ color: LIME }}>Acionar a Aira com este material</div>
        <textarea value={demanda} onChange={(e) => setDemanda(e.target.value)} rows={3}
          placeholder={`O que o time deve fazer com esses arquivos? Ex.: "leia o briefing e monte o calendário do mês para ${clientName}${clientIndustry ? ` (${clientIndustry})` : ""}"`}
          className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
          style={{ ...caixa, color: "#E8E8E8" }} />
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            ["time", "Time inteiro"],
            ["aira", "A Aira escolhe"],
            ["um", "Só um agente"],
          ] as const).map(([id, rotulo]) => (
            <button key={id} onClick={() => setQuem(id)}
              className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all"
              style={quem === id
                ? { background: `${LIME}18`, border: `1px solid ${LIME}55`, color: LIME }
                : { ...caixa, color: "rgba(255,255,255,0.5)" }}>
              {rotulo}
            </button>
          ))}
          {quem === "um" && (
            <select value={agenteUnico} onChange={(e) => setAgenteUnico(e.target.value)}
              className="px-2 py-[7px] rounded-lg text-[11.5px]"
              style={{ ...caixa, color: "#E8E8E8" }}>
              <option value="">Escolha o agente…</option>
              {(agentes ?? []).map((a) => (
                <option key={a.id} value={a.id} style={{ background: "#0F1115" }}>
                  {a.name}{a.role ? ` — ${a.role}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Quantidade fechada: "faça uns posts" devolve número aleatório, e ela
            precisa de quantidade exata para fechar o mês. */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {([
            ["Posts únicos", qtdPosts, setQtdPosts] as const,
            ["Carrosséis", qtdCarrosseis, setQtdCarrosseis] as const,
          ]).map(([rotulo, valor, set]) => (
            <label key={rotulo} className="flex items-center gap-2">
              <input type="number" min={0} max={40} value={valor}
                onChange={(e) => set(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
                className="w-14 px-2 py-1.5 rounded-lg text-[12.5px] text-center outline-none"
                style={{ ...caixa, color: "#E8E8E8" }} />
              <span className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.6)" }}>{rotulo}</span>
            </label>
          ))}
          <span className="w-px h-5" style={{ background: "rgba(255,255,255,0.12)" }} />
          {([["Feed", comFeed, setComFeed] as const, ["Story", comStory, setComStory] as const]).map(([rotulo, valor, set]) => (
            <label key={rotulo} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={valor} onChange={(e) => set(e.target.checked)}
                style={{ accentColor: LIME, width: 15, height: 15 }} />
              <span className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.6)" }}>{rotulo}</span>
            </label>
          ))}
        </div>
        {(qtdPosts > 0 || qtdCarrosseis > 0) && (
          <div className="text-[10.5px] leading-snug px-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Vai pedir {qtdPosts > 0 ? `${qtdPosts} post${qtdPosts > 1 ? "s" : ""} único${qtdPosts > 1 ? "s" : ""}` : ""}
            {qtdPosts > 0 && qtdCarrosseis > 0 ? " e " : ""}
            {qtdCarrosseis > 0 ? `${qtdCarrosseis} carrossel${qtdCarrosseis > 1 ? "s" : ""}` : ""}
            {(comFeed || comStory) ? `, cada peça em ${[comFeed && "Feed", comStory && "Story"].filter(Boolean).join(" e ")}.` : "."}
            {qtdPosts + qtdCarrosseis > 12 ? " Volume alto — pode vir em partes." : ""}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            {legiveis} {legiveis === 1 ? "item vai" : "itens vão"} junto — arquivos e links do projeto.
          </span>
          <button onClick={acionar} disabled={!legiveis}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: legiveis ? LIME : "rgba(255,255,255,0.08)", color: legiveis ? "#07080A" : "rgba(255,255,255,0.35)" }}>
            <Play className="w-3.5 h-3.5" /> Acionar Aira
          </button>
        </div>
      </div>
    </div>
  );
}
