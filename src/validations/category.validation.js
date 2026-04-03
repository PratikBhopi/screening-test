const { z } = require('zod');

exports.createCategorySchema = z.object({
  name: z.string().trim().min(2).max(50),
  typeHint: z.enum(['INCOME', 'EXPENSE', 'BOTH']).default('BOTH'),
  description: z.string().max(200).optional()
});

exports.updateCategorySchema = exports.createCategorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
    path: []
  }
);
