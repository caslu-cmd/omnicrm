import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────
export interface PostingItem {
  id: string;
  file: File;
  caption: string;
  scheduledAt: string;
}

export interface StartPostingParams {
  clientId: string;
  clientName: string;
  clientColor: string;
  items: PostingItem[];
  platforms: string[];
  isStory: boolean;
  linkUrl: string | null;
  batchDistribute: boolean;
  batchStartDate: string;
  batchTime: string;
}

interface PostingState {
  clientName: string;
  clientColor: string;
  isStory: boolean;
  current: number;
  total: number;
  done: boolean;
  success: number;
  failed: number;
}

interface SocialPostingContextValue {
  posting: PostingState | null;
  startPosting: (params: StartPostingParams) => void;
  dismiss: () => void;
}

// ── Context ────────────────────────────────────────────────────
const SocialPostingContext = createContext<SocialPostingContextValue>({
  posting: null,
  startPosting: () => {},
  dismiss: () => {},
});

export const useSocialPosting = () => useContext(SocialPostingContext);

// ── Helpers ────────────────────────────────────────────────────
async function callSmm(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await (supabase as any).functions.invoke("smm", {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

async function uploadFile(file: File): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const ext = file.name.split(".").pop();
    const path = `${session.user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await (supabase as any).storage.from("post-media").upload(path, file, { upsert: true });
    if (error) return null;
    const { data: { publicUrl } } = (supabase as any).storage.from("post-media").getPublicUrl(path);
    return publicUrl;
  } catch {
    return null;
  }
}

// ── Provider ───────────────────────────────────────────────────
export function SocialPostingProvider({ children }: { children: ReactNode }) {
  const [posting, setPosting] = useState<PostingState | null>(null);
  const runningRef = useRef(false);

  const dismiss = useCallback(() => setPosting(null), []);

  const startPosting = useCallback(async (params: StartPostingParams) => {
    if (runningRef.current) return;
    runningRef.current = true;

    const { clientId, clientName, clientColor, items, platforms, isStory, linkUrl, batchDistribute, batchStartDate, batchTime } = params;

    setPosting({ clientName, clientColor, isStory, current: 0, total: items.length, done: false, success: 0, failed: 0 });

    let success = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i++) {
      setPosting(p => p ? { ...p, current: i + 1 } : p);
      const item = items[i];
      try {
        const publicUrl = await uploadFile(item.file);
        let scheduledAt = item.scheduledAt;
        if (batchDistribute && batchStartDate) {
          const d = new Date(`${batchStartDate}T${batchTime}`);
          d.setDate(d.getDate() + i);
          scheduledAt = d.toISOString().slice(0, 16);
        }
        await callSmm({
          action: "create-post",
          client_id: clientId,
          platforms,
          caption: isStory ? null : (item.caption || null),
          media_url: publicUrl,
          media_type: isStory ? "story" : "image",
          link_url: isStory ? linkUrl : null,
          scheduled_at: scheduledAt || null,
        });
        success++;
      } catch {
        failed++;
      }
    }

    setPosting(p => p ? { ...p, done: true, success, failed } : p);

    const label = isStory ? `stor${success !== 1 ? "ies" : "y"}` : `post${success !== 1 ? "s" : ""}`;
    if (failed === 0) {
      toast.success(`✅ ${success} ${label} publicado${success !== 1 ? "s" : ""}!`);
    } else {
      toast.warning(`⚠️ ${success} publicado${success !== 1 ? "s" : ""}, ${failed} falhou`);
    }

    runningRef.current = false;
  }, []);

  return (
    <SocialPostingContext.Provider value={{ posting, startPosting, dismiss }}>
      {children}
      <PostingFloater />
    </SocialPostingContext.Provider>
  );
}

// ── Floating progress banner ───────────────────────────────────
function PostingFloater() {
  const { posting, dismiss } = useSocialPosting();
  if (!posting) return null;

  const pct = posting.total > 0 ? Math.round((posting.current / posting.total) * 100) : 0;
  const accent = posting.isStory ? "#F472B6" : (posting.clientColor || "#B9FF4B");

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 320,
        borderRadius: 16,
        background: "#111",
        border: `1px solid ${accent}30`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${accent}15`,
        overflow: "hidden",
        animation: "slideInFloater 0.25s ease",
      }}
    >
      <style>{`@keyframes slideInFloater { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.07)" }}>
        <div style={{
          height: "100%",
          width: `${posting.done ? 100 : pct}%`,
          background: accent,
          transition: "width 0.3s ease",
          borderRadius: 99,
        }} />
      </div>

      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Icon */}
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
            {posting.done ? "✅" : (posting.isStory ? "📱" : "📝")}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {posting.done ? (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#F0F0F0", margin: 0 }}>
                  Publicação concluída!
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                  {posting.success} {posting.isStory ? `stor${posting.success !== 1 ? "ies" : "y"}` : `post${posting.success !== 1 ? "s" : ""}`} de {posting.clientName}
                  {posting.failed > 0 ? ` · ${posting.failed} falhou` : ""}
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#F0F0F0", margin: 0 }}>
                  {posting.isStory ? "Publicando stories…" : "Publicando posts…"}
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                  {posting.current} de {posting.total} · {posting.clientName} · {pct}%
                </p>
              </>
            )}
          </div>

          {/* Spinner or close */}
          {posting.done ? (
            <button
              onClick={dismiss}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 16, padding: 4, lineHeight: 1, flexShrink: 0 }}
            >
              ×
            </button>
          ) : (
            <div style={{
              width: 18, height: 18, borderRadius: "50%", border: `2px solid ${accent}40`,
              borderTopColor: accent, animation: "_sp 0.7s linear infinite", flexShrink: 0,
            }} />
          )}
        </div>
      </div>
    </div>
  );
}
