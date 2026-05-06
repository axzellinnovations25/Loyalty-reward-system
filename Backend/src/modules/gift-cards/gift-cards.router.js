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
router.get('/validate/:code', controller.validate);
router.get('/:id',    controller.getById);
router.post('/',      requireLimit(LIMITS.GIFT_CARDS, repository.countThisMonth), validateBody(createSchema), controller.create);
router.post('/redeem', validateBody(redeemSchema), controller.redeem);
router.delete('/:id', controller.remove);

module.exports = router;
