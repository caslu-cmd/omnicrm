const fs = require("fs");
const filePath = "C:\\Users\\carol\\Documents\\omnicrm\\src\\pages\\ClientWorkspace.tsx";
let src = fs.readFileSync(filePath, "utf8");

const hasCRLF = src.includes("\r\n");
if (hasCRLF) src = src.replace(/\r\n/g, "\n");

// The broken region: after </div> (closes space-y-5) through the )} that closes "connected &&"
// including all 3 duplicate Agente blocks between them.
// We replace that entire region with:
//   </div>  (closes space-y-5)
//   )}      (closes "connected &&")
//   + ONE correct Agente block at 20-space indentation (sibling of the conditional)

const bad = `                      </div>\n\n\n                      {/* Agente Autonomo */}\n                      <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>\n                        <button onClick={() => setShowAgentPanel((v) => !v)} className="flex items-center gap-2 w-full text-left">\n                          <Bot className="w-4 h-4" style={{ color: "#B9FF4B" }} />\n                          <span className="text-xs font-semibold" style={{ color: "#B9FF4B" }}>Agente Autonomo</span>\n                          <span className="text-[10px] ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>— gera e envia sem revisao</span>\n                          <ChevronDown className={showAgentPanel ? "w-3.5 h-3.5 ml-auto rotate-180" : "w-3.5 h-3.5 ml-auto"} />\n                        </button>\n                        <AnimatePresence>\n                          {showAgentPanel && (\n                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">\n                              <div className="pt-4 space-y-3">\n                                {wpFavoriteGroupIds.length === 0 && (<p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Favorite grupos com ★ acima.</p>)}\n                                {wpFavoriteGroupIds.length > 0 && (<p className="text-[10px] font-medium" style={{ color: "#FBBF24" }}>★ {wpFavoriteGroupIds.length} grupo{wpFavoriteGroupIds.length !== 1 ? "s" : ""} alvo</p>)}\n                                <div className="flex gap-2">\n                                  <input value={agentSendPrompt} onChange={(e) => setAgentSendPrompt(e.target.value)} placeholder="Ex: confirmar presenca" className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(185,255,75,0.2)", color: "#F0F0F0" }} />\n                                  <button onClick={doAgentBroadcast} disabled={agentSending || !agentSendPrompt.trim() || wpFavoriteGroupIds.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40 whitespace-nowrap" style={{ background: "rgba(185,255,75,0.15)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>\n                                    {agentSending ? <><RefreshCw className="w-3 h-3 animate-spin" /> Enviando...</> : <><Bot className="w-3 h-3" /> Enviar agora</>}\n                                  </button>\n                                </div>\n                                {agentSendResult && (<div className="rounded-xl p-3" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}><div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#34D399" }}><CheckCircle2 className="w-3.5 h-3.5" /> Enviado {agentSendResult.ok}/{agentSendResult.total}</div><p className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{agentSendResult.message}</p></div>)}\n                              </div>\n                            </motion.div>\n                          )}\n                        </AnimatePresence>\n                      </div>\n                      {/* Agente Autonomo */}\n                      <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>\n                        <button onClick={() => setShowAgentPanel((v) => !v)} className="flex items-center gap-2 w-full text-left">\n                          <Bot className="w-4 h-4" style={{ color: "#B9FF4B" }} />\n                          <span className="text-xs font-semibold" style={{ color: "#B9FF4B" }}>Agente Autônomo</span>\n                          <span className="text-[10px] ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>— gera e envia sem revisão</span>\n                          <ChevronDown className={showAgentPanel ? "w-3.5 h-3.5 ml-auto rotate-180" : "w-3.5 h-3.5 ml-auto"} />\n                        </button>\n                        <AnimatePresence>\n                          {showAgentPanel && (\n                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">\n                              <div className="pt-4 space-y-3">\n                                {wpFavoriteGroupIds.length === 0 && (<p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Favorite grupos com ★ acima para o agente enviar.</p>)}\n                                {wpFavoriteGroupIds.length > 0 && (<p className="text-[10px] font-medium" style={{ color: "#FBBF24" }}>★ {wpFavoriteGroupIds.length} grupo{wpFavoriteGroupIds.length !== 1 ? "s" : ""} alvo</p>)}\n                                <div className="flex gap-2">\n                                  <input value={agentSendPrompt} onChange={(e) => setAgentSendPrompt(e.target.value)} placeholder="Ex: confirmar presença no evento" className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(185,255,75,0.2)", color: "#F0F0F0" }} />\n                                  <button onClick={doAgentBroadcast} disabled={agentSending || !agentSendPrompt.trim() || wpFavoriteGroupIds.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40 whitespace-nowrap" style={{ background: "rgba(185,255,75,0.15)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>\n                                    {agentSending ? <><RefreshCw className="w-3 h-3 animate-spin" /> Enviando…</> : <><Bot className="w-3 h-3" /> Enviar agora</>}\n                                  </button>\n                                </div>\n                                {agentSendResult && (<div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}><div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#34D399" }}><CheckCircle2 className="w-3.5 h-3.5" /> Enviado para {agentSendResult.ok}/{agentSendResult.total} grupos</div><p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap" }}>{agentSendResult.message}</p></div>)}\n                              </div>\n                            </motion.div>\n                          )}\n                        </AnimatePresence>\n                      </div>`;

if (!src.includes(bad)) {
  // Try to find partial for debugging
  const partial = '                      </div>\n\n\n                      {/* Agente Autonomo */}';
  console.log("Full marker not found. Partial found:", src.includes(partial));
  // Print what comes after partial
  const idx = src.indexOf(partial);
  if (idx >= 0) {
    console.log("After partial:", JSON.stringify(src.substring(idx, idx + 300)));
  }
  process.exit(1);
}

// Also need to remove the third block + the )} that currently closes "connected &&"
// After the `bad` section, the remaining is: \n                      {/* Agente Autonomo */}\n<third block>\n                    )}\n\n\n
// Find and remove the third block too

// The good replacement: close space-y-5 + close connected && + one clean Agente block
const good = `                      </div>
                    )}

                    {/* ── Agente Autônomo ── */}
                    <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <button onClick={() => setShowAgentPanel(v => !v)} className="flex items-center gap-2 w-full text-left" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <Bot className="w-4 h-4" style={{ color: "#B9FF4B" }} />
                        <span className="text-xs font-semibold" style={{ color: "#B9FF4B" }}>Agente Autônomo</span>
                        <span className="text-[10px] ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>— gera e envia sem revisão humana</span>
                        <ChevronDown className={\`w-3.5 h-3.5 ml-auto transition-transform \${showAgentPanel ? "rotate-180" : ""}\`} />
                      </button>
                      <AnimatePresence>
                        {showAgentPanel && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="pt-4 space-y-3">
                              <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.12)" }}>
                                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>O agente vai gerar a mensagem com IA e enviar automaticamente para os grupos com ★. Favorite grupos na lista acima para usá-los aqui.</p>
                                {wpFavoriteGroupIds.length > 0 && (<p className="text-[10px] font-medium" style={{ color: "#FBBF24" }}>★ {wpFavoriteGroupIds.length} grupo{wpFavoriteGroupIds.length !== 1 ? "s" : ""} selecionado{wpFavoriteGroupIds.length !== 1 ? "s" : ""}</p>)}
                              </div>
                              <div className="flex gap-2">
                                <input value={agentSendPrompt} onChange={e => setAgentSendPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && doAgentBroadcast()} placeholder="Ex: confirmar presença no evento" className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(185,255,75,0.2)", color: "#F0F0F0" }} />
                                <button onClick={doAgentBroadcast} disabled={agentSending || !agentSendPrompt.trim() || wpFavoriteGroupIds.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40 whitespace-nowrap" style={{ background: "rgba(185,255,75,0.15)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>
                                  {agentSending ? <><RefreshCw className="w-3 h-3 animate-spin" /> Enviando…</> : <><Bot className="w-3 h-3" /> Enviar agora</>}
                                </button>
                              </div>
                              {agentSendResult && (<div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}><div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#34D399" }}><CheckCircle2 className="w-3.5 h-3.5" /> Enviado para {agentSendResult.ok}/{agentSendResult.total} grupos</div><p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap" }}>{agentSendResult.message}</p></div>)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>`;

// Replace bad + the remaining third block + the ")" closing connected
// The pattern after `bad` is the third block + )}
const afterBad = `\n                      {/* Agente Autonomo */}\n                      <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>\n                        <button\n                          onClick={() => setShowAgentPanel((v) => !v)}\n                          className="flex items-center gap-2 w-full text-left"\n                        >\n                          <Bot className="w-4 h-4" style={{ color: "#B9FF4B" }} />\n                          <span className="text-xs font-semibold" style={{ color: "#B9FF4B" }}>\n                            Agente Autonomo\n                          </span>\n                          <span className="text-[10px] ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>\n                            — gera e envia sem revisao\n                          </span>`;

const combined = bad + afterBad;
if (!src.includes(combined)) {
  console.log("Combined not found, using bad only + manual cleanup");
  // Fall back: replace just `bad`, then clean up what remains
  src = src.replace(bad, good);
  // Now remove the third Agente block + the )}
  // The third block starts with `{/* Agente Autonomo */}` at 22 spaces right after good
  const cleanMarker = good + `\n                      {/* Agente Autonomo */}`;
  const endMarker = `\n                    )}\n\n\n                    {/* Note about Z-API credentials */}`;
  if (src.includes(cleanMarker) && src.includes(endMarker)) {
    const startIdx = src.indexOf(cleanMarker) + good.length;
    const endIdx = src.indexOf(endMarker, startIdx) + `\n                    )}\n\n\n`.length;
    src = src.substring(0, startIdx) + "\n\n" + src.substring(endIdx);
    console.log("Cleaned up third block and extra )}'");
  } else {
    console.log("Could not find third block for cleanup, checking...");
    const afterGoodIdx = src.indexOf(good);
    if (afterGoodIdx >= 0) {
      console.log("After good:", JSON.stringify(src.substring(afterGoodIdx + good.length, afterGoodIdx + good.length + 200)));
    }
  }
} else {
  // Find where combined ends, then skip to after the third block and )}
  const startIdx = src.indexOf(combined);
  const endSearch = src.indexOf(`\n                    )}\n`, startIdx);
  if (endSearch < 0) {
    console.error("Could not find closing )}");
    process.exit(1);
  }
  const endIdx = endSearch + `\n                    )}\n`.length;
  src = src.substring(0, startIdx) + good + "\n\n" + src.substring(endIdx);
  console.log("Full replacement done");
}

if (hasCRLF) src = src.replace(/\n/g, "\r\n");
fs.writeFileSync(filePath, src, "utf8");
console.log("File written!");
