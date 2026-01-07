import { z } from 'zod';

export const userIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Invalid user id')
    .transform(val => parseInt(val, 10)),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z.string().email().max(255).toLowerCase().trim().optional(),
    password: z.string().min(6).max(128).optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
