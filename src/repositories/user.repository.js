const prisma = require('../models');

/**
 * Inserts a new user row.
 * @param {Object} data contains username, email, passwordHash, role, mustChangePassword.
 * @returns {Object} the created user.
 */
async function createUser(data) {
  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
      mustChangePassword: data.mustChangePassword
    }
  });

  const { passwordHash, ...userWithoutHash } = user;
  return userWithoutHash;
}

/**
 * Returns a single user by email.
 * This is the only place (along with findByIdWithHash) passwordHash is allowed to be returned.
 * @param {string} email
 * @returns {Object|null}
 */
async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email }
  });
}

/**
 * Returns a single user by username.
 * @param {string} username
 * @returns {Object|null}
 */
async function findByUsername(username) {
  return prisma.user.findUnique({
    where: { username }
  });
}

/**
 * Returns a single user by UUID. Excludes passwordHash.
 * @param {string} id
 * @returns {Object|null}
 */
async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

/**
 * Returns a single user including passwordHash.
 * Used exclusively by change-password flows.
 * @param {string} id
 * @returns {Object|null}
 */
async function findByIdWithHash(id) {
  return prisma.user.findUnique({
    where: { id }
  });
}

/**
 * Returns all users ordered by createdAt DESC.
 * Excludes passwordHash from every row.
 * @returns {Array} List of users
 */
async function findAll() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

/**
 * Updates only the role field.
 * @param {string} userId
 * @param {string} role Enum Role
 * @returns {Object} Updated user
 */
async function updateRole(userId, role) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true, email: true, username: true, role: true, status: true,
      mustChangePassword: true, lastLogin: true, createdAt: true, updatedAt: true
    }
  });
}

/**
 * Updates only the status field.
 * @param {string} userId
 * @param {string} status Enum UserStatus
 * @returns {Object} Updated user
 */
async function updateStatus(userId, status) {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true, email: true, username: true, role: true, status: true,
      mustChangePassword: true, lastLogin: true, createdAt: true, updatedAt: true
    }
  });
}

/**
 * Updates passwordHash and sets mustChangePassword = false.
 * @param {string} userId
 * @param {string} newPasswordHash
 */
async function updatePassword(userId, newPasswordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { 
      passwordHash: newPasswordHash,
      mustChangePassword: false
    }
  });
}

/**
 * Sets lastLogin to current timestamp.
 * @param {string} userId
 */
async function updateLastLogin(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() }
  });
}

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findById,
  findByIdWithHash,
  findAll,
  updateRole,
  updateStatus,
  updatePassword,
  updateLastLogin
};
