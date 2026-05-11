import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi, WifiOff, RefreshCw, Send, Users, Phone,
  CheckSquare, Square, MessageCircle, Loader2, CheckCircle2,
  XCircle, Clock, Search, QrCode, ChevronDown, ChevronUp, BookUser,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIInputField } from "@/components/AIInputField";
import { AITextareaField } from "@/components/AITextareaField";

type WaGroup    = { id: string; name: string; participants: number };
type CrmGroup   = { id: string; name: string; color: string; member_count: number };
type LogEntry   = {
  id: string; time: string;
  type: "group" | "individual" | "blast" | "crm";
  targets: string[]; message: string;
  status: "success" | "partial" | "error"; detail?: string;
};

const WhatsAppPage = () => {
  const [connStatus, setConnStatus] = useState<"idle" | "loading" | "connected" | "disconnected">("idle");
  const [phone, setPhone]           = useState<string | null>(null);

  // Z-API groups
  const [waGroups, setWaGroups]         = useState<WaGroup[]>([]);
  const [waLoading, setWaLoading]       = useState(false);
  const [waSearch, setWaSearch]         = useState("");
  const [selectedWa, setSelectedWa]     = useState<Set<string>>(new Set());

  // CRM groups
  const [crmGroups, setCrmGroups]       = useState<CrmGroup[]>([]);
  const [crmLoading, setCrmLoading]     = useState(false);
  const [selectedCrm, setSelectedCrm]  = useState<string | null>(null);

  const [tab, setTab]                   = useState<"wa" | "crm" | "individual">("wa");
  const [message, setMessage]           = useState("");
  const [indPhone, setIndPhone]         = useState("");
  const [sending, setSending]           = useState(false);
  const [qrCode, setQrCode]             = useState<string | null>(null);
  const [qrLoading, setQrLoading]       = useState(false);
  const [log, setLog]                   = useState<LogEntry[]>([]);
  const [logExpanded, setLogExpanded]   = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredWa = waGroups.filter(g => g.name.toLowerCase().includes(waSearch.toLowerCase()));

  // ── Status Z-API ───────────────────────────────────────────────
  const checkStatus = async (silent = false) => {
    if (!silent) setConnStatus("loading");
    try {
      const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "status" } });
      if (data?.connected) {
        setConnStatus("connected");
        setPhone(data.phone ?? null);
        setQrCode(null);
      } else {
        setConnStatus("disconnected");
      }
    } catch { setConnStatus("disconnected"); }
  };

  const loadWaGroups = async () => {
    setWaLoading(true);
    try {
      const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "groups" } });
      setWaGroups(Array.isArray(data) ? data : []);
    } catch { toast.error("Erro ao carregar grupos WhatsApp"); }
    finally { setWaLoading(false); }
  };

  const loadQr = async () => {
    setQrLoading(true); setQrCode(null);
    try {
      const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "qrcode" } });
      setQrCode(data?.qrcode ?? null);
    } catch { toast.error("Erro ao gerar QR Code"); }
    finally { setQrLoading(false); }
  };

  // ── CRM groups ────────────────────────────────────────────────
  const loadCrmGroups = async () => {
    setCrmLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: grps } = await (supabase as any)
        .from("contact_groups")
        .select("id, name, color")
        .eq("user_id", user.id)
        .order("name");
      if (!grps) { setCrmGroups([]); return; }
      const withCounts = await Promise.all(grps.map(async (g) => {
        const { count } = await (supabase as any)
          .from("contact_group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", g.id);
        return { ...g, member_count: count ?? 0 };
      }));
      setCrmGroups(withCounts);
    } finally { setCrmLoading(false); }
  };

  useEffect(() => {
    checkStatus();
    loadCrmGroups();
    intervalRef.current = setInterval(() => checkStatus(true), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (connStatus === "connected" && waGroups.length === 0) loadWaGroups();
    if (connStatus === "disconnected") loadQr();
  }, [connStatus]);

  // ── Toggle helpers ────────────────────────────────────────────
  const toggleWa = (id: string) => {
    setSelectedWa(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAllWa = () => {
    setSelectedWa(selectedWa.size === filteredWa.length ? new Set() : new Set(filteredWa.map(g => g.id)));
  };

  const addLog = (entry: Omit<LogEntry, "id" | "time">) => {
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setLog(prev => [{ ...entry, id: `${Date.now()}`, time: now }, ...prev].slice(0, 50));
  };

  // ── Envio para grupos Z-API ────────────────────────────────────
  const handleSendWa = async () => {
    if (!message.trim() || selectedWa.size === 0) {
      toast.error("Selecione ao menos 1 grupo e escreva a mensagem."); return;
    }
    setSending(true);
    try {
      const groupIds = [...selectedWa];
      const { data, error } = await supabase.functions.invoke("whatsapp", {
        body: { action: "blast", groups: groupIds, message },
      });
      if (error) throw error;
      const results: { group: string; ok: boolean }[] = data?.results ?? [];
      const ok = results.filter(r => r.ok).length;
      const fail = results.length - ok;
      const s: LogEntry["status"] = fail === 0 ? "success" : ok === 0 ? "error" : "partial";
      addLog({ type: "blast", targets: groupIds.map(id => waGroups.find(g => g.id === id)?.name ?? id), message, status: s, detail: `${ok}/${results.length} enviados` });
      if (s === "success") toast.success(`✅ Enviado para ${ok} grupo(s)!`);
      else if (s === "partial") toast.warning(`⚠️ ${ok} enviados, ${fail} falharam.`);
      else toast.error("Falha ao enviar.");
      setMessage(""); setSelectedWa(new Set());
    } catch (e) { toast.error(`Erro: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setSending(false); }
  };

  // ── Envio para grupo CRM ───────────────────────────────────────
  const handleSendCrm = async () => {
    if (!message.trim() || !selectedCrm) {
      toast.error("Selecione um grupo CRM e escreva a mensagem."); return;
    }
    setSending(true);
    try {
      // Busca os membros com telefone
      const { data: members } = await (supabase as any)
        .from("contact_group_members")
        .select("contacts(phone, name)")
        .eq("group_id", selectedCrm);

      const phones = (members ?? [])
        .map((m: any) => m.contacts?.phone?.replace(/\D/g, ""))
        .filter((p: string | undefined) => p && p.length >= 10);

      if (phones.length === 0) {
        toast.error("Nenhum contato com telefone neste grupo."); return;
      }

      const { data, error } = await supabase.functions.invoke("whatsapp", {
        body: { action: "blast", groups: phones, message },
      });
      if (error) throw error;

      const results: { ok: boolean }[] = data?.results ?? [];
      const ok = results.filter(r => r.ok).length;
      const fail = results.length - ok;
      const s: LogEntry["status"] = fail === 0 ? "success" : ok === 0 ? "error" : "partial";
      const groupName = crmGroups.find(g => g.id === selectedCrm)?.name ?? "Grupo CRM";
      addLog({ type: "crm", targets: [groupName], message, status: s, detail: `${ok}/${phones.length} enviados` });
      if (s === "success") toast.success(`✅ Enviado para ${ok} contato(s)!`);
      else if (s === "partial") toast.warning(`⚠️ ${ok} enviados, ${fail} falharam.`);
      else toast.error("Falha ao enviar.");
      setMessage(""); setSelectedCrm(null);
    } catch (e) { toast.error(`Erro: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setSending(false); }
  };

  // ── Envio individual ───────────────────────────────────────────
  const handleSendIndividual = async () => {
    const clean = indPhone.replace(/\D/g, "");
    if (!message.trim() || clean.length < 10) { toast.error("Número e mensagem obrigatórios."); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp", { body: { action: "send", phone: clean, message } });
      if (error) throw error;
      addLog({ type: "individual", targets: [indPhone], message, status: "success" });
      toast.success("✅ Mensagem enviada!");
      setMessage(""); setIndPhone("");
    } catch (e) {
      toast.error(`Erro: ${e instanceof Error ? e.message : String(e)}`);
      addLog({ type: "individual", targets: [indPhone], message, status: "error" });
    } finally { setSending(false); }
  };

  const canSend = message.trim() && (
    (tab === "wa"         && selectedWa.size > 0) ||
    (tab === "crm"        && !!selectedCrm) ||
    (tab === "individual" && indPhone.replace(/\D/g, "").length >= 10)
  );

  const onSend = tab === "wa" ? handleSendWa : tab === "crm" ? handleSendCrm : handleSendIndividual;

  return (
    <div className="space-y-6 max-w-4xl p-3 md:p-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 break-words">
            <MessageCircle className="w-6 h-6 shrink-0" style={{ color: "#25D366" }} />
            WhatsApp — Z-API
          </h1>
          <p className="text-xs md:text-sm text-white/40 mt-1 break-words">Envie mensagens para grupos e contatos direto do CRM</p>
        </div>
        <button onClick={() => checkStatus()} disabled={connStatus === "loading"}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${connStatus === "loading" ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Status bar */}
      <div className="rounded-2xl p-4 flex items-center gap-4"
        style={{
          background: connStatus === "connected" ? "rgba(37,211,102,0.06)" : "rgba(239,68,68,0.06)",
          border:     connStatus === "connected" ? "1px solid rgba(37,211,102,0.25)" : "1px solid rgba(239,68,68,0.2)",
        }}>
        {connStatus === "loading" ? <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          : connStatus === "connected" ? <Wifi className="w-5 h-5" style={{ color: "#25D366" }} />
          : <WifiOff className="w-5 h-5 text-red-400" />}
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: connStatus === "connected" ? "#25D366" : connStatus === "loading" ? "rgba(255,255,255,0.5)" : "#F87171" }}>
            {connStatus === "loading" ? "Verificando conexão…" : connStatus === "connected" ? "Conectado" : "Desconectado"}
          </p>
          {phone && <p className="text-xs text-white/40 mt-0.5">{phone}</p>}
          {connStatus === "disconnected" && <p className="text-xs text-white/40 mt-0.5">Escaneie o QR Code abaixo para conectar</p>}
        </div>
        {connStatus === "connected" && (
          <button onClick={loadWaGroups} disabled={waLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}>
            <RefreshCw className={`w-3 h-3 ${waLoading ? "animate-spin" : ""}`} />
            {waLoading ? "Carregando…" : `${waGroups.length} grupos WA`}
          </button>
        )}
      </div>

      {/* QR Code */}
      <AnimatePresence>
        {connStatus === "disconnected" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-6 flex flex-col items-center gap-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 text-white/50">
              <QrCode className="w-4 h-4" />
              <span className="text-sm font-medium">QR Code para conectar</span>
            </div>
            {qrLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-white/30" />
                <p className="text-xs text-white/30">Gerando QR Code…</p>
              </div>
            ) : qrCode ? (
              <div className="flex flex-col items-center gap-3">
                <img src={qrCode} alt="QR Code" className="w-52 h-52 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.12)" }} />
                <p className="text-xs text-white/40 text-center">Abra o WhatsApp → Dispositivos Vinculados → Vincular Dispositivo</p>
              </div>
            ) : (
              <button onClick={loadQr} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}>
                <QrCode className="w-4 h-4" /> Gerar QR Code
              </button>
            )}
            <button onClick={() => checkStatus()} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Já escaneou? Verificar conexão →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Painel de envio */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto scrollbar-thin" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          {[
            { id: "wa",         label: "Grupos WhatsApp", icon: Users },
            { id: "crm",        label: "Grupos CRM",      icon: BookUser },
            { id: "individual", label: "Número Individual",icon: Phone },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as "wa" | "crm" | "individual")}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              style={{
                color:        tab === id ? "#25D366" : "rgba(255,255,255,0.35)",
                borderBottom: tab === id ? "2px solid #25D366" : "2px solid transparent",
                background:   tab === id ? "rgba(37,211,102,0.04)" : "transparent",
              }}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">

          {/* ── Aba: Grupos WhatsApp ── */}
          {tab === "wa" && (
            <div className="space-y-3">
              {connStatus !== "connected" ? (
                <p className="text-center text-sm text-white/30 py-6">Conecte o WhatsApp acima para ver os grupos.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/40 uppercase tracking-widest font-semibold">Selecionar grupos</label>
                    <button onClick={toggleAllWa}
                      className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                      style={{ color: selectedWa.size === filteredWa.length && filteredWa.length > 0 ? "#25D366" : "rgba(255,255,255,0.4)" }}>
                      {selectedWa.size === filteredWa.length && filteredWa.length > 0
                        ? <><CheckSquare className="w-3.5 h-3.5" /> Desmarcar todos</>
                        : <><Square className="w-3.5 h-3.5" /> Selecionar todos ({filteredWa.length})</>}
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                    <input value={waSearch} onChange={e => setWaSearch(e.target.value)} placeholder="Buscar grupo…"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-transparent outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }} />
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {waLoading ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-white/30">
                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando grupos…
                      </div>
                    ) : filteredWa.length === 0 ? (
                      <p className="text-center text-white/25 text-sm py-6">
                        {waGroups.length === 0 ? "Nenhum grupo encontrado." : "Nenhum resultado para a busca."}
                      </p>
                    ) : filteredWa.map((g) => {
                      const checked = selectedWa.has(g.id);
                      return (
                        <button key={g.id} onClick={() => toggleWa(g.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                          style={{
                            background: checked ? "rgba(37,211,102,0.08)" : "rgba(255,255,255,0.02)",
                            border:     checked ? "1px solid rgba(37,211,102,0.25)" : "1px solid rgba(255,255,255,0.06)",
                          }}>
                          {checked
                            ? <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color: "#25D366" }} />
                            : <Square className="w-4 h-4 flex-shrink-0 text-white/20" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: checked ? "white" : "rgba(255,255,255,0.65)" }}>{g.name}</p>
                            {g.participants > 0 && <p className="text-[11px] text-white/25">{g.participants} participantes</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedWa.size > 0 && <p className="text-xs font-semibold" style={{ color: "#25D366" }}>{selectedWa.size} grupo(s) selecionado(s)</p>}
                </>
              )}
            </div>
          )}

          {/* ── Aba: Grupos CRM ── */}
          {tab === "crm" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/40 uppercase tracking-widest font-semibold">Selecionar grupo CRM</label>
                <a href="/groups" className="text-xs font-semibold transition-colors"
                  style={{ color: "rgba(185,255,75,0.7)" }}>
                  Gerenciar grupos →
                </a>
              </div>
              {crmLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando grupos CRM…
                </div>
              ) : crmGroups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/30 text-sm mb-3">Nenhum grupo criado ainda.</p>
                  <a href="/groups"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}>
                    Criar grupos de contatos →
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {crmGroups.map(g => {
                    const checked = selectedCrm === g.id;
                    return (
                      <button key={g.id} onClick={() => setSelectedCrm(checked ? null : g.id)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                        style={{
                          background: checked ? `${g.color}10` : "rgba(255,255,255,0.02)",
                          border:     checked ? `1px solid ${g.color}50` : "1px solid rgba(255,255,255,0.07)",
                        }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                          style={{ background: `${g.color}18`, color: g.color }}>
                          {g.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: checked ? "white" : "rgba(255,255,255,0.7)" }}>{g.name}</p>
                          <p className="text-[11px] text-white/30">{g.member_count} contato(s)</p>
                        </div>
                        {checked && <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color: g.color }} />}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedCrm && (
                <p className="text-xs font-semibold" style={{ color: "#25D366" }}>
                  Grupo selecionado: {crmGroups.find(g => g.id === selectedCrm)?.name} — a mensagem será enviada para todos os números do grupo
                </p>
              )}
            </div>
          )}

          {/* ── Aba: Individual ── */}
          {tab === "individual" && (
            <div className="space-y-3">
              <label className="text-xs text-white/40 uppercase tracking-widest font-semibold">Número de destino</label>
              <AIInputField value={indPhone} onChange={e => setIndPhone(e.target.value)}
                placeholder="5511987654321 (com DDI)"
                className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
                fieldLabel="Número de WhatsApp" fieldContext="Envio individual de mensagem WhatsApp" />
              <p className="text-[11px] text-white/25">Formato: DDI + DDD + número. Ex: 5511999998888</p>
            </div>
          )}

          {/* Campo de mensagem */}
          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-widest font-semibold">Mensagem</label>
            <AITextareaField value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Digite a mensagem aqui…" rows={4} className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none leading-relaxed"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
              fieldLabel="Mensagem WhatsApp" fieldContext="Disparo de mensagem via Z-API para grupos ou contatos" />
            <p className="text-[11px] text-white/20 text-right">{message.length} caracteres</p>
          </div>

          {/* Botão enviar */}
          <button onClick={onSend} disabled={sending || !canSend}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: sending ? "rgba(37,211,102,0.12)" : "rgba(37,211,102,0.85)",
              color: sending ? "#25D366" : "#000",
              opacity: !canSend ? 0.4 : 1,
              cursor: sending ? "default" : "pointer",
            }}>
            {sending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
              : <><Send className="w-4 h-4" />
                  {tab === "wa"         ? `Enviar para ${selectedWa.size || "grupos selecionados"}`
                    : tab === "crm"     ? `Enviar para grupo CRM`
                    : "Enviar mensagem"}
                </>}
          </button>
        </div>
      </div>

      {/* Log de disparos */}
      {log.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={() => setLogExpanded(p => !p)}
            className="w-full flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: logExpanded ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/30" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/30">Histórico</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(37,211,102,0.1)", color: "#25D366" }}>{log.length}</span>
            </div>
            {logExpanded ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
          </button>
          <AnimatePresence>
            {logExpanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                  {log.map(entry => (
                    <div key={entry.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {entry.status === "success"
                        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#25D366" }} />
                        : entry.status === "partial"
                          ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-400" />
                          : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold" style={{ color: entry.status === "success" ? "#25D366" : entry.status === "partial" ? "#FBBF24" : "#F87171" }}>
                            {entry.type === "blast" ? `Grupos WA (${entry.targets.length})`
                              : entry.type === "crm" ? `Grupo CRM — ${entry.targets[0]}`
                              : "Número individual"}
                          </span>
                          <span className="text-[10px] text-white/25">{entry.time}</span>
                          {entry.detail && <span className="text-[10px] text-white/35">{entry.detail}</span>}
                        </div>
                        <p className="text-[11px] text-white/55 mt-0.5 truncate">{entry.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default WhatsAppPage;
