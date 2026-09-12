// Etapas do funil dos leads (ex.: inscritos de cursos).
// Fonte única de verdade — usada na tela da agência (ClientWorkspace) e no
// portal do time (TeamPortalPage), para que o que a dona marca e o que o
// colaborador vê sejam exatamente as mesmas etapas.
export const COURSE_PIPELINE_STAGES = [
  { key: "inscrito",             label: "Inscrito",        emoji: "📝" },
  { key: "aguardando_pagamento", label: "Ag. Pagamento",   emoji: "💳" },
  { key: "confirmado",           label: "Confirmado",      emoji: "✅" },
  { key: "inicio_curso",         label: "Início do Curso", emoji: "🚀" },
  { key: "andamento",            label: "Em Andamento",    emoji: "📚" },
  { key: "concluido",            label: "Concluído",       emoji: "🎓" },
] as const;

export function etapaLabel(key: string | null | undefined) {
  return COURSE_PIPELINE_STAGES.find((s) => s.key === key) ?? null;
}
