import { Router } from 'express';
import Joi from 'joi';
import validate from '../middlewares/validate.middleware.js';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import { getMoodConfig, patchMoodConfig } from '../controllers/moodConfig.controller.js';

const router = Router();

const patchSchema = Joi.object({
  moodType: Joi.string().valid('Positive', 'Stable', 'Pressure', 'Low').required(),
  emoji: Joi.string().trim().max(10).optional(),
  keyword: Joi.string().trim().max(50).allow('').optional(),
  keywords: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().max(50)).max(50),
    Joi.string().allow('')
  ).optional(),
});

router.get('/', verifyToken, getMoodConfig);
router.patch('/', verifyToken, checkRole(USER_ROLES.ADMIN), validate(patchSchema), patchMoodConfig);

export default router;
