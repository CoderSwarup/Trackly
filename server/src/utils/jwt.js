import jwt from 'jsonwebtoken';
import logger from './logger.js';
import config from '../config/config.js';



export const generateToken = (payload) => {
  try {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: 'chatapp',
      audience: 'chatapp-users'
    });
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'chatapp',
      audience: 'chatapp-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Authentication token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid authentication token');
    }
    logger.error('Error verifying JWT token:', error);
    throw new Error('Token verification failed');
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding JWT token:', error);
    return null;
  }
};