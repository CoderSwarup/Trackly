import Joi from 'joi';

export const userLoginSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 100 characters',
      'any.required': 'Password is required'
    })
});

export const sendMessageSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Message content cannot be empty',
      'string.max': 'Message content must not exceed 1000 characters',
      'any.required': 'Message content is required'
    }),
  type: Joi.string()
    .valid('text')
    .default('text')
});

export const locationSchema = Joi.object({
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required'
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required'
    }),
  accuracy: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Accuracy must be a positive number'
    })
});

export const shareLocationSchema = Joi.object({
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required(),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required(),
  accuracy: Joi.number()
    .min(0)
    .optional()
});

export const liveLocationUpdateSchema = Joi.object({
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required(),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required(),
  accuracy: Joi.number()
    .min(0)
    .optional()
});

export const queryParamsSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),
  hours: Joi.number()
    .integer()
    .min(1)
    .max(168) // 7 days
    .default(24)
    .messages({
      'number.integer': 'Hours must be an integer',
      'number.min': 'Hours must be at least 1',
      'number.max': 'Hours must not exceed 168 (7 days)'
    })
});

export const socketAuthSchema = Joi.alternatives().try(
  // Token-based authentication
  Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Authentication token is required'
      })
  }),
  // Legacy password-based authentication
  userLoginSchema
);

export default {
  userLoginSchema,
  socketAuthSchema,
  sendMessageSchema,
  locationSchema,
  shareLocationSchema,
  liveLocationUpdateSchema,
  queryParamsSchema
};