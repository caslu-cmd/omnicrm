import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, Mail, AlertTriangle, Instagram, Facebook, Youtube, Linkedin } from "lucide-react";

type Step = "email" | "checking" | "confirmed" | "already" | "not_found";

interface Branding {
  logo_url: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  primary_color: string;
}

export default function AttendancePage() {
  const { courseId, day } = useParams<{ courseId: string; day?: string }>();
  const dayNumber = day ? parseInt(day, 10) : 1;

  const [course, setCourse] = useState<{ title: string; num_days?: number; client_id?: string } | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("courses")
        .select("title, num_days, client_id")
        .eq("id", courseId)
        .single();

      setCourse(data);
      setLoadingCourse(false);

      if (data?.client_id) {
        const { data: brandData } = await (supabase as any)
          .from("client_branding")
          .select("logo_url, instagram_handle, facebook_url, youtube_url, linkedin_url, primary_color")
          .eq("client_id", data.client_id)
          .single();
        if (brandData) setBranding(brandData);
      }
    })();
  }, [courseId]);

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !courseId) return;
    setStep("checking");

    const { data: enrollment } = await (supabase as any)
      .from("course_enrollments")
      .select("student_name, student_email")
      .eq("course_id", courseId)
      .ilike("student_email", trimmed)
      .single();

    if (!enrollment) { setStep("not_found"); return; }
    setStudentName(enrollment.student_name);

    const { data: existing } = await (supabase as any)
      .from("course_attendance")
      .select("id")
      .eq("course_id", courseId)
      .eq("day", dayNumber)
      .ilike("student_email", trimmed)
      .maybeSingle();

    if (existing) { setStep("already"); return; }

    await (supabase as any).from("course_attendance").insert({
      course_id: courseId,
      student_email: trimmed,
      student_name: enrollment.student_name,
      day: dayNumber,
    });
    setStep("confirmed");
  };

  const retry = () => { setEmail(""); setStep("email"); };

  const numDays = course?.num_days ?? 1;
  const showDayLabel = numDays > 1;
  const accent = branding?.primary_color ?? "#B9FF4B";

  const card: React.CSSProperties = {
    width: "100%", maxWidth: 460,
    background: "#0A0A10",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, padding: 36,
  };
  const wrap: React.CSSProperties = {
    minHeight: "100vh", background: "#07080A",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
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
      icon: <Instagram style={{ width: 14, height: 14 }} />,
      label: "Instagram",
      hoverColor: "#E1306C",
      hoverBg: "rgba(225,48,108,0.12)",
      hoverBorder: "rgba(225,48,108,0.35)",
    },
    branding?.facebook_url && {
      href: branding.facebook_url,
      icon: <Facebook style={{ width: 14, height: 14 }} />,
      label: "Facebook",
      hoverColor: "#1877F2",
      hoverBg: "rgba(24,119,242,0.12)",
      hoverBorder: "rgba(24,119,242,0.35)",
    },
    branding?.youtube_url && {
      href: branding.youtube_url,
      icon: <Youtube style={{ width: 14, height: 14 }} />,
      label: "YouTube",
      hoverColor: "#FF0000",
      hoverBg: "rgba(255,0,0,0.12)",
      hoverBorder: "rgba(255,0,0,0.35)",
    },
    branding?.linkedin_url && {
      href: branding.linkedin_url,
      icon: <Linkedin style={{ width: 14, height: 14 }} />,
      label: "LinkedIn",
      hoverColor: "#0A66C2",
      hoverBg: "rgba(10,102,194,0.12)",
      hoverBorder: "rgba(10,102,194,0.35)",
    },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; hoverColor: string; hoverBg: string; hoverBorder: string }[];

  const hasSocial = socialLinks.length > 0;

  const SocialSection = hasSocial ? (
    <div style={{
      marginTop: 20,
      padding: "16px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      textAlign: "center",
    }}>
      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
        🎁 <strong style={{ color: "rgba(255,255,255,0.8)" }}>Siga nossas redes</strong> e fique por dentro em primeira mão de descontos, capacitações exclusivas e lançamentos especiais. Compartilhe com seus colegas também — quanto mais souberem, melhor para todos!
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {socialLinks.map(({ href, icon, label, hoverColor, hoverBg, hoverBorder }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 99,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600,
              textDecoration: "none", transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = hoverBg;
              el.style.borderColor = hoverBorder;
              el.style.color = hoverColor;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(255,255,255,0.05)";
              el.style.borderColor = "rgba(255,255,255,0.1)";
              el.style.color = "rgba(255,255,255,0.6)";
            }}
          >
            {icon}
            {label}
          </a>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt=""
              style={{ height: 56, maxWidth: 180, objectFit: "contain", margin: "0 auto 16px", display: "block" }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `${accent}1A`, border: `1px solid ${accent}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <CheckCircle2 style={{ width: 28, height: 28, color: accent }} />
            </div>
          )}

          <h1 style={{ color: "#F0F0F0", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            Lista de Presença
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>{course.title}</p>
          {showDayLabel && (
            <span style={{
              display: "inline-block", marginTop: 8,
              padding: "4px 14px", borderRadius: 99,
              background: `${accent}1F`, border: `1px solid ${accent}40`,
              color: accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
            }}>
              Dia {dayNumber} de {numDays}
            </span>
          )}
        </div>

        {step === "email" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 600,
                color: "rgba(255,255,255,0.35)", marginBottom: 8,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                E-mail usado na matrícula
              </label>
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
                />
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!email.trim()}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12,
                background: email.trim() ? accent : `${accent}33`,
                color: "#07080A", fontWeight: 700, fontSize: 14,
                border: "none", cursor: email.trim() ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              Confirmar presença{showDayLabel ? ` — Dia ${dayNumber}` : ""}
            </button>
            {SocialSection}
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
            <h2 style={{ color: "#F0F0F0", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Presença confirmada!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginBottom: 4 }}>
              Olá, <strong style={{ color: "#F0F0F0" }}>{studentName}</strong>.{" "}
              {showDayLabel
                ? `Sua presença no Dia ${dayNumber} foi registrada com sucesso.`
                : "Sua presença foi registrada com sucesso."}
            </p>
            {SocialSection}
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
            <h2 style={{ color: "#F0F0F0", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Você já marcou presença!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginBottom: 4 }}>
              Olá, <strong style={{ color: "#F0F0F0" }}>{studentName}</strong>.{" "}
              {showDayLabel
                ? `Sua presença no Dia ${dayNumber} já estava registrada.`
                : "Sua presença neste curso já estava registrada."}
            </p>
            {SocialSection}
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
                <p style={{ color: "#F87171", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  E-mail não encontrado
                </p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                  O e-mail <strong style={{ color: "rgba(255,255,255,0.7)" }}>{email}</strong>{" "}
                  não está matriculado neste curso. Verifique o e-mail usado na matrícula.
                </p>
              </div>
            </div>
            <button
              onClick={retry}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 12,
                background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)",
                fontWeight: 600, fontSize: 14,
                border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
              }}
            >
              Tentar outro e-mail
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
