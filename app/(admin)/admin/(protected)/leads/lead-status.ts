// Dados compartilhados com o navegador; nenhuma dependência de banco ou segredo.
export const LEAD_STATUS_OPTIONS = ["novo", "em_contato", "fechado", "perdido"] as const;
export type LeadStatus = (typeof LEAD_STATUS_OPTIONS)[number];
