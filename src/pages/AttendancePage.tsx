import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, Mail, AlertTriangle, Instagram, Facebook, Youtube, Linkedin, RefreshCw } from "lucide-react";

type Step = "chat" | "email" | "checking" | "confirmed" | "already" | "not_found" | "error";

interface Branding {
  logo_url: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  primary_color: string;
}

interface ChatMsg { id: number; text: string; type: "bot" | "social" | "cta"; }

export default function AttendancePage() {
  const { courseId, day } = useParams<{ courseId: string; day?: string }>();
  const parsedDay = day ? Number.parseInt(day, 10) : 1;
  const dayNumber = Number.isFinite(parsedDay) && parsedDay > 0 ? parsedDay : 1;

  const [course, setCourse] = useState<{ title: string; num_days?: number; client_id?: string } | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("chat");
  const [studentName, setStudentName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Chat state
  const [visibleMsgs, setVisibleMsgs] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [chatDone, setChatDone] = useState(false);
  const [emailInChat, setEmailInChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatBuiltRef = useRef(false);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      setLoadingCourse(true);
      const { data } = await (supabase as any)
        .from("courses")
        .select("title, num_days, client_id")
        .eq("id", courseId)
        .maybeSingle();

      let courseData = data;
      if (!courseData) {
        const { data: enrollmentData } = await (supabase as any)
          .from("course_enrollments")
          .select("course_id")
          .eq("course_id", courseId)
          .limit(1);
        if ((enrollmentData ?? []).length > 0) {
          courseData = { title: "Curso", num_days: dayNumber, client_id: null };
        }
      }

      setCourse(courseData);

      if (courseData?.client_id) {
        const { data: brandData } = await (supabase as any)
          .from("client_branding")
          .select("logo_url, instagram_handle, facebook_url, youtube_url, linkedin_url, primary_color")
          .eq("client_id", courseData.client_id)
          .single();
        if (brandData) setBranding(brandData);
      }
      setLoadingCourse(false);
    })();
  }, [courseId]);

  // Build chat messages after course loaded
  useEffect(() => {
    if (loadingCourse || !course) return;
    if (chatBuiltRef.current) return; // build once — don't reset when branding loads late
    chatBuiltRef.current = true;

    setVisibleMsgs([]);
    setTyping(false);
    setChatDone(false);
    setEmailInChat(false);
    const hasSocial = branding?.instagram_handle || branding?.facebook_url || branding?.youtube_url || branding?.linkedin_url;

    const msgs: ChatMsg[] = [
      { id: 1, text: `Oi! 👋 Que bom ter você aqui no **${course.title}**!`, type: "bot" },
      { id: 2, text: "Antes de confirmar sua presença, deixa eu te fazer uma pergunta rápida... 😄", type: "bot" },
      { id: 3, text: "Você nos segue nas redes sociais? A gente posta conteúdo exclusivo, dicas e novidades por lá! 🔥", type: "bot" },
      { id: 5, text: "Quem nos segue tem acesso em primeira mão a descontos e capacitações exclusivas. Vale muito a pena! 🎁", type: "bot" },
      { id: 6, text: "Indica pra um colega também — quanto mais souberem, melhor pra todo mundo! 🤝", type: "bot" },
      { id: 7, text: "Agora pode confirmar sua presença aqui embaixo 👇", type: "cta" },
    ];

    if (hasSocial) msgs.splice(3, 0, { id: 4, text: "", type: "social" });

    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const schedule = () => {
      if (i >= msgs.length) { setChatDone(true); return; }
      const msg = msgs[i];
      // pause before showing typing (gives time to read previous msg)
      const readPause = i === 0 ? 500 : 1400;
      // typing duration scales with text length so longer msgs feel natural
      const typingDuration = msg.type === "social" || msg.type === "cta"
        ? 700
        : Math.min(2800, Math.max(1100, msg.text.length * 35));
      const startTimer = setTimeout(() => {
        setTyping(true);
        const typeTimer = setTimeout(() => {
          setTyping(false);
          setVisibleMsgs(prev => [...prev, msg]);
          i++;
          schedule();
        }, typingDuration);
        timers.push(typeTimer);
      }, readPause);
      timers.push(startTimer);
    };
    schedule();
    return () => timers.forEach(clearTimeout);
  }, [loadingCourse, course, branding]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMsgs, typing]);

  const handleSubmit = async () => {
    const typed = email.trim();
    if (!typed || !courseId || submitting) return;
    setSubmitting(true);
    setStep("checking");
    setErrorMessage("");

    const normText = (s: string | null | undefined) => (s ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    const normEmail = (s: string | null | undefined) => normText(s).replace(/\s/g, "");

    try {
      const looksLikeEmail = typed.includes("@");
      const typedEmail = normEmail(typed);

      if (!looksLikeEmail || !typedEmail.includes("@")) {
        setErrorMessage("Informe o e-mail usado na sua matrícula.");
        setStep("error");
        return;
      }

      const { data: enrollments, error: enrollmentError } = await (supabase as any)
        .from("course_enrollments")
        .select("id, student_name, student_email")
        .eq("course_id", courseId);

      if (enrollmentError) {
        console.error("Erro ao verificar matrícula:", enrollmentError);
        setErrorMessage("Não foi possível verificar sua matrícula agora. Tente novamente em instantes.");
        setStep("error");
        return;
      }

      const enrollment = (enrollments ?? []).find((e: any) =>
        e.student_email && normEmail(e.student_email) === typedEmail
      );

      if (!enrollment) {
        console.warn("Matrícula não encontrada para e-mail:", typed);
        setStep("not_found");
        return;
      }

      const studentDisplayName = enrollment.student_name || "Aluno";
      const attendanceEmail = normEmail(enrollment.student_email);
      setStudentName(studentDisplayName);

      const { data: attendances, error: existingError } = await (supabase as any)
        .from("course_attendance")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_email", attendanceEmail)
        .eq("day", dayNumber)
        .limit(1);

      if (existingError) {
        console.error("Erro ao consultar presença:", existingError);
        setErrorMessage("Não foi possível consultar sua presença agora. Tente novamente.");
        setStep("error");
        return;
      }

      if ((attendances ?? []).length > 0) { setStep("already"); return; }

      const { data: savedAttendance, error: insertError } = await (supabase as any).from("course_attendance").insert({
        course_id: courseId,
        student_email: attendanceEmail,
        student_name: studentDisplayName,
        day: dayNumber,
      }).select("id, day").single();

      if (insertError?.code === "23505") {
        setStep("already");
        return;
      }

      if (insertError || !savedAttendance) {
        console.error("Erro ao gravar presença:", insertError);
        setErrorMessage("Sua matrícula foi encontrada, mas a presença não foi gravada. Tente novamente.");
        setStep("error");
        return;
      }

      if ((savedAttendance.day ?? dayNumber) !== dayNumber) {
        console.error("Presença gravada no dia errado:", { esperado: dayNumber, gravado: savedAttendance.day });
        setErrorMessage(`A presença foi gravada no dia ${savedAttendance.day}, mas este QR é do dia ${dayNumber}. Gere o QR novamente e tente de novo.`);
        setStep("error");
        return;
      }
      setStep("confirmed");
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => { setEmail(""); setEmailInChat(true); setStep("chat"); };

  const numDays = course?.num_days ?? 1;
  const showDayLabel = numDays > 1;
  const accent = branding?.primary_color ?? "#B9FF4B";

  const wrap: React.CSSProperties = {
    minHeight: "100vh", background: "#07080A",
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: 24,
  };
  const card: React.CSSProperties = {
    width: "100%", maxWidth: 420,
    background: "#0A0A10",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, overflow: "hidden",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, color: "#F0F0F0", fontSize: 14, outline: "none",
  };

  if (loadingCourse) return (
    <div style={wrap}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent }} />
    </div>
  );

  if (!course) return (
    <div style={wrap}>
      <p style={{ color: "rgba(255,255,255,0.4)" }}>Curso não encontrado.</p>
    </div>
  );

  const socialLinks = [
    branding?.instagram_handle && {
      href: `https://instagram.com/${branding.instagram_handle}`,
      icon: <Instagram style={{ width: 15, height: 15 }} />,
      label: "Instagram",
      color: "#E1306C",
    },
    branding?.facebook_url && {
      href: branding.facebook_url,
      icon: <Facebook style={{ width: 15, height: 15 }} />,
      label: "Facebook",
      color: "#1877F2",
    },
    branding?.youtube_url && {
      href: branding.youtube_url,
      icon: <Youtube style={{ width: 15, height: 15 }} />,
      label: "YouTube",
      color: "#FF0000",
    },
    branding?.linkedin_url && {
      href: branding.linkedin_url,
      icon: <Linkedin style={{ width: 15, height: 15 }} />,
      label: "LinkedIn",
      color: "#0A66C2",
    },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; color: string }[];

  // ── Header (logo + título) ────────────────────────────────────────────────
  const Header = (
    <div style={{ padding: "24px 24px 16px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      {branding?.logo_url ? (
        <img src={branding.logo_url} alt="" style={{ height: 44, maxWidth: 160, objectFit: "contain", margin: "0 auto 12px", display: "block" }} />
      ) : (
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${accent}1A`, border: `1px solid ${accent}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px",
        }}>
          <CheckCircle2 style={{ width: 22, height: 22, color: accent }} />
        </div>
      )}
      <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Lista de Presença</p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{course.title}</p>
      {showDayLabel && (
        <span style={{
          display: "inline-block", marginTop: 6,
          padding: "3px 12px", borderRadius: 99,
          background: `${accent}1F`, border: `1px solid ${accent}40`,
          color: accent, fontSize: 11, fontWeight: 700,
        }}>
          Dia {dayNumber} de {numDays}
        </span>
      )}
    </div>
  );

  // ── Chat step ─────────────────────────────────────────────────────────────
  if (step === "chat") {
    return (
      <div style={wrap}>
        <div style={card}>
          {Header}

          {/* Chat messages */}
          <div style={{ padding: "16px 16px 8px", maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {visibleMsgs.map(msg => {
              if (msg.type === "social") {
                return (
                  <div key={msg.id} style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", padding: "4px 0" }}>
                    {socialLinks.map(({ href, icon, label, color }) => (
                      <a key={label} href={href} target="_blank" rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "8px 16px", borderRadius: 99,
                          background: `${color}18`, border: `1px solid ${color}44`,
                          color, fontSize: 12, fontWeight: 700, textDecoration: "none",
                          transition: "all 0.2s",
                        }}>
                        {icon} {label}
                      </a>
                    ))}
                  </div>
                );
              }

              if (msg.type === "cta") {
                return (
                  <div key={msg.id} style={{ marginTop: 4 }}>
                    <div style={{
                      display: "inline-block", maxWidth: "85%",
                      padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
                      background: "rgba(255,255,255,0.07)",
                      fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5,
                    }}>
                      {msg.text}
                    </div>
                    {!emailInChat && (
                      <div style={{ marginTop: 12 }}>
                        <button
                          onClick={() => setEmailInChat(true)}
                          style={{
                            width: "100%", padding: "13px 0", borderRadius: 12,
                            background: accent, color: "#07080A",
                            fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
                          }}
                        >
                          Confirmar presença{showDayLabel ? ` — Dia ${dayNumber}` : ""}
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // bot message — parse **bold**
              const parts = msg.text.split(/\*\*(.*?)\*\*/g);
              return (
                <div key={msg.id} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  {branding?.logo_url ? (
                    <img src={branding.logo_url} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: `${accent}22`, border: `1px solid ${accent}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: accent,
                    }}>GL</div>
                  )}
                  <div style={{
                    maxWidth: "80%", padding: "10px 14px",
                    borderRadius: "16px 16px 16px 4px",
                    background: "rgba(255,255,255,0.07)",
                    fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.55,
                  }}>
                    {parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p)}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: `${accent}22`, border: `1px solid ${accent}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: accent,
                }}>GL</div>
                <div style={{
                  padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
                  background: "rgba(255,255,255,0.07)",
                  display: "flex", gap: 4, alignItems: "center",
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "rgba(255,255,255,0.3)",
                      animation: `bounce 1.2s ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            {emailInChat && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
                <div style={{ position: "relative" }}>
                  <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.25)" }} />
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder="seu@email.com"
                    style={inputStyle}
                    autoFocus
                  />
                </div>
                <button onClick={handleSubmit} disabled={!email.trim() || submitting}
                  style={{
                    width: "100%", padding: "13px 0", borderRadius: 12,
                    background: email.trim() && !submitting ? accent : `${accent}33`,
                    color: "#07080A", fontWeight: 700, fontSize: 14,
                    border: "none", cursor: email.trim() && !submitting ? "pointer" : "default",
                  }}>
                  {submitting ? "Gravando presença…" : `Confirmar presença${showDayLabel ? ` — Dia ${dayNumber}` : ""}`}
                </button>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Skip link */}
          {!emailInChat && (
          <div style={{ padding: "8px 16px 16px", textAlign: "center" }}>
            <button onClick={() => setEmailInChat(true)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 11, cursor: "pointer" }}>
              Pular e confirmar presença direto
            </button>
          </div>
          )}
        </div>

        <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
      </div>
    );
  }

  // ── Email + result steps ──────────────────────────────────────────────────
  return (
    <div style={wrap}>
      <div style={card}>
        {Header}
        <div style={{ padding: 24 }}>

          {step === "email" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 600,
                  color: "rgba(255,255,255,0.35)", marginBottom: 8,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}>E-mail usado na matrícula</label>
                <div style={{ position: "relative" }}>
                  <Mail style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    width: 16, height: 16, color: "rgba(255,255,255,0.25)",
                  }} />
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder="seu@email.com"
                    style={inputStyle}
                    autoFocus
                  />
                </div>
              </div>
              <button onClick={handleSubmit} disabled={!email.trim() || submitting}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12,
                  background: email.trim() && !submitting ? accent : `${accent}33`,
                  color: "#07080A", fontWeight: 700, fontSize: 14,
                  border: "none", cursor: email.trim() && !submitting ? "pointer" : "default", transition: "all 0.2s",
                }}>
                {submitting ? "Gravando presença…" : `Confirmar presença${showDayLabel ? ` — Dia ${dayNumber}` : ""}`}
              </button>
            </div>
          )}

          {step === "checking" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: accent, margin: "0 auto 12px" }} />
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Verificando matrícula…</p>
            </div>
          )}

          {step === "confirmed" && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(52,211,153,0.1)", border: "2px solid #34D399",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: "#34D399" }} />
              </div>
              <h2 style={{ color: "#F0F0F0", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Presença confirmada!</h2>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
                Olá, <strong style={{ color: "#F0F0F0" }}>{studentName}</strong>.{" "}
                {showDayLabel ? `Sua presença no Dia ${dayNumber} foi registrada.` : "Sua presença foi registrada."}
              </p>
              {socialLinks.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
                    Siga nossas redes e fique por dentro em primeira mão de descontos, capacitações exclusivas e lançamentos especiais.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {socialLinks.map(({ href, icon, label, color }) => (
                      <a key={label} href={href} target="_blank" rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "7px 14px", borderRadius: 99,
                          background: `${color}18`, border: `1px solid ${color}44`,
                          color, fontSize: 12, fontWeight: 700, textDecoration: "none",
                        }}>
                        {icon} {label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "already" && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: `${accent}1A`, border: `2px solid ${accent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: accent }} />
              </div>
              <h2 style={{ color: "#F0F0F0", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Você já marcou presença!</h2>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
                Olá, <strong style={{ color: "#F0F0F0" }}>{studentName}</strong>.{" "}
                {showDayLabel ? `Sua presença no Dia ${dayNumber} já estava registrada.` : "Sua presença já estava registrada."}
              </p>
              {socialLinks.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
                    Siga nossas redes e fique por dentro em primeira mão de descontos, capacitações exclusivas e lançamentos especiais.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {socialLinks.map(({ href, icon, label, color }) => (
                      <a key={label} href={href} target="_blank" rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "7px 14px", borderRadius: 99,
                          background: `${color}18`, border: `1px solid ${color}44`,
                          color, fontSize: 12, fontWeight: 700, textDecoration: "none",
                        }}>
                        {icon} {label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "error" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                padding: "14px 16px",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 12, display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <AlertTriangle style={{ width: 18, height: 18, color: "#F87171", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ color: "#F87171", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Presença não gravada</p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{errorMessage}</p>
                </div>
              </div>
              <button onClick={handleSubmit} disabled={submitting}
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 12,
                  background: submitting ? `${accent}33` : accent, color: "#07080A",
                  fontWeight: 700, fontSize: 14,
                  border: "none", cursor: submitting ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                <RefreshCw style={{ width: 14, height: 14 }} /> {submitting ? "Gravando…" : "Tentar gravar novamente"}
              </button>
            </div>
          )}

          {step === "not_found" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                padding: "14px 16px",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 12, display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <AlertTriangle style={{ width: 18, height: 18, color: "#F87171", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ color: "#F87171", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>E-mail não encontrado</p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                    O e-mail <strong style={{ color: "rgba(255,255,255,0.7)" }}>{email}</strong>{" "}
                    não está matriculado neste curso. Verifique o e-mail usado na matrícula.
                  </p>
                </div>
              </div>
              <button onClick={retry}
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 12,
                  background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)",
                  fontWeight: 600, fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                }}>
                Tentar outro e-mail
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
