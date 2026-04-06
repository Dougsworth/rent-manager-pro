import { z } from 'zod';

export const addBorrowerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateBorrowerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
