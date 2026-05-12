import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Filter, MessageSquare, Phone, Mail, Instagram, Send,
  Paperclip, Smile, MoreVertical, Tag, Clock, User, Star, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AITextareaField } from "@/components/AITextareaField";

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  channel: "whatsapp" | "email" | "instagram" | "messenger";
  lastMessage: string;
  time: string;
  unread: number;
  tags: string[];
}

const conversations: Conversation[] = [
  { id: 1, name: "Maria Silva", avatar: "MS", channel: "whatsapp", lastMessage: "Olá, gostaria de saber mais sobre o plano Pro...", time: "2 min", unread: 3, tags: ["Lead Quente"] },
  { id: 2, name: "João Pereira", avatar: "JP", channel: "email", lastMessage: "Re: Proposta comercial - Projeto Alpha", time: "15 min", unread: 1, tags: ["Cliente"] },
  { id: 3, name: "Ana Costa", avatar: "AC", channel: "instagram", lastMessage: "Vocês fazem entrega para São Paulo?", time: "1h", unread: 0, tags: ["Novo"] },
  { id: 4, name: "Carlos Mendes", avatar: "CM", channel: "whatsapp", lastMessage: "Perfeito, pode me enviar o contrato?", time: "2h", unread: 0, tags: ["Negociação"] },
  { id: 5, name: "Beatriz Lima", avatar: "BL", channel: "messenger", lastMessage: "Obrigada pela resposta rápida!", time: "3h", unread: 0, tags: ["Suporte"] },
  { id: 6, name: "Roberto Santos", avatar: "RS", channel: "email", lastMessage: "Preciso cancelar minha assinatura", time: "5h", unread: 2, tags: ["Urgente"] },
];

const initialMessages = [
  { id: 1, from: "client", text: "Olá, gostaria de saber mais sobre o plano Pro. Quais são as funcionalidades incluídas?", time: "14:32" },
  { id: 2, from: "agent", text: "Olá Maria! 😊 O plano Pro inclui:\n\n• Inbox unificado ilimitado\n• Automações avançadas\n• Pipelines ilimitados\n• Relatórios completos\n• Suporte prioritário\n\nGostaria de agendar uma demo?", time: "14:35" },
  { id: 3, from: "client", text: "Sim! Tenho disponibilidade amanhã à tarde. Vocês podem fazer uma apresentação para minha equipe também?", time: "14:38" },
  { id: 4, from: "client", text: "Somos 5 pessoas no time de vendas.", time: "14:38" },
];

const channelIcon: Record<string, typeof MessageSquare> = {
  whatsapp: Phone, email: Mail, instagram: Instagram, messenger: MessageSquare,
};
const channelColor: Record<string, string> = {
  whatsapp: "text-secondary", email: "text-primary", instagram: "text-accent-foreground", messenger: "text-primary",
};

const InboxPage = () => {
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("Todos");
  const [messages, setMessages] = useState(initialMessages);
  const [messageInput, setMessageInput] = useState("");
  const [starred, setStarred] = useState<number[]>([]);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const conv = conversations[selected];

  const filteredConversations = conversations.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchChannel = channelFilter === "Todos" ||
      (channelFilter === "WhatsApp" && c.channel === "whatsapp") ||
      (channelFilter === "E-mail" && c.channel === "email") ||
      (channelFilter === "Instagram" && c.channel === "instagram");
    return matchSearch && matchChannel;
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    setMessages(prev => [...prev, { id: prev.length + 1, from: "agent", text: messageInput, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }]);
    setMessageInput("");
    toast.success("Mensagem enviada!");
  };

  const toggleStar = () => {
    const convId = conversations[selected].id;
    setStarred(prev => prev.includes(convId) ? prev.filter(id => id !== convId) : [...prev, convId]);
    toast.success(starred.includes(conversations[selected].id) ? "Removido dos favoritos" : "Adicionado aos favoritos");
  };

  const handleSelectConversation = (origIndex: number) => {
    setSelected(origIndex);
    setMobileView("thread");
  };

  return (
    <div className="flex h-full">
      {/* Conversation list — full width on mobile (list view), fixed width on desktop */}
      <div className={cn(
        "border-r border-border flex flex-col bg-card",
        "w-full md:w-80",
        mobileView === "thread" ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversas..." className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Todos", "WhatsApp", "E-mail", "Instagram"].map((f) => (
              <button key={f} onClick={() => setChannelFilter(f)} className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", channelFilter === f ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary")}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredConversations.map((c) => {
            const origIndex = conversations.findIndex(x => x.id === c.id);
            const Icon = channelIcon[c.channel];
            return (
              <button key={c.id} onClick={() => handleSelectConversation(origIndex)} className={cn("w-full flex items-start gap-3 p-4 text-left border-b border-border transition-colors", selected === origIndex ? "bg-primary/5" : "hover:bg-muted/50")}>
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">{c.avatar}</div>
                  <Icon className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-card p-[1px]", channelColor[c.channel])} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <span className="text-sm font-semibold text-foreground truncate">{c.name}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {c.tags.map((t) => (<span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">{t}</span>))}
                    {c.unread > 0 && (<span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{c.unread}</span>)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thread view — full width on mobile (thread view), flex-1 on desktop */}
      <div className={cn(
        "flex flex-col min-w-0",
        "flex-1",
        mobileView === "list" ? "hidden md:flex" : "flex"
      )}>
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-card flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {/* Back button — mobile only */}
            <button
              onClick={() => setMobileView("list")}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{conv.avatar}</div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{conv.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary inline-block" /> Online · via {conv.channel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleStar} className={cn("p-2 rounded-lg hover:bg-muted", starred.includes(conv.id) ? "text-accent-foreground" : "text-muted-foreground")}><Star className={cn("h-4 w-4", starred.includes(conv.id) && "fill-accent")} /></button>
            <button onClick={() => toast.info("Gerenciar tags do contato")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Tag className="h-4 w-4" /></button>
            <button onClick={() => toast.info("Mais opções da conversa")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><MoreVertical className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 space-y-4 bg-background">
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: m.from === "client" ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className={cn("flex", m.from === "agent" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] md:max-w-md rounded-2xl px-4 py-3 text-sm whitespace-pre-line", m.from === "agent" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border text-foreground rounded-bl-md")}>
                {m.text}
                <p className={cn("text-[10px] mt-1.5", m.from === "agent" ? "text-primary-foreground/60" : "text-muted-foreground")}>{m.time}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-border bg-card p-3 md:p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 rounded-xl border border-input bg-background p-3">
              <AITextareaField value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Digite sua mensagem..." rows={1} className="w-full resize-none text-sm bg-transparent placeholder:text-muted-foreground focus:outline-none" fieldLabel="Mensagem para o lead" fieldContext="Caixa de entrada CRM — resposta para conversa com lead" />
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => toast.info("Selecione um arquivo para anexar")} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Paperclip className="h-4 w-4" /></button>
                <button onClick={() => toast.info("Emojis em breve")} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Smile className="h-4 w-4" /></button>
              </div>
            </div>
            <button onClick={handleSendMessage} className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contact info panel — only on xl screens */}
      <div className="w-72 border-l border-border bg-card p-5 space-y-5 overflow-y-auto scrollbar-thin hidden xl:block">
        <div className="text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{conv.avatar}</div>
          <h3 className="text-base font-semibold text-foreground mt-3">{conv.name}</h3>
          <p className="text-xs text-muted-foreground">Lead Quente · Primeiro contato há 3 dias</p>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informações</h4>
          {[{ label: "E-mail", value: "maria@email.com" }, { label: "Telefone", value: "+55 11 99999-0000" }, { label: "Empresa", value: "Tech Solutions" }, { label: "Pipeline", value: "Qualificação" }].map((info) => (
            <div key={info.label} className="flex justify-between text-sm"><span className="text-muted-foreground">{info.label}</span><span className="text-foreground font-medium">{info.value}</span></div>
          ))}
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</h4>
          <div className="flex flex-wrap gap-1.5">
            {["Lead Quente", "Demo Agendada", "Pro"].map((t) => (<span key={t} className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">{t}</span>))}
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas</h4>
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">Interessada no plano Pro. Equipe de 5 vendedores. Agendar demo para amanhã.</div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
