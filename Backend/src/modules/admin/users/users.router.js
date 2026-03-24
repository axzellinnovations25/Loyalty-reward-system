'use strict';

const router = require('express').Router();
const authenticate = require('../../../middleware/authenticate');
const requireAdmin = require('../../../middleware/requireAdmin');
const controller = require('./users.controller');
const { createSchema, updateSchema, validateBody } = require('./users.validator');

router.use(authenticate, requireAdmin);

router.get('/',    controller.list);
router.get('/:id', controller.getById);
router.post('/',   validateBody(createSchema), controller.create);
router.put('/:id', validateBody(updateSchema), controller.update);

module.exports = router;
