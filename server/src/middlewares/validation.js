import httpError from '../utils/httpError.js';
import responseMessage from '../constant/responseMessage.js';

export const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        throw new Error(`Validation Error: ${errorMessages.join(', ')}`);
      }

      // Don't try to reassign read-only properties like req.query
      if (property !== 'query') {
        req[property] = value;
      } else {
        // For query params, just store validated values in a separate property
        req.validatedQuery = value;
      }
      next();
    } catch (err) {
      httpError(next, err, req, 400);
    }
  };
};

export const validateSocketData = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    throw new Error(`Validation Error: ${errorMessages.join(', ')}`);
  }

  return value;
};

export default {
  validateRequest,
  validateSocketData
};