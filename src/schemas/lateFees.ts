import { z } from 'zod';

export const lateFeeSettingsSchema = z.object({
  feeType: z.enum(['flat', 'percentage']),
  feeValue: z.string().min(1, 'Fee value is required').refine(
    (v) => !isNaN(Number(v)) && Number(v) > 0,
    'Must be a positive number',
  ),
  gracePeriodDays: z.string().refine(
    (v) => !isNaN(Number(v)) && Number(v) >= 0,
    'Must be 0 or more',
  ),
  autoApply: z.boolean(),
});
