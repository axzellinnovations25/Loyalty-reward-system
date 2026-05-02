'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./promotions.controller');
const { createSchema, updateSchema, previewSchema, validateBody } = require('./promotions.validator');

router.use(authenticate);

router.get('/', controller.list);
router.post('/', validateBody(createSchema), controller.create);
router.post('/preview', validateBody(previewSchema), controller.preview);
router.get('/:id', controller.getById);
router.put('/:id', validateBody(updateSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;

