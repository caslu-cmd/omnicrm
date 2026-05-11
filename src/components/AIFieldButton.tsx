import { Sparkles } from "lucide-react";
import { useAIField } from "@/contexts/AIFieldContext";

interface AIFieldButtonProps {
  /** Rótulo do campo — a IA usa para entender o contexto */
  fieldLabel: string;
  /** Retorna o valor atual do campo para a IA usar como base */
  getValue: () => string;
  /** Chamado quando a IA gera um texto e o usuário clica em "Inserir" */
  onInsert: (text: string) => void;
  /** Contexto extra da página (opcional) */
  fieldContext?: string;
  /** Estilo de posicionamento: 'inline' fica dentro do campo, 'side' fica ao lado */
  placement?: "inline" | "side";
}

export default function AIFieldButton({
  fieldLabel,
  getValue,
  onInsert,
  fieldContext = "",
  placement = "inline",
}: AIFieldButtonProps) {
  const { open } = useAIField();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    open({
      position: { x: rect.left, y: rect.bottom + 6 },
      fieldLabel,
      currentValue: getValue(),
      fieldContext,
      onInsert,
    });
  };

  if (placement === "side") {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={`Gerar com IA — ${fieldLabel}`}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
          background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.2)",
          color: "#B9FF4B", cursor: "pointer", flexShrink: 0,
          transition: "all .15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(185,255,75,0.16)";
          e.currentTarget.style.borderColor = "rgba(185,255,75,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(185,255,75,0.08)";
          e.currentTarget.style.borderColor = "rgba(185,255,75,0.2)";
        }}
      >
        <Sparkles style={{ width: 11, height: 11 }} />
        IA
      </button>
    );
  }

  // placement === "inline" — ícone pequeno para usar dentro/ao canto do campo
  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Gerar com IA — ${fieldLabel}`}
      style={{
        width: 22, height: 22, borderRadius: 5, flexShrink: 0,
        background: "rgba(185,255,75,0.10)", border: "1px solid rgba(185,255,75,0.25)",
        color: "#B9FF4B", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(185,255,75,0.2)";
        e.currentTarget.style.borderColor = "rgba(185,255,75,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(185,255,75,0.10)";
        e.currentTarget.style.borderColor = "rgba(185,255,75,0.25)";
      }}
    >
      <Sparkles style={{ width: 11, height: 11 }} />
    </button>
  );
}
