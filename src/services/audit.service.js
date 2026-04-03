/*
 * Service for handling audit logs.
 */
const prisma = require('../models');

/**
 * Logs an action to the AuditLog table.
 * @param {Object} args - { userId, action, entityType, entityId, oldValue, newValue, ipAddress }
 */
async function log({ userId, action, entityType, entityId, oldValue, newValue, ipAddress }) {
  /*
   * Audit logging is observational — it must never cause a business operation to fail.
   * If the audit insert fails for any reason, the original operation
   * (creating a record, updating a role) still succeeds.
   */
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: String(entityId),
        oldValue: oldValue || null,
        newValue: newValue || null,
        ipAddress: ipAddress || null
      }
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
}

module.exports = {
  log
};
