'use strict';

const router = require('express').Router();
const authenticate = require('../../../middleware/authenticate');
const requireAdmin = require('../../../middleware/requireAdmin');
const controller = require('./shops.controller');
const { updateSchema, validateBody } = require('./shops.validator');

router.use(authenticate, requireAdmin);

router.get('/',    controller.list);
router.get('/:id', controller.getById);
router.put('/:id', validateBody(updateSchema), controller.update);

module.exports = router;
