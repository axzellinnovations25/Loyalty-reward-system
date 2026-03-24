'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./rewards.controller');
const { createSchema, updateSchema, validateBody } = require('./rewards.validator');

router.use(authenticate);

router.get('/',    controller.list);
router.get('/:id', controller.getById);
router.post('/',   validateBody(createSchema), controller.create);
router.put('/:id', validateBody(updateSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
