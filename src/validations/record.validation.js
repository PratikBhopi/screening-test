/*
 * Validation schemas for Financial Record routes.
 */
const { z } = require('zod');

exports.createRecordSchema = z.object({
  transactionRef: z.string().trim().min(1).max(100), // required unique identifier per transaction
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().trim().min(1, "Category is required").max(100),
  transactionDate: z.coerce.date(),
  description: z.string().trim().max(500).optional()
});

exports.updateRecordSchema = exports.createRecordSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
    path: []
  }
);

exports.filterRecordSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate < data.endDate;
    }
    return true;
  },
  {
    message: "startDate must be before endDate",
    path: []
  }
);
