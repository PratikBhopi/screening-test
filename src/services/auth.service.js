const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');
const AppError = require('../errors/AppError');
const { toUserDto } = require('../dtos/user.dto');
const { generateTempPassword } = require('../utils/generateTempPassword');
const { addToBlacklist } = require('../utils/tokenBlacklist');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function register(data) {
  const existingEmail = await userRepository.findByEmail(data.email);
  if (existingEmail) throw new AppError('Email already registered', 409);

  const existingUsername = await userRepository.findByUsername(data.username);
  if (existingUsername) throw new AppError('Username already taken', 409);

  const temporaryPassword = generateTempPassword();
  const costFactor = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  const passwordHash = await bcrypt.hash(temporaryPassword, costFactor);

  const newUser = await userRepository.createUser({
    ...data,
    role: data.role || 'VIEWER',
    passwordHash,
    mustChangePassword: true
  });

  console.log(`============================================
NEW USER CREDENTIALS
Username : ${newUser.username}
Email    : ${newUser.email}
Password : ${temporaryPassword}
Role     : ${newUser.role}
NOTE: User must change password on first login.
============================================`);

  return { user: toUserDto(newUser), temporaryPassword };
}

async function login(email, password) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('Invalid credentials', 401);

  if (user.status !== 'ACTIVE') {
    throw new AppError('Account is deactivated. Contact your administrator.', 403);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  const jwt_id = crypto.randomUUID();
  await userRepository.updateLastLogin(user.id);

  const token = jwt.sign(
    { userId: user.id, role: user.role, mustChangePassword: user.mustChangePassword, jwt_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { token, user: toUserDto(user) };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userRepository.findByIdWithHash(userId);
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new AppError('Current password is incorrect.', 401);

  const costFactor = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  const newHash = await bcrypt.hash(newPassword, costFactor);
  await userRepository.updatePassword(userId, newHash);

  return { message: 'Password changed successfully.' };
}

// Adds the token's jti to the blacklist so it can't be reused before expiry
async function logout(jwt_id, token) {
  addToBlacklist(jwt_id, token);
  return { message: 'Logged out successfully.' };
}

module.exports = { register, login, changePassword, logout };
