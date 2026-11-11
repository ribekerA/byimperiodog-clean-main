// Os cinco status que o banco aceita. A fonte e `@/domain/lead-status`;
// este arquivo existe para a tela (codigo de navegador) importar a lista sem
// puxar o modulo de consultas, que so roda no servidor.
import { LEAD_STATUS, type LeadStatus as DomainLeadStatus } from "@/domain/lead-status";

export const LEAD_STATUS_OPTIONS = LEAD_STATUS;

export type LeadStatus = DomainLeadStatus;
