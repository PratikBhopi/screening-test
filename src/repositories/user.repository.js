/*
 * Database abstraction layer for User model using Prisma.
 * No business logic should reside here.
 */
const prisma = require('../models');

/**
 * Inserts a new user row.
 * @param {Object} data contains username, email, passwordHash, role.
 * @returns {Object} the created user.
 */
async function createUser(data) {
  return prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role
    }
  });
}

/**
 * Returns a single user by email.
 * This is the only place passwordHash is allowed to be returned.
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
      lastLogin: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

/**
 * Returns all users ordered by created_at DESC.
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
      id: true, email: true, username: true, role: true, status: true, lastLogin: true, createdAt: true, updatedAt: true
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
      id: true, email: true, username: true, role: true, status: true, lastLogin: true, createdAt: true, updatedAt: true
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
  findAll,
  updateRole,
  updateStatus,
  updateLastLogin
};
