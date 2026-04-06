'use strict';

const router = require('express').Router();
const authenticateAdmin = require('../../../middleware/authenticateAdmin');
const controller = require('./users.controller');
const { createSchema, updateSchema, resetPasswordSchema, validateBody } = require('./users.validator');

router.use(authenticateAdmin);

router.get('/',    controller.list);
router.get('/:id', controller.getById);
router.post('/',   validateBody(createSchema), controller.create);
router.put('/:id',  validateBody(updateSchema), controller.update);
router.patch('/:id', validateBody(updateSchema), controller.update);
router.patch('/:id/reset-password', validateBody(resetPasswordSchema), controller.resetPassword);

module.exports = router;
