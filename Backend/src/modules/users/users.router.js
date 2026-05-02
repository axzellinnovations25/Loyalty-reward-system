'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./users.controller');
const { createSchema, updateSchema, resetPasswordSchema, validateBody } = require('./users.validator');

router.use(authenticate);

router.get('/', controller.list);
router.post('/', validateBody(createSchema), controller.create);
router.patch('/:id', validateBody(updateSchema), controller.update);
router.post('/:id/reset-password', validateBody(resetPasswordSchema), controller.resetPassword);
router.delete('/:id', controller.deactivate);

module.exports = router;

