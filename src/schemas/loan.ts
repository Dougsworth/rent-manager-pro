import { z } from 'zod';

export const createLoanSchema = z.object({
  borrower_id: z.string().min(1, 'Select a borrower'),
  principal: z.string().min(1, 'Loan amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Must be a positive number' }
  ),
  interest_rate: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
    { message: 'Interest rate must be 0–100' }
  ),
  term_months: z.string().min(1, 'Term is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0 && Number.isInteger(Number(val)),
    { message: 'Must be a positive whole number' }
  ),
  start_date: z.string().min(1, 'Start date is required'),
  notes: z.string().optional(),
});

export const createLoanPaymentSchema = z.object({
  loan_id: z.string().min(1, 'Select a loan'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Must be a positive number' }
  ),
  method: z.enum(['bank_transfer', 'card', 'cash', 'other']).optional(),
  payment_date: z.string().optional(),
  notes: z.string().optional(),
});
