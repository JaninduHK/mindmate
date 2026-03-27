import { Router } from 'express';
import Joi from 'joi';

import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import { addMood, getMoodHistory, updateMood, deleteMood, getAllMoods } from '../controllers/moodController.js';

const router = Router();

const moodValues = ['Positive', 'Stable', 'Pressure', 'Low'];

const descriptionSchema = Joi.string()
  .trim()
  .required()
  .pattern(/^[^0-9]*$/)
  .custom((value, helpers) => {
    const wordCount = value.split(/\s+/).filter(Boolean).length;
    if (wordCount > 20) return helpers.error('any.maxWords');
    return value;
  }, 'Description max 20 words')
  .messages({
    'string.pattern.base': 'Numbers are not allowed in this field',
    'any.maxWords': 'Description cannot exceed 20 words',
  });

const moodCreateSchema = Joi.object({
  mood: Joi.string().valid(...moodValues).required(),
  keyword: Joi.string().trim().min(1).max(50).required(),
  description: descriptionSchema,
  date: Joi.date().optional(),
});

const moodUpdateSchema = Joi.object({
  mood: Joi.string().valid(...moodValues).required(),
  keyword: Joi.string().trim().min(1).max(50).required(),
  description: descriptionSchema,
});

// POST add mood
router.post('/', verifyToken, validate(moodCreateSchema), addMood);

// GET mood history
router.get('/', verifyToken, getMoodHistory);
router.get('/all', verifyToken, checkRole(USER_ROLES.ADMIN), getAllMoods);

// PUT edit mood (by date)
router.put('/:date', verifyToken, validate(moodUpdateSchema), updateMood);

// DELETE mood (by date)
router.delete('/:date', verifyToken, deleteMood);

export default router;

