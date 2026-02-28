import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

export const updateCompanyInfoSchema = z.object({
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyCity: z.string().optional(),
  companyCountry: z.string().optional(),
  companyWebsite: z.string().url('Invalid URL').or(z.literal('')).optional(),
  companyTaxId: z.string().optional(),
});

export const updateBankDetailsSchema = z.object({
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  payments: z.boolean(),
  overdue: z.boolean(),
  invoices: z.boolean(),
  auto_remind: z.boolean(),
});
