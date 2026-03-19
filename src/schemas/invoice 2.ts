import { z } from 'zod';

export const createInvoiceSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  due_date: z.string().min(1, 'Due date is required'),
  description: z.string().optional(),
});
