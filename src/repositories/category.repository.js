/*
 * Database abstraction layer for Category model using Prisma.
 * All raw queries for categories.
 */
const prisma = require('../models');
const AppError = require('../errors/AppError');

/**
 * Inserts one Category.
 * @param {Object} data - category details (name, typeHint, description)
 * @returns {Object} created category
 */
async function create(data) {
  return prisma.category.create({
    data
  });
}

/**
 * Returns all categories ordered by name ASC.
 * @returns {Array} List of categories
 */
async function findAll() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
}

/**
 * Returns one category or null.
 * @param {number} id 
 * @returns {Object|null}
 */
async function findById(id) {
  return prisma.category.findUnique({
    where: { id }
  });
}

/**
 * Update and return the updated category.
 * @param {number} id 
 * @param {Object} data 
 * @returns {Object}
 */
async function update(id, data) {
  return prisma.category.update({
    where: { id },
    data
  });
}

/**
 * Hard delete a category. 
 * @param {number} id 
 * @returns {Object} deleted category
 */
async function remove(id) {
  /* 
   * Deleting a category that records depend on would leave those records without a valid
   * category, breaking dashboard aggregations.
   */
  const activeRecordsCount = await prisma.financialRecord.count({
    where: { 
      categoryId: id,
      deletedAt: null
    }
  });

  if (activeRecordsCount > 0) {
    throw new AppError('Cannot delete a category that has active financial records linked to it', 400);
  }

  return prisma.category.delete({
    where: { id }
  });
}

module.exports = {
  create,
  findAll,
  findById,
  update,
  delete: remove
};
