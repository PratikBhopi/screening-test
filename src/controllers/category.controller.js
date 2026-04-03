const categoryService = require('../services/category.service');
const { createCategorySchema, updateCategorySchema } = require('../validations/category.validation');
const AppError = require('../errors/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * - Create Category Controller
 * - POST /api/v1/categories
 */
const create = asyncHandler(async (req, res, next) => {
  const parseResult = createCategorySchema.safeParse(req.body);

  if (!parseResult.success) {
    throw new AppError(parseResult.error.issues[0].message, 400);
  }

  const category = await categoryService.createCategory(parseResult.data);
  return res.status(201).json({
    success: true,
    data: category
  });
});

/**
 * - Get All Categories Controller
 * - GET /api/v1/categories
 */
const getAll = asyncHandler(async (req, res, next) => {
  const categories = await categoryService.getCategories();
  return res.status(200).json({
    success: true,
    data: categories
  });
});

/**
 * - Update Category Controller
 * - PATCH /api/v1/categories/:id
 */
const update = asyncHandler(async (req, res, next) => {
  const parseResult = updateCategorySchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(parseResult.error.issues[0].message, 400);
  }

  const category = await categoryService.updateCategory(parseInt(req.params.id, 10), parseResult.data);
  return res.status(200).json({
    success: true,
    data: category
  });
});

/**
 * - Remove Category Controller
 * - DELETE /api/v1/categories/:id
 */
const remove = asyncHandler(async (req, res, next) => {
  const result = await categoryService.deleteCategory(parseInt(req.params.id, 10));
  return res.status(200).json({
    success: true,
    data: result
  });
});

module.exports = {
  create,
  getAll,
  update,
  remove
};
