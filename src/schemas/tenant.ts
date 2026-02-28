import { z } from 'zod';

export const addTenantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  phone: z.string().optional(),
  unit_id: z.string().optional(),
  leaseStart: z.string().optional(),
  leaseEnd: z.string().optional(),
});

export const updateTenantSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  unit_id: z.string().nullable().optional(),
  lease_start: z.string().nullable().optional(),
  lease_end: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
