import { Router } from 'express';
import Joi from 'joi';

import { verifyToken } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { addMood, getMoodHistory, updateMood, deleteMood } from '../controllers/moodController.js';

const router = Router();

const moodValues = ['Positive', 'Stable', 'Pressure', 'Low'];
const keywordValues = ['Busy', 'Calm', 'Tired', 'Worried'];

const descriptionSchema = Joi.string()
  .trim()
  .required()
  .custom((value, helpers) => {
    const wordCount = value.split(/\s+/).filter(Boolean).length;
    if (wordCount > 20) return helpers.error('any.maxWords');
    return value;
  }, 'Description max 20 words')
  .messages({ 'any.maxWords': 'Description cannot exceed 20 words' });

const moodCreateSchema = Joi.object({
  mood: Joi.string().valid(...moodValues).required(),
  keyword: Joi.string().valid(...keywordValues).required(),
  description: descriptionSchema,
  date: Joi.date().optional(),
});

const moodUpdateSchema = Joi.object({
  mood: Joi.string().valid(...moodValues).required(),
  keyword: Joi.string().valid(...keywordValues).required(),
  description: descriptionSchema,
});

// POST add mood
router.post('/', verifyToken, validate(moodCreateSchema), addMood);

// GET mood history
router.get('/', verifyToken, getMoodHistory);

// PUT edit mood (by date)
router.put('/:date', verifyToken, validate(moodUpdateSchema), updateMood);

// DELETE mood (by date)
router.delete('/:date', verifyToken, deleteMood);

export default router;

