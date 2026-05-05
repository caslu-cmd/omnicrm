import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi, WifiOff, RefreshCw, Send, Users, Phone,
  CheckSquare, Square, MessageCircle, Loader2, CheckCircle2,
  XCircle, Clock, Search, QrCode, ChevronDown, ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Group = { id: string; name: string; participants: number };
type LogEntry = {
  id: string;
  time: string;
  type: "group" | "individual" | "blast";
  targets: string[];
  message: string;
  status: "success" | "partial" | "error";
  detail?: string;
};

const WhatsAppPage = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "connected" | "disconnected">("idle");
  const [phone, setPhone] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"groups" | "individual">("groups");
  const [message, setMessage] = useState("");
  const [individualPhone, setIndividualPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logExpanded, setLogExpanded] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const checkStatus = async (silent = false) => {
    if (!silent) setStatus("loading");
    try {
      const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "status" } });
      if (data?.connected) {
        setStatus("connected");
        setPhone(data.phone ?? null);
        setQrCode(null);
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  };

  const loadGroups = async () => {
    setGroupsLoading(true);
    try {
      const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "groups" } });
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar grupos");
    } finally {
      setGroupsLoading(false);
    }
  };

  const loadQr = async () => {
    setQrLoading(true);
    setQrCode(null);
    try {
      const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "qrcode" } });
      setQrCode(data?.qrcode ?? null);
    } catch {
      toast.error("Erro ao gerar QR Code");
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    intervalRef.current = setInterval(() => checkStatus(true), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (status === "connected" && groups.length === 0) loadGroups();
    if (status === "disconnected") loadQr();
  }, [status]);

  const toggleGroup = (id: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedGroups.size === filteredGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredGroups.map(g => g.id)));
    }
  };

  const addLog = (entry: Omit<LogEntry, "id" | "time">) => {
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setLog(prev => [{ ...entry, id: `${Date.now()}`, time: now }, ...prev].slice(0, 50));
  };

  const handleSendGroups = async () => {
    if (!message.trim() || selectedGroups.size === 0) {
      toast.error("Selecione ao menos 1 grupo e escreva uma mensagem.");
      return;
    }
    setSending(true);
    try {
      const groupIds = [...selectedGroups];
      const { data, error } = await supabase.functions.invoke("whatsapp", {
        body: { action: "blast", groups: groupIds, message },
      });
      if (error) throw error;
      const results: { group: string; ok: boolean }[] = data?.results ?? [];
      const ok = results.filter(r => r.ok).length;
      const fail = results.length - ok;
      const status: LogEntry["status"] = fail === 0 ? "success" : ok === 0 ? "error" : "partial";
      addLog({
        type: "blast",
        targets: groupIds.map(id => groups.find(g => g.id === id)?.name ?? id),
        message,
        status,
        detail: `${ok}/${results.length} enviados com sucesso`,
      });
      if (status === "success") toast.success(`✅ Mensagem enviada para ${ok} grupo(s)!`);
      else if (status === "partial") toast.warning(`⚠️ ${ok} enviados, ${fail} falharam.`);
      else toast.error("Falha ao enviar para os grupos.");
      setMessage("");
      setSelectedGroups(new Set());
    } catch (e) {
      toast.error(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSending(false);
    }
  };

  const handleSendIndividual = async () => {
    const cleanPhone = individualPhone.replace(/\D/g, "");
    if (!message.trim() || cleanPhone.length < 10) {
      toast.error("Informe um número válido e uma mensagem.");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp", {
        body: { action: "send", phone: cleanPhone, message },
      });
      if (error) throw error;
      addLog({
        type: "individual",
        targets: [individualPhone],
        message,
        status: "success",
      });
      toast.success("✅ Mensagem enviada!");
      setMessage("");
      setIndividualPhone("");
    } catch (e) {
      toast.error(`Erro: ${e instanceof Error ? e.message : String(e)}`);
      addLog({ type: "individual", targets: [individualPhone], message, status: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6" style={{ color: "#25D366" }} />
            WhatsApp — Z-API
          </h1>
          <p className="text-sm text-white/40 mt-1">Envie mensagens para grupos e contatos direto do CRM</p>
        </div>
        <button
          onClick={() => checkStatus()}
          disabled={status === "loading"}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${status === "loading" ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Status bar */}
      <div className="rounded-2xl p-4 flex items-center gap-4"
        style={{
          background: status === "connected" ? "rgba(37,211,102,0.06)" : "rgba(239,68,68,0.06)",
          border: status === "connected" ? "1px solid rgba(37,211,102,0.25)" : "1px solid rgba(239,68,68,0.2)",
        }}>
        {status === "loading" ? (
          <Loader2 className="w-5 h-5 animate-spin text-white/40" />
        ) : status === "connected" ? (
          <Wifi className="w-5 h-5" style={{ color: "#25D366" }} />
        ) : (
          <WifiOff className="w-5 h-5 text-red-400" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: status === "connected" ? "#25D366" : status === "loading" ? "rgba(255,255,255,0.5)" : "#F87171" }}>
            {status === "loading" ? "Verificando conexão…" : status === "connected" ? "Conectado" : "Desconectado"}
          </p>
          {phone && <p className="text-xs text-white/40 mt-0.5">{phone}</p>}
          {status === "disconnected" && <p className="text-xs text-white/40 mt-0.5">Escaneie o QR Code abaixo para conectar</p>}
        </div>
        {status === "connected" && (
          <button onClick={loadGroups} disabled={groupsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}>
            <RefreshCw className={`w-3 h-3 ${groupsLoading ? "animate-spin" : ""}`} />
            {groupsLoading ? "Carregando…" : `${groups.length} grupos`}
          </button>
        )}
      </div>

      {/* QR Code (se desconectado) */}
      <AnimatePresence>
        {status === "disconnected" && (
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
              <button onClick={loadQr}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
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

      {/* Painel de envio (só se conectado) */}
      <AnimatePresence>
        {status === "connected" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              {[
                { id: "groups", label: "Grupos", icon: Users },
                { id: "individual", label: "Número Individual", icon: Phone },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id as "groups" | "individual")}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors"
                  style={{
                    color: tab === id ? "#25D366" : "rgba(255,255,255,0.35)",
                    borderBottom: tab === id ? "2px solid #25D366" : "2px solid transparent",
                    background: tab === id ? "rgba(37,211,102,0.04)" : "transparent",
                  }}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {/* Aba Grupos */}
              {tab === "groups" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/40 uppercase tracking-widest font-semibold">Selecionar grupos</label>
                    <button onClick={toggleAll}
                      className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                      style={{ color: selectedGroups.size === filteredGroups.length && filteredGroups.length > 0 ? "#25D366" : "rgba(255,255,255,0.4)" }}>
                      {selectedGroups.size === filteredGroups.length && filteredGroups.length > 0
                        ? <><CheckSquare className="w-3.5 h-3.5" /> Desmarcar todos</>
                        : <><Square className="w-3.5 h-3.5" /> Selecionar todos ({filteredGroups.length})</>}
                    </button>
                  </div>

                  {/* Busca de grupo */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                    <input
                      value={groupSearch}
                      onChange={e => setGroupSearch(e.target.value)}
                      placeholder="Buscar grupo…"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-transparent outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
                    />
                  </div>

                  {/* Lista de grupos */}
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {groupsLoading ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-white/30">
                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando grupos…
                      </div>
                    ) : filteredGroups.length === 0 ? (
                      <p className="text-center text-white/25 text-sm py-6">
                        {groups.length === 0 ? "Nenhum grupo encontrado. Recarregue os grupos." : "Nenhum grupo corresponde à busca."}
                      </p>
                    ) : filteredGroups.map((g) => {
                      const checked = selectedGroups.has(g.id);
                      return (
                        <button key={g.id} onClick={() => toggleGroup(g.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                          style={{
                            background: checked ? "rgba(37,211,102,0.08)" : "rgba(255,255,255,0.02)",
                            border: checked ? "1px solid rgba(37,211,102,0.25)" : "1px solid rgba(255,255,255,0.06)",
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

                  {selectedGroups.size > 0 && (
                    <p className="text-xs font-semibold" style={{ color: "#25D366" }}>
                      {selectedGroups.size} grupo(s) selecionado(s)
                    </p>
                  )}
                </div>
              )}

              {/* Aba Individual */}
              {tab === "individual" && (
                <div className="space-y-3">
                  <label className="text-xs text-white/40 uppercase tracking-widest font-semibold">Número de destino</label>
                  <input
                    value={individualPhone}
                    onChange={e => setIndividualPhone(e.target.value)}
                    placeholder="5511987654321 (com DDI)"
                    className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
                  />
                  <p className="text-[11px] text-white/25">Formato: código do país + DDD + número. Ex: 5511999998888</p>
                </div>
              )}

              {/* Campo de mensagem (compartilhado) */}
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase tracking-widest font-semibold">Mensagem</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Digite a mensagem aqui…"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
                />
                <p className="text-[11px] text-white/20 text-right">{message.length} caracteres</p>
              </div>

              {/* Botão de envio */}
              <button
                onClick={tab === "groups" ? handleSendGroups : handleSendIndividual}
                disabled={sending || !message.trim() || (tab === "groups" ? selectedGroups.size === 0 : individualPhone.replace(/\D/g,"").length < 10)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: sending ? "rgba(37,211,102,0.12)" : "rgba(37,211,102,0.85)",
                  color: sending ? "#25D366" : "#000",
                  opacity: (!message.trim() || (tab === "groups" ? selectedGroups.size === 0 : individualPhone.replace(/\D/g,"").length < 10)) ? 0.4 : 1,
                  cursor: sending ? "default" : "pointer",
                }}>
                {sending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
                  : <><Send className="w-4 h-4" /> {tab === "groups" ? `Enviar para ${selectedGroups.size || "grupos selecionados"}` : "Enviar mensagem"}</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log de disparos */}
      {log.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={() => setLogExpanded(p => !p)}
            className="w-full flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: logExpanded ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/30" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/30">Histórico de disparos</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(37,211,102,0.1)", color: "#25D366" }}>{log.length}</span>
            </div>
            {logExpanded ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
          </button>
          <AnimatePresence>
            {logExpanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                className="overflow-hidden">
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
                            {entry.type === "blast" ? `Disparo em grupo (${entry.targets.length})` : "Número individual"}
                          </span>
                          <span className="text-[10px] text-white/25">{entry.time}</span>
                          {entry.detail && <span className="text-[10px] text-white/35">{entry.detail}</span>}
                        </div>
                        <p className="text-[11px] text-white/40 truncate mt-0.5">
                          {entry.targets.slice(0, 3).join(", ")}{entry.targets.length > 3 ? ` +${entry.targets.length - 3}` : ""}
                        </p>
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
