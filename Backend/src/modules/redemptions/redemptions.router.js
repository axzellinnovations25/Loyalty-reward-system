'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./redemptions.controller');
const { createSchema, validateBody } = require('./redemptions.validator');

router.use(authenticate);

router.get('/',         controller.list);
router.get('/preview',  controller.preview);
router.get('/:id',      controller.getById);
router.post('/',        validateBody(createSchema), controller.create);
router.post('/:id/void', controller.voidRedemption);

module.exports = router;
