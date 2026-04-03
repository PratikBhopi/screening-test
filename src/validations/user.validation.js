/*
 * Zod validation schemas for Auth & User inputs.
 */
const { z } = require('zod');

/*
 * registerSchema: Used by the POST /register endpoint.
 * Validates creating a new user. Role defaults to VIEWER.
 * Password requires 8 chars, 1 uppercase, 1 number.
 */
const registerSchema = z.object({
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Alphanumeric and underscores only"),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(12).regex(/^(?=.*[A-Z])(?=.*\d).+$/, "Must contain at least 1 uppercase and 1 number"),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']).optional().default('VIEWER')
});

/*
 * loginSchema: Used by the POST /login endpoint.
 */
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

/*
 * updateRoleSchema: Used by PATCH /:id/role
 */
const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER'], { required_error: "Role is required" })
});

/*
 * updateStatusSchema: Used by PATCH /:id/status
 */
const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], { required_error: "Status is required" })
});

module.exports = {
  registerSchema,
  loginSchema,
  updateRoleSchema,
  updateStatusSchema
};
