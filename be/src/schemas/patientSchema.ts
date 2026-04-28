import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dni: z.string().min(1).max(20),
  phone: z.string().max(20).optional(),
  birthDate: z.string().datetime().optional(),
  active: z.boolean().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const patientIdSchema = z.object({
  id: z.string().transform(Number),
});

export type CreatePatientDto = z.infer<typeof createPatientSchema>;
export type UpdatePatientDto = z.infer<typeof updatePatientSchema>;
export type PatientIdParam = z.infer<typeof patientIdSchema>;