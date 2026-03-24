'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./purchases.controller');
const { createSchema, validateBody } = require('./purchases.validator');

router.use(authenticate);

router.get('/',    controller.list);
router.get('/:id', controller.getById);
router.post('/',   validateBody(createSchema), controller.create);

module.exports = router;
