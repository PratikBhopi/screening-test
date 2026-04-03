const toCategoryDto = (category) => {
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    createdAt: category.createdAt
  };
};

module.exports = { toCategoryDto };
