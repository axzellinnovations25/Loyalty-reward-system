'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./settings.controller');
const { updateSchema, validateBody } = require('./settings.validator');

router.use(authenticate);

router.get('/',  controller.get);
router.put('/',  validateBody(updateSchema), controller.update);

module.exports = router;
