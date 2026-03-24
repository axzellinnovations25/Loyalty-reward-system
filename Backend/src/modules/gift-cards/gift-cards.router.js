'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const requireFeature = require('../../middleware/requireFeature');
const requireLimit = require('../../middleware/requireLimit');
const { FEATURES, LIMITS } = require('../../config/constants');
const repository = require('./gift-cards.repository');
const controller = require('./gift-cards.controller');
const { createSchema, redeemSchema, validateBody } = require('./gift-cards.validator');

router.use(authenticate, requireFeature(FEATURES.GIFT_CARDS));

router.get('/',       controller.list);
router.get('/:id',    controller.getById);
router.post('/',      requireLimit(LIMITS.GIFT_CARDS, repository.count), validateBody(createSchema), controller.create);
router.post('/redeem', validateBody(redeemSchema), controller.redeem);

module.exports = router;
