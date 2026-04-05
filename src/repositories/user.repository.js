const prisma = require('../models');

// I strip passwordHash before returning — it should never leave this layer except in findByEmail and findByIdWithHash
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

// I return the full row including passwordHash here — only used for login verification
async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findByUsername(username) {
  return prisma.user.findUnique({ where: { username } });
}

// Used by authenticate middleware to check live status on every request
async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, username: true, role: true, status: true,
      mustChangePassword: true, lastLogin: true, createdAt: true, updatedAt: true
    }
  });
}

// I only use this for change-password flows where I need to verify the current hash
async function findByIdWithHash(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function findAll() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, username: true, role: true, status: true,
      mustChangePassword: true, lastLogin: true, createdAt: true, updatedAt: true
    }
  });
}

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

// I also flip mustChangePassword to false here so the user doesn't get prompted again
async function updatePassword(userId, newPasswordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash, mustChangePassword: false }
  });
}

async function updateLastLogin(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() }
  });
}

module.exports = {
  createUser, findByEmail, findByUsername, findById, findByIdWithHash,
  findAll, updateRole, updateStatus, updatePassword, updateLastLogin
};
