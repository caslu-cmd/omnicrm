import { describe, it, expect } from "vitest";
import { routinesToCreate, dbStatusFor, DEFAULT_ROUTINES } from "./activateAgents";

describe("routinesToCreate", () => {
  it("cria todas as rotinas padrão quando o cliente não tem nenhuma", () => {
    const result = routinesToCreate([]);
    expect(result).toHaveLength(DEFAULT_ROUTINES.length);
    expect(result.map((r) => r.rotina)).toEqual(DEFAULT_ROUTINES.map((r) => r.rotina));
  });

  it("não sobrescreve rotinas que o cliente já configurou", () => {
    const result = routinesToCreate([{ rotina: "pauta" }, { rotina: "calendario" }]);
    expect(result.map((r) => r.rotina)).toEqual(["carrossel", "relatorio"]);
  });

  it("devolve vazio quando todas as rotinas já existem", () => {
    const existing = DEFAULT_ROUTINES.map((r) => ({ rotina: r.rotina }));
    expect(routinesToCreate(existing)).toEqual([]);
  });

  it("ignora rotinas desconhecidas do cliente ao decidir o que criar", () => {
    const result = routinesToCreate([{ rotina: "outra-coisa" }]);
    expect(result).toHaveLength(DEFAULT_ROUTINES.length);
  });
});

describe("dbStatusFor", () => {
  it("mapeia Ativo para active e o resto para onboarding", () => {
    expect(dbStatusFor("Ativo")).toBe("active");
    expect(dbStatusFor("Onboarding")).toBe("onboarding");
    expect(dbStatusFor("Em pausa")).toBe("onboarding");
  });
});
