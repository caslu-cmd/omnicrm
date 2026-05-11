import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, Mail, AlertTriangle } from "lucide-react";

type Step = "email" | "checking" | "confirmed" | "already" | "not_found";

export default function AttendancePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<{ title: string } | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    if (!courseId) return;
    (supabase as any)
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single()
      .then(({ data }: any) => { setCourse(data); setLoadingCourse(false); });
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
      .ilike("student_email", trimmed)
      .maybeSingle();

    if (existing) { setStep("already"); return; }

    await (supabase as any).from("course_attendance").insert({
      course_id: courseId,
      student_email: trimmed,
      student_name: enrollment.student_name,
    });
    setStep("confirmed");
  };

  const retry = () => { setEmail(""); setStep("email"); };

  const card: React.CSSProperties = {
    width: "100%", maxWidth: 440,
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
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#B9FF4B" }} />
    </div>
  );

  if (!course) return (
    <div style={wrap}>
      <p style={{ color: "rgba(255,255,255,0.4)" }}>Curso não encontrado.</p>
    </div>
  );

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <CheckCircle2 style={{ width: 28, height: 28, color: "#B9FF4B" }} />
          </div>
          <h1 style={{ color: "#F0F0F0", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            Lista de Presença
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>{course.title}</p>
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
                background: email.trim() ? "#B9FF4B" : "rgba(185,255,75,0.2)",
                color: "#07080A", fontWeight: 700, fontSize: 14,
                border: "none", cursor: email.trim() ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              Confirmar presença
            </button>
          </div>
        )}

        {step === "checking" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: "#B9FF4B", margin: "0 auto 12px" }} />
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
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
              Olá, <strong style={{ color: "#F0F0F0" }}>{studentName}</strong>.{" "}
              Sua presença foi registrada com sucesso.
            </p>
          </div>
        )}

        {step === "already" && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(185,255,75,0.1)", border: "2px solid #B9FF4B",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <CheckCircle2 style={{ width: 32, height: 32, color: "#B9FF4B" }} />
            </div>
            <h2 style={{ color: "#F0F0F0", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Você já marcou presença!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
              Olá, <strong style={{ color: "#F0F0F0" }}>{studentName}</strong>.{" "}
              Sua presença neste curso já estava registrada.
            </p>
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
