import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../config/constants.js';

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, errorMessage);
    }

    next();
  };
};

export default validate;
