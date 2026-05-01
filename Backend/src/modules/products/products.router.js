'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./products.controller');
const {
  categoryCreateSchema,
  categoryUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  validateBody,
} = require('./products.validator');

router.use(authenticate);

// Categories
router.get('/categories', controller.listCategories);
router.post('/categories', validateBody(categoryCreateSchema), controller.createCategory);
router.patch('/categories/:id', validateBody(categoryUpdateSchema), controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

// Products
router.get('/', controller.listProducts);
router.get('/lookup', controller.lookupProduct);
router.get('/:id', controller.getProductById);
router.post('/', validateBody(productCreateSchema), controller.createProduct);
router.patch('/:id', validateBody(productUpdateSchema), controller.updateProduct);
router.delete('/:id', controller.deleteProduct);

module.exports = router;

