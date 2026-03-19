import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  address: z.string().optional(),
});

export const createUnitSchema = z.object({
  name: z.string().min(1, 'Unit name is required'),
  rentAmount: z.string().min(1, 'Rent amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Rent must be a positive number'
  ),
});
