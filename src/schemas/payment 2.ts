import { z } from 'zod';

export const createPaymentSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant is required'),
  invoice_id: z.string().optional(),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  method: z.enum(['bank_transfer', 'card', 'cash', 'other']),
  payment_date: z.string().optional(),
  notes: z.string().optional(),
});
