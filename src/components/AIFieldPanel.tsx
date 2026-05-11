import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, Check, RefreshCw } from "lucide-react";
import { useAIField } from "@/contexts/AIFieldContext";
import { supabase } from "@/integrations/supabase/client";

export default function AIFieldPanel() {
  const { state, close } = useAIField();
  const { isOpen, position, fieldLabel, currentValue, fieldContext, onInsert } = state;

  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, close]);

  // Reseta estado ao abrir
  useEffect(() => {
    if (isOpen) {
      setPrompt("");
      setResult("");
      setDone(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Posição inteligente: evita sair da tela
  const panelW = 340;
  const panelH = 280;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.min(position.x, vw - panelW - 12);
  const top = position.y + panelH > vh ? position.y - panelH - 8 : position.y;

  const gerar = async (customPrompt?: string) => {
    const texto = (customPrompt ?? prompt).trim();
    if (!texto && !currentValue) return;

    setLoading(true);
    setResult("");
    setDone(false);

    const instrucao = texto
      ? `O usuário pediu: "${texto}"`
      : `Melhore e reescreva o conteúdo atual do campo.`;

    const systemPrompt = `Você é um assistente de escrita especializado em agências de marketing digital brasileiras.
Sua tarefa é gerar texto para preencher o campo: "${fieldLabel}".
${fieldContext ? `Contexto da página: ${fieldContext}` : ""}
${currentValue ? `Valor atual do campo: "${currentValue}"` : "Campo vazio."}

Regras:
- Retorne APENAS o texto que deve ir no campo, nada mais.
- Sem explicações, sem prefixos, sem aspas extras.
- Português brasileiro, profissional e direto.`;

    try {
      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt,
          messages: [{ role: "user", content: instrucao }],
        },
      });
      if (error) throw error;
      setResult(data?.content?.trim() ?? "");
      setDone(true);
    } catch (e) {
      setResult("Erro ao conectar com a IA. Tente novamente.");
      setDone(false);
    } finally {
      setLoading(false);
    }
  };

  const inserir = () => {
    onInsert(result);
    close();
  };

  const SUGESTOES = [
    "Escreva um texto profissional",
    "Seja mais criativo e envolvente",
    "Resumir em poucas palavras",
    "Tom informal e descontraído",
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.93, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: -6 }}
          transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            position: "fixed",
            top,
            left,
            width: panelW,
            zIndex: 9999,
            borderRadius: 14,
            overflow: "hidden",
            background: "#0C0D0F",
            border: "1px solid rgba(185,255,75,0.18)",
            boxShadow: "0 20px 60px -8px rgba(0,0,0,0.85), 0 0 0 1px rgba(185,255,75,0.06)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px 10px 14px",
              borderBottom: "1px solid rgba(185,255,75,0.08)",
              background: "rgba(185,255,75,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "#B9FF4B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles style={{ width: 12, height: 12, color: "#07080A" }} />
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#F0F0F0" }}>Calu IA</span>
                <span style={{ fontSize: 10, color: "#555577", marginLeft: 6 }}>— {fieldLabel}</span>
              </div>
            </div>
            <button onClick={close} style={{ color: "#444466", cursor: "pointer", background: "none", border: "none", padding: 2 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Sugestões rápidas */}
            {!result && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => gerar(s)}
                    style={{
                      padding: "3px 9px", borderRadius: 20, fontSize: 10, cursor: "pointer",
                      background: "#141420", border: "1px solid #2A2A3A", color: "#8888AA",
                      transition: "all .15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#B9FF4B44"; e.currentTarget.style.color = "#B9FF4B"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A2A3A"; e.currentTarget.style.color = "#8888AA"; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Resultado da IA */}
            {(result || loading) && (
              <div style={{
                background: "#141420", borderRadius: 10, padding: "10px 12px",
                border: "1px solid #2A2A3A", minHeight: 60,
                fontSize: 12, color: "#C0C0D0", lineHeight: 1.6, whiteSpace: "pre-wrap",
              }}>
                {loading
                  ? <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#555577" }}>
                      <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                      <span>Gerando...</span>
                    </div>
                  : result
                }
              </div>
            )}

            {/* Botões de ação quando há resultado */}
            {done && result && (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={inserir}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: "#B9FF4B", color: "#07080A", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  <Check style={{ width: 13, height: 13 }} /> Inserir no campo
                </button>
                <button
                  onClick={() => gerar(prompt || undefined)}
                  style={{
                    padding: "7px 12px", borderRadius: 8, fontSize: 12,
                    background: "#1E1E2E", color: "#8888AA", border: "1px solid #2A2A3A",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <RefreshCw style={{ width: 11, height: 11 }} /> Gerar outro
                </button>
              </div>
            )}

            {/* Input do usuário */}
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gerar(); } }}
                placeholder="O que quer escrever aqui? (Enter para gerar)"
                rows={2}
                style={{
                  flex: 1, borderRadius: 8, padding: "8px 10px", fontSize: 12,
                  background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0",
                  outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#B9FF4B44")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A3A")}
              />
              <button
                onClick={() => gerar()}
                disabled={loading}
                style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: loading ? "#1E1E2E" : "#B9FF4B",
                  color: loading ? "#444466" : "#07080A",
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {loading
                  ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                  : <Send style={{ width: 13, height: 13 }} />
                }
              </button>
            </div>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
