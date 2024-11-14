import * as z from 'zod';

// Schema di validazione per il login
export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username deve essere di almeno 3 caratteri')
    .max(50, 'Username non può superare i 50 caratteri')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username può contenere solo lettere, numeri, - e _'),
  password: z.string()
    .min(8, 'Password deve essere di almeno 8 caratteri')
    .max(50, 'Password non può superare i 50 caratteri')
});

// Schema di validazione per la registrazione
export const registerSchema = z.object({
  email: z.string()
    .email('Email non valida')
    .max(255, 'Email non può superare i 255 caratteri'),
  username: z.string()
    .min(3, 'Username deve essere di almeno 3 caratteri')
    .max(50, 'Username non può superare i 50 caratteri')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username può contenere solo lettere, numeri, - e _'),
  password: z.string()
    .min(8, 'Password deve essere di almeno 8 caratteri')
    .max(50, 'Password non può superare i 50 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'Password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero')
    .regex(/[!@#$%^&*()]/, 'Password deve contenere almeno un carattere speciale (!@#$%^&*())'),
  tenant_name: z.string()
    .min(2, 'Nome tenant deve essere di almeno 2 caratteri')
    .max(100, 'Nome tenant non può superare i 100 caratteri')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Nome tenant può contenere solo lettere, numeri, - e _')
    .optional()
});

// Schema di validazione per il contatto
export const contactSchema = z.object({
  first_name: z.string()
    .min(1, 'Nome è richiesto')
    .max(100, 'Nome non può superare i 100 caratteri'),
  last_name: z.string()
    .min(1, 'Cognome è richiesto')
    .max(100, 'Cognome non può superare i 100 caratteri'),
  phone: z.string()
    .min(1, 'Telefono è richiesto')
    .max(20, 'Telefono non può superare i 20 caratteri')
    .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Formato telefono non valido'),
  email: z.string()
    .email('Email non valida')
    .max(255, 'Email non può superare i 255 caratteri')
    .optional()
    .nullable(),
  address: z.string()
    .min(1, 'Indirizzo è richiesto')
    .max(255, 'Indirizzo non può superare i 255 caratteri'),
  notes: z.string()
    .max(1000, 'Note non possono superare i 1000 caratteri')
    .optional()
    .nullable(),
  favorite: z.boolean().optional()
});

// Schema di validazione per il reset password
export const passwordResetSchema = z.object({
  email: z.string()
    .email('Email non valida')
    .max(255, 'Email non può superare i 255 caratteri')
});

// Schema di validazione per l'aggiornamento password
export const passwordUpdateSchema = z.object({
  current_password: z.string()
    .min(8, 'Password deve essere di almeno 8 caratteri'),
  new_password: z.string()
    .min(8, 'Password deve essere di almeno 8 caratteri')
    .max(50, 'Password non può superare i 50 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'Password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero')
    .regex(/[!@#$%^&*()]/, 'Password deve contenere almeno un carattere speciale')
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ContactSchema = z.infer<typeof contactSchema>;
export type PasswordResetSchema = z.infer<typeof passwordResetSchema>;
export type PasswordUpdateSchema = z.infer<typeof passwordUpdateSchema>;