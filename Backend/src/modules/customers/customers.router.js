'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const requireLimit = require('../../middleware/requireLimit');
const { LIMITS } = require('../../config/constants');
const repository = require('./customers.repository');
const controller = require('./customers.controller');
const { createSchema, updateSchema, validateBody } = require('./customers.validator');

const checkCustomerLimit = requireLimit(LIMITS.CUSTOMERS, repository.count);

router.use(authenticate);

router.get('/',    controller.list);
router.get('/:id', controller.getById);
router.post('/',   checkCustomerLimit, validateBody(createSchema), controller.create);
router.put('/:id', validateBody(updateSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
