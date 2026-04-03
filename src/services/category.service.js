/*
 * Service layer for Category business logic.
 */
const categoryRepository = require('../repositories/category.repository');
const AppError = require('../errors/AppError');
const prisma = require('../models');
const { toCategoryDto } = require('../dtos/category.dto');

/**
 * Create a new category.
 * @param {Object} data 
 * @returns {Object}
 */
async function createCategory(data) {
  // 1. Check if a category with the same name already exists.
  const existing = await prisma.category.findUnique({
    where: { name: data.name }
  });
  if (existing) {
    throw new AppError('Category name already exists', 409);
  }

  // 2. Call repository create(data).
  // 3. Return created category as DTO.
  const category = await categoryRepository.create(data);
  return toCategoryDto(category);
}

/**
 * Return repository findAll().
 * @returns {Array} List of categories
 */
async function getCategories() {
  const categories = await categoryRepository.findAll();
  return categories.map(toCategoryDto);
}

/**
 * Update an existing category.
 * @param {number} id 
 * @param {Object} data 
 * @returns {Object}
 */
async function updateCategory(id, data) {
  // 1. Verify category exists.
  const category = await categoryRepository.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // 2. If data.name is provided, check no OTHER category has that name.
  if (data.name && data.name !== category.name) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name }
    });
    if (existing) {
      throw new AppError('Category name already exists', 409);
    }
  }

  // 3. Call repository update.
  const updatedCategory = await categoryRepository.update(id, data);
  return toCategoryDto(updatedCategory);
}

/**
 * Delete a category.
 * @param {number} id 
 * @returns {Object} success message
 */
async function deleteCategory(id) {
  // The guard is in the repository. Just call repository delete(id)
  await categoryRepository.delete(id);
  return { message: "Category deleted successfully" };
}

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
};
