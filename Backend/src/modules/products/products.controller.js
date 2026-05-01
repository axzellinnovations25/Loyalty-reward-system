'use strict';

const service = require('./products.service');
const { ok, created, noContent, badRequest } = require('../../utils/apiResponse');

const listCategories = async (req, res, next) => {
  try {
    return ok(res, await service.listCategories(req.shopId));
  } catch (e) {
    next(e);
  }
};

const createCategory = async (req, res, next) => {
  try {
    return created(res, await service.createCategory(req.shopId, req.body));
  } catch (e) {
    next(e);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    return ok(res, await service.updateCategory(req.shopId, req.params.id, req.body));
  } catch (e) {
    next(e);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await service.deleteCategory(req.shopId, req.params.id);
    return noContent(res);
  } catch (e) {
    next(e);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const { items, meta } = await service.listProducts(req.shopId, req.query);
    return ok(res, items, meta);
  } catch (e) {
    next(e);
  }
};

const lookupProduct = async (req, res, next) => {
  try {
    const { sku, barcode } = req.query;
    if (!sku && !barcode) return badRequest(res, 'Provide sku or barcode');
    return ok(res, await service.lookup(req.shopId, { sku, barcode }));
  } catch (e) {
    next(e);
  }
};

const getProductById = async (req, res, next) => {
  try {
    return ok(res, await service.getProductById(req.shopId, req.params.id));
  } catch (e) {
    next(e);
  }
};

const createProduct = async (req, res, next) => {
  try {
    return created(res, await service.createProduct(req.shopId, req.body));
  } catch (e) {
    next(e);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    return ok(res, await service.updateProduct(req.shopId, req.params.id, req.body));
  } catch (e) {
    next(e);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await service.deleteProduct(req.shopId, req.params.id);
    return noContent(res);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  lookupProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

