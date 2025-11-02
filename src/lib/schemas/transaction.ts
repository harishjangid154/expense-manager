import { z } from 'zod';

export const transactionSchema = z.object({
  clientId: z.string().optional(),
  accountId: z.string().uuid(),
  amountMinor: z.number().int(),
  currency: z.string().min(3).max(3),
  category: z.string().min(1),
  merchant: z.string().optional(),
  note: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime().or(z.date()),
});

export const transactionUpdateSchema = z.object({
  accountId: z.string().uuid().optional(),
  amountMinor: z.number().int().optional(),
  currency: z.string().min(3).max(3).optional(),
  category: z.string().min(1).optional(),
  merchant: z.string().optional(),
  note: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  isDeleted: z.boolean().optional(),
});

export const transactionBulkImportSchema = z.array(transactionSchema);

export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
export type TransactionBulkImportInput = z.infer<typeof transactionBulkImportSchema>;
