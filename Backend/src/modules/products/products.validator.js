'use strict';

const Joi = require('joi');

const categoryCreateSchema = Joi.object({
  name: Joi.string().min(1).max(80).required(),
  description: Joi.string().max(500).optional().allow(''),
});

const categoryUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(80),
  description: Joi.string().max(500).allow(''),
}).min(1);

const productCreateSchema = Joi.object({
  categoryId: Joi.string().uuid().optional().allow(null),
  name: Joi.string().min(1).max(150).required(),
  sku: Joi.string().min(1).max(64).required(),
  barcode: Joi.string().max(64).optional().allow(null, ''),
  description: Joi.string().max(1000).optional().allow(''),
  unit: Joi.string().max(24).optional().allow(''),
  price: Joi.number().precision(2).min(0).required(),
  cost: Joi.number().precision(2).min(0).optional().allow(null),
  taxRate: Joi.number().precision(2).min(0).max(100).optional().allow(null),
  trackInventory: Joi.boolean().default(true),
  stockOnHand: Joi.number().integer().min(0).default(0),
  reorderLevel: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
});

const productUpdateSchema = Joi.object({
  categoryId: Joi.string().uuid().optional().allow(null),
  name: Joi.string().min(1).max(150),
  sku: Joi.string().min(1).max(64),
  barcode: Joi.string().max(64).allow(null, ''),
  description: Joi.string().max(1000).allow(''),
  unit: Joi.string().max(24).allow(''),
  price: Joi.number().precision(2).min(0),
  cost: Joi.number().precision(2).min(0).allow(null),
  taxRate: Joi.number().precision(2).min(0).max(100).allow(null),
  trackInventory: Joi.boolean(),
  stockOnHand: Joi.number().integer().min(0),
  reorderLevel: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
}).min(1);

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map((d) => d.message) });
    req.body = value;
    next();
  };
}

module.exports = {
  categoryCreateSchema,
  categoryUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  validateBody,
};

