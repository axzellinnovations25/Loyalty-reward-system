'use strict';

const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(100).required(),
});

const updateSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  username: Joi.string().min(3).max(50),
  isActive: Joi.boolean(),
}).min(1);

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).max(100).required(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map((d) => d.message) });
    req.body = value;
    next();
  };
}

module.exports = { createSchema, updateSchema, resetPasswordSchema, validateBody };

