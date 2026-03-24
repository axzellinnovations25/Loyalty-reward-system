'use strict';

const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional().allow(''),
  pointsCost: Joi.number().integer().positive().required(),
  isActive: Joi.boolean().default(true),
});

const updateSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().max(500).allow(''),
  pointsCost: Joi.number().integer().positive(),
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
