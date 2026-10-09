import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Inserisci la password"),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Inserisci nome e cognome"),
    email: z.string().email("Email non valida"),
    password: z.string().min(8, "Almeno 8 caratteri"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email("Email non valida"),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Almeno 8 caratteri"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
