import { z } from "zod";

export const adminCadastroSchema = z.object({
  perfil: z.object({
    nome: z.string().min(3, "Informe o nome completo"),
    email: z.string().email("Informe um e-mail válido"),
    telefone: z.string().min(10, "Telefone inválido"),
  }),
  preferencia: z.object({
    genero: z.enum(["macho", "femea", "indiferente"]),
    cor: z.string().min(3, "Descreva a cor desejada"),
    entrega: z.enum(["presencial", "concierge"]),
  }),
  checklist: z.object({
    casaPreparada: z.boolean(),
    veterinarioReferencia: z.string().optional(),
    observacoes: z.string().max(600).optional(),
  }),
});

export const adminCadastroAutosaveSchema = adminCadastroSchema.deepPartial();

export type AdminCadastroInput = z.infer<typeof adminCadastroSchema>;
export type AdminCadastroAutosaveInput = z.infer<typeof adminCadastroAutosaveSchema>;

