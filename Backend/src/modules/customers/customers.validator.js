'use strict';

const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  phone: Joi.string().required(),
  email: Joi.string().email().optional().allow(''),
  birthday: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional().allow(''),
});

const updateSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  phone: Joi.string(),
  email: Joi.string().email().allow(''),
  birthday: Joi.date().iso(),
  notes: Joi.string().max(500).allow(''),
}).min(1);

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { createSchema, updateSchema, validateBody };
