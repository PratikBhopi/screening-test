/*
 * Zod validation schemas for Auth & User inputs.
 */
const { z } = require('zod');

/*
 * Used by: POST /api/v1/auth/register
 * Admin creates a user. Password is NOT accepted here.
 * The system generates the temp password internally.
 * Admin provides identity and role only.
 */
const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Alphanumeric and underscores only"),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']).optional().default('VIEWER')
});

/*
 * Used by: POST /api/v1/auth/login
 * Validates format only. Credential correctness is checked
 * in the service via bcrypt.compare — not here.
 */
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

/*
 * Used by: PATCH /api/v1/auth/change-password
 * Applies to both first-time temp password change and
 * voluntary password updates by any authenticated user.
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d).+$/, "Must contain at least 1 uppercase and 1 number"),
  confirmPassword: z.string().min(1)
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"]
}).refine(data => data.newPassword !== data.currentPassword, {
  message: "New password must be different from current password.",
  path: ["newPassword"]
});

/*
 * Used by: PATCH /:id/role
 */
const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER'], { required_error: "Role is required" })
});

/*
 * Used by: PATCH /:id/status
 */
const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], { required_error: "Status is required" })
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateRoleSchema,
  updateStatusSchema
};
