'use strict';

const Joi = require('joi');

const itemSchema = Joi.object({
  productId: Joi.string().uuid().optional().allow(null),
  name: Joi.string().min(1).max(150).required(),
  sku: Joi.string().max(64).optional().allow(null, ''),
  unitPrice: Joi.number().precision(2).min(0).required(),
  quantity: Joi.number().integer().min(1).required(),
});

const createSchema = Joi.object({
  customerId: Joi.string().required(),
  // Backwards compatible: POS can send either `amount` (legacy) or `items`.
  amount: Joi.number().positive().optional(),
  items: Joi.array().items(itemSchema).min(1).optional(),
  couponCode: Joi.string().max(50).optional().allow('', null).custom((v) => (v ? String(v).trim().toUpperCase() : null)),
  managerPassword: Joi.string().min(4).max(200).optional().allow('', null),
  reference: Joi.string().max(100).optional().allow(''),
  notes: Joi.string().max(500).optional().allow(''),
}).custom((value, helpers) => {
  if (!value.amount && (!value.items || value.items.length === 0)) {
    return helpers.error('any.custom', { message: 'Provide amount or items' });
  }
  return value;
}, 'amount/items requirement');

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { createSchema, validateBody };
