import { Router } from 'express';
import Joi from 'joi';

import { verifyToken } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { addGoal, getGoals, updateGoalStatus, deleteGoal, updateGoalDetails } from '../controllers/goalController.js';

const router = Router();

const goalTypeValues = ['daily', 'weekly', 'custom'];
const statusValues = ['complete', 'incomplete'];

const goalCreateSchema = Joi.object({
  goalName: Joi.string()
    .trim()
    .required()
    .pattern(/^[^0-9]*$/)
    .messages({ 'string.pattern.base': 'Numbers are not allowed in this field' }),
  goalType: Joi.string().valid(...goalTypeValues).required(),
  frequencyPerWeek: Joi.number().integer().min(1).max(7).optional(),
  status: Joi.string().valid(...statusValues).optional(),
  date: Joi.date().optional(),
});

const goalStatusUpdateSchema = Joi.object({
  status: Joi.string().valid(...statusValues).required(),
});

const goalDetailsUpdateSchema = Joi.object({
  goalName: Joi.string()
    .trim()
    .required()
    .pattern(/^[^0-9]*$/)
    .messages({ 'string.pattern.base': 'Numbers are not allowed in this field' }),
  goalType: Joi.string().valid(...goalTypeValues).required(),
  frequencyPerWeek: Joi.number().integer().min(1).max(7).optional(),
});

// POST add goal
router.post('/', verifyToken, validate(goalCreateSchema), addGoal);

// GET goals
router.get('/', verifyToken, getGoals);

// PATCH update goal status
router.patch('/:id', verifyToken, validate(goalStatusUpdateSchema), updateGoalStatus);

// PUT update goal details (name/type)
router.put('/:id', verifyToken, validate(goalDetailsUpdateSchema), updateGoalDetails);

// DELETE goal
router.delete('/:id', verifyToken, deleteGoal);

export default router;

