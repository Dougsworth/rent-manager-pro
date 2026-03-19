import { z } from 'zod';

export const recurringInvoiceSettingsSchema = z.object({
  enabled: z.boolean(),
  dayOfMonth: z.string().refine(
    (v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 28,
    'Day must be between 1 and 28',
  ),
  sendEmails: z.boolean(),
  descriptionTemplate: z.string().min(1, 'Description template is required'),
});
