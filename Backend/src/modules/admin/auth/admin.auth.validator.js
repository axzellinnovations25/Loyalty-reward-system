'use strict';

const Joi = require('joi');

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }
    next();
  };
}

module.exports = { loginSchema, validateBody };
