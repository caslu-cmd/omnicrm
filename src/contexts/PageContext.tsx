import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface PageCtxValue {
  pageContext: string;
  setPageContext: (ctx: string) => void;
  clearPageContext: () => void;
}

const PageCtx = createContext<PageCtxValue>({
  pageContext: "",
  setPageContext: () => {},
  clearPageContext: () => {},
});

export const usePageContext = () => useContext(PageCtx);

export function PageContextProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContextState] = useState("");
  const setPageContext = useCallback((ctx: string) => setPageContextState(ctx), []);
  const clearPageContext = useCallback(() => setPageContextState(""), []);
  return (
    <PageCtx.Provider value={{ pageContext, setPageContext, clearPageContext }}>
      {children}
    </PageCtx.Provider>
  );
}
