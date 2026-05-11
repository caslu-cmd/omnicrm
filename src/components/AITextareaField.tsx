import { useRef } from "react";
import { Sparkles } from "lucide-react";
import { useAIField } from "@/contexts/AIFieldContext";

interface AITextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldLabel: string;
  fieldContext?: string;
}

export function AITextareaField({
  fieldLabel,
  fieldContext = "",
  className = "",
  value,
  onChange,
  style,
  ...rest
}: AITextareaFieldProps) {
  const { open } = useAIField();
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    open({
      position: { x: rect.left, y: rect.bottom + 6 },
      fieldLabel,
      currentValue: String(value ?? ""),
      fieldContext,
      onInsert: (text) => {
        if (onChange) {
          onChange({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>);
        }
      },
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <textarea
        value={value}
        onChange={onChange}
        className={className}
        style={{ paddingRight: 30, ...style }}
        {...rest}
      />
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        title={`Gerar com IA — ${fieldLabel}`}
        style={{
          position: "absolute", top: 8, right: 8,
          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
          background: "rgba(185,255,75,0.10)", border: "1px solid rgba(185,255,75,0.25)",
          color: "#B9FF4B", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s",
          zIndex: 1,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(185,255,75,0.2)"; e.currentTarget.style.borderColor = "rgba(185,255,75,0.5)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(185,255,75,0.10)"; e.currentTarget.style.borderColor = "rgba(185,255,75,0.25)"; }}
      >
        <Sparkles style={{ width: 10, height: 10 }} />
      </button>
    </div>
  );
}
