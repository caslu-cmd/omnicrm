import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AIFieldState {
  isOpen: boolean;
  position: { x: number; y: number };
  fieldLabel: string;
  currentValue: string;
  fieldContext: string;
  onInsert: (text: string) => void;
}

interface AIFieldContextValue {
  state: AIFieldState;
  open: (opts: Omit<AIFieldState, "isOpen">) => void;
  close: () => void;
}

const CLOSED: AIFieldState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  fieldLabel: "",
  currentValue: "",
  fieldContext: "",
  onInsert: () => {},
};

const AIFieldContext = createContext<AIFieldContextValue>({
  state: CLOSED,
  open: () => {},
  close: () => {},
});

export function AIFieldProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AIFieldState>(CLOSED);

  const open = useCallback((opts: Omit<AIFieldState, "isOpen">) => {
    setState({ isOpen: true, ...opts });
  }, []);

  const close = useCallback(() => setState(CLOSED), []);

  return (
    <AIFieldContext.Provider value={{ state, open, close }}>
      {children}
    </AIFieldContext.Provider>
  );
}

export function useAIField() {
  return useContext(AIFieldContext);
}
