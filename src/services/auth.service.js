/*
 * Authentication service handling business logic.
 * Enforces duplicate checks, password hashing, and token issuance.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const AppError = require('../errors/AppError');
const { toUserDto } = require('../dtos/user.dto');

/**
 * Registers a new user.
 * 
 * @param {Object} data - The validated user properties.
 * @param {Object} requestingUser - The user making the request (not used since we trust middleware).
 * @returns {Object} Clean user object
 */
async function register(data, requestingUser) {
  const existingEmail = await userRepository.findByEmail(data.email);
  if (existingEmail) {
    throw new AppError('Email already registered', 409);
  }

  const existingUsername = await userRepository.findByUsername(data.username);
  if (existingUsername) {
    throw new AppError('Username already taken', 409);
  }

  const costFactor = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  const passwordHash = await bcrypt.hash(data.password, costFactor);

  let newUser = await userRepository.createUser({
    ...data,
    passwordHash
  });

  return toUserDto(newUser);
}

/**
 * Logs in a user.
 * @param {string} email 
 * @param {string} password 
 * @returns {Object} Document with token and user profile
 */
async function login(email, password) {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('Account is deactivated. Contact your administrator.', 403);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  await userRepository.updateLastLogin(user.id);

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return { token, user: toUserDto(user) };
}

module.exports = {
  register,
  login
};
