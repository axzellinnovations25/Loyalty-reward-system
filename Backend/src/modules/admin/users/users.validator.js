'use strict';

const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('admin', 'owner', 'staff').required(),
  shopId: Joi.string().optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  role: Joi.string().valid('admin', 'owner', 'staff'),
  isActive: Joi.boolean(),
}).min(1);

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { createSchema, updateSchema, validateBody };
