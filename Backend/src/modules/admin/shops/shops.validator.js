'use strict';

const Joi = require('joi');

const PLAN_IDS = ['basic', 'standard', 'pro', 'enterprise'];

const createSchema = Joi.object({
  name:          Joi.string().min(2).max(100).required(),
  email:         Joi.string().email().required(),
  phone:         Joi.string().max(200).allow('').optional(),
  planId:        Joi.string().valid(...PLAN_IDS).required(),
  ownerName:     Joi.string().min(2).max(100).required(),
  ownerUsername: Joi.string().min(3).max(50).required(),
  ownerPassword: Joi.string().min(8).required(),
});

const updateSchema = Joi.object({
  name:        Joi.string().min(2).max(100),
  email:       Joi.string().email(),
  phone:       Joi.string().max(200).allow(''),
  isActive:    Joi.boolean(),
  notes:       Joi.string().max(500).allow(''),
}).min(1);

const assignPlanSchema = Joi.object({
  planId: Joi.string().valid(...PLAN_IDS).required(),
  note:   Joi.string().max(500).allow('').optional(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { createSchema, updateSchema, assignPlanSchema, validateBody };
