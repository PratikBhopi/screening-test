/*
 * Zod validation schemas for Dashboard Analytics queries.
 */
const { z } = require('zod');

// Helper to add refine check to schemas mapping startDate and endDate.
const dateRefiner = (schema) => schema.refine((data) => {
  if (data.startDate && data.endDate) {
    return data.startDate < data.endDate;
  }
  return true;
}, {
  message: "startDate must be before endDate.",
  path: ["startDate"]
});

/*
 * Used by: GET /api/v1/dashboard/summary
 */
const summaryQuerySchema = dateRefiner(z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}));

/*
 * Used by: GET /api/v1/dashboard/categories
 */
const categoryQuerySchema = dateRefiner(z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional()
}));

/*
 * Used by: GET /api/v1/dashboard/categories/trends
 * from and to are required — the time-series is always scoped to an explicit range.
 * groupBy controls the time bucket size: 'monthly' (default) or 'weekly'.
 */
const categoryTrendsQuerySchema = dateRefiner(z.object({
  from:    z.coerce.date({ required_error: "from is required" }),
  to:      z.coerce.date({ required_error: "to is required" }),
  groupBy: z.enum(['monthly', 'weekly']).default('monthly')
}));

/*
 * Used by: GET /api/v1/dashboard/insights
 * Requires startDate and endDate — insights are always scoped to an explicit range.
 * This avoids the "no data today" problem and makes the response deterministic.
 */
const insightsQuerySchema = dateRefiner(z.object({
  startDate: z.coerce.date({ required_error: "startDate is required" }),
  endDate:   z.coerce.date({ required_error: "endDate is required" })
}));

/*
 * Used by: GET /api/v1/dashboard/compare
 */
const compareQuerySchema = z.object({
  period: z.enum(['monthly', 'weekly', 'quarterly']).default('monthly').optional(),
  date: z.coerce.date().default(() => new Date()).optional()
});

module.exports = {
  summaryQuerySchema,
  categoryQuerySchema,
  categoryTrendsQuerySchema,
  insightsQuerySchema,
  compareQuerySchema
};
