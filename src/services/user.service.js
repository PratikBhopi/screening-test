const userRepository = require('../repositories/user.repository');
const AppError = require('../errors/AppError');
const { toUserDto } = require('../dtos/user.dto');

/**
 * Returns all users.
 * @returns {Array} Array of user profiles
 */
async function getAllUsers() {
  const users = await userRepository.findAll();
  return users.map(toUserDto);
}

/**
 * Returns a user by ID. Throws 404 if not found.
 * @param {string} id 
 * @returns {Object} User profile
 */
async function getUserById(id) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return toUserDto(user);
}

/**
 * Updates a user's role.
 * @param {string} targetUserId 
 * @param {string} newRole Enum Role
 * @param {string} requestingUserId 
 * @returns {Object} Updated user profile
 */
async function updateUserRole(targetUserId, newRole, requestingUserId) {
  await getUserById(targetUserId);

  if (targetUserId === requestingUserId) {
    throw new AppError('You cannot change your own role.', 400);
  }

  const updatedUser = await userRepository.updateRole(targetUserId, newRole);

  return toUserDto(updatedUser);
}

/**
 * Updates a user's status.
 * @param {string} targetUserId 
 * @param {string} newStatus Enum UserStatus
 * @param {string} requestingUserId 
 * @returns {Object} Updated user profile
 */
async function updateUserStatus(targetUserId, newStatus, requestingUserId) {
  await getUserById(targetUserId);

  if (targetUserId === requestingUserId) {
    throw new AppError('You cannot change your own account status.', 400);
  }

  const updatedUser = await userRepository.updateStatus(targetUserId, newStatus);
  return toUserDto(updatedUser);
}

/**
 * Returns a user's own profile.
 * @param {string} userId 
 * @returns {Object} User profile
 */
async function getMe(userId) {
  return getUserById(userId);
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  getMe
};
