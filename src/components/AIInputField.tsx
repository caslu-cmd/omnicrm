import { useRef } from "react";
import { Sparkles } from "lucide-react";
import { useAIField } from "@/contexts/AIFieldContext";

interface AIInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldLabel: string;
  fieldContext?: string;
}

export function AIInputField({
  fieldLabel,
  fieldContext = "",
  className = "",
  value,
  onChange,
  style,
  ...rest
}: AIInputFieldProps) {
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
          onChange({ target: { value: text } } as React.ChangeEvent<HTMLInputElement>);
        }
      },
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <input
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
          position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)",
          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
          background: "rgba(185,255,75,0.10)", border: "1px solid rgba(185,255,75,0.25)",
          color: "#B9FF4B", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(185,255,75,0.2)"; e.currentTarget.style.borderColor = "rgba(185,255,75,0.5)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(185,255,75,0.10)"; e.currentTarget.style.borderColor = "rgba(185,255,75,0.25)"; }}
      >
        <Sparkles style={{ width: 10, height: 10 }} />
      </button>
    </div>
  );
}
