'use strict';

const repository = require('./products.repository');

async function listCategories(shopId) {
  return repository.listCategories(shopId);
}

async function createCategory(shopId, data) {
  data.name = data.name?.trim();
  const existing = await repository.findCategoryByName(shopId, data.name);
  if (existing) throw Object.assign(new Error('Category name already exists'), { status: 409 });
  return repository.createCategory(shopId, data);
}

async function updateCategory(shopId, id, data) {
  const category = await repository.getCategoryById(shopId, id);
  if (!category) throw Object.assign(new Error('Category not found'), { status: 404 });

  if (data.name) data.name = data.name.trim();
  if (data.name && data.name !== category.name) {
    const existing = await repository.findCategoryByName(shopId, data.name);
    if (existing) throw Object.assign(new Error('Category name already exists'), { status: 409 });
  }

  await repository.updateCategory(shopId, id, data);
  return repository.getCategoryById(shopId, id);
}

async function deleteCategory(shopId, id) {
  const category = await repository.getCategoryById(shopId, id);
  if (!category) throw Object.assign(new Error('Category not found'), { status: 404 });

  const productCount = await repository.countProductsInCategory(shopId, id);
  if (productCount > 0) {
    throw Object.assign(new Error('Category has products; move or delete products first'), { status: 400 });
  }

  const result = await repository.deleteCategory(shopId, id);
  if (result.count === 0) throw Object.assign(new Error('Category not found'), { status: 404 });
}

async function listProducts(shopId, query) {
  return repository.listProducts(shopId, query);
}

async function lookup(shopId, { sku, barcode }) {
  const product = await repository.findProductBySkuOrBarcode(shopId, { sku, barcode });
  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
  return product;
}

async function getProductById(shopId, id) {
  const product = await repository.getProductById(shopId, id);
  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
  return product;
}

async function createProduct(shopId, data) {
  data.name = data.name?.trim();
  data.sku = data.sku?.trim().toUpperCase();
  if (typeof data.barcode === 'string') {
    const b = data.barcode.trim();
    data.barcode = b ? b : null;
  }

  if (data.categoryId) {
    const category = await repository.getCategoryById(shopId, data.categoryId);
    if (!category) throw Object.assign(new Error('Invalid categoryId'), { status: 400 });
  }

  if (data.price < 0) throw Object.assign(new Error('price must be >= 0'), { status: 400 });
  if (data.cost != null && data.cost < 0) throw Object.assign(new Error('cost must be >= 0'), { status: 400 });
  if (data.taxRate != null && (data.taxRate < 0 || data.taxRate > 100)) throw Object.assign(new Error('taxRate must be between 0 and 100'), { status: 400 });

  if (!data.trackInventory) {
    data.stockOnHand = 0;
    data.reorderLevel = 0;
  }

  return repository.createProduct(shopId, data);
}

async function updateProduct(shopId, id, data) {
  const product = await repository.getProductById(shopId, id);
  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });

  if (data.name) data.name = data.name.trim();
  if (data.sku) data.sku = data.sku.trim().toUpperCase();
  if (typeof data.barcode === 'string') {
    const b = data.barcode.trim();
    data.barcode = b ? b : null;
  }

  if (data.categoryId) {
    const category = await repository.getCategoryById(shopId, data.categoryId);
    if (!category) throw Object.assign(new Error('Invalid categoryId'), { status: 400 });
  }

  if (data.price != null && data.price < 0) throw Object.assign(new Error('price must be >= 0'), { status: 400 });
  if (data.cost != null && data.cost < 0) throw Object.assign(new Error('cost must be >= 0'), { status: 400 });
  if (data.taxRate != null && (data.taxRate < 0 || data.taxRate > 100)) throw Object.assign(new Error('taxRate must be between 0 and 100'), { status: 400 });

  if (data.trackInventory === false) {
    data.stockOnHand = 0;
    data.reorderLevel = 0;
  }

  await repository.updateProduct(shopId, id, data);
  return repository.getProductById(shopId, id);
}

async function deleteProduct(shopId, id) {
  const result = await repository.softDeleteProduct(shopId, id);
  if (result.count === 0) throw Object.assign(new Error('Product not found'), { status: 404 });
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  lookup,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
