'use strict';

const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

function normaliseBoolean(value) {
  if (value === true || value === false) return value;
  if (typeof value !== 'string') return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
}

async function listCategories(shopId) {
  return db.productCategory.findMany({
    where: { shopId },
    orderBy: [{ name: 'asc' }],
  });
}

async function findCategoryByName(shopId, name) {
  return db.productCategory.findFirst({
    where: { shopId, name: { equals: name.trim(), mode: 'insensitive' } },
  });
}

async function getCategoryById(shopId, id) {
  return db.productCategory.findFirst({ where: { id, shopId } });
}

async function createCategory(shopId, data) {
  return db.productCategory.create({ data: { ...data, shopId } });
}

async function updateCategory(shopId, id, data) {
  return db.productCategory.updateMany({ where: { id, shopId }, data });
}

async function deleteCategory(shopId, id) {
  return db.productCategory.deleteMany({ where: { id, shopId } });
}

async function countProductsInCategory(shopId, categoryId) {
  return db.product.count({ where: { shopId, categoryId, deletedAt: null } });
}

async function listProducts(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);

  const includeInactive = normaliseBoolean(query.includeInactive) === true;
  const lowStock = normaliseBoolean(query.lowStock) === true;

  const where = {
    shopId,
    deletedAt: null,
    ...(includeInactive ? {} : { isActive: true }),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { sku: { contains: query.search, mode: 'insensitive' } },
            { barcode: { contains: query.search } },
          ],
        }
      : {}),
    ...(lowStock ? { trackInventory: true } : {}),
  };

  if (!lowStock) {
    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
        include: { category: true },
      }),
      db.product.count({ where }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  }

  // Prisma doesn't support comparing two fields in where, so implement lowStock via in-memory filter.
  const all = await db.product.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    include: { category: true },
  });

  const filtered = all.filter((p) => p.trackInventory && p.stockOnHand <= (p.reorderLevel ?? 0));
  const paged = filtered.slice(skip, skip + take);

  return { items: paged, meta: buildMeta(filtered.length, page, limit) };
}

async function findProductBySkuOrBarcode(shopId, { sku, barcode }) {
  return db.product.findFirst({
    where: {
      shopId,
      deletedAt: null,
      OR: [
        ...(sku ? [{ sku: { equals: sku, mode: 'insensitive' } }] : []),
        ...(barcode ? [{ barcode }] : []),
      ],
    },
    include: { category: true },
  });
}

async function getProductById(shopId, id) {
  return db.product.findFirst({
    where: { id, shopId, deletedAt: null },
    include: { category: true },
  });
}

async function createProduct(shopId, data) {
  return db.product.create({
    data: { ...data, shopId },
    include: { category: true },
  });
}

async function updateProduct(shopId, id, data) {
  return db.product.updateMany({
    where: { id, shopId, deletedAt: null },
    data: { ...data, updatedAt: new Date() },
  });
}

async function softDeleteProduct(shopId, id) {
  const product = await db.product.findFirst({ where: { id, shopId, deletedAt: null } });
  if (!product) return { count: 0 };

  const suffix = `del_${Date.now()}_`;
  return db.product.updateMany({
    where: { id, shopId },
    data: {
      deletedAt: new Date(),
      isActive: false,
      sku: `${suffix}${product.sku}`,
      barcode: product.barcode ? `${suffix}${product.barcode}` : null,
      updatedAt: new Date(),
    },
  });
}

module.exports = {
  listCategories,
  findCategoryByName,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  countProductsInCategory,
  listProducts,
  findProductBySkuOrBarcode,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
};
