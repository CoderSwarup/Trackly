import client from '../config/redisClient.js';
import httpError from '../utils/httpError.js';
import logger from '../utils/logger.js';

const RATE_LIMIT_PREFIX = 'rate_limit:';

export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req, res, next) => {
    try {
      const key = `${RATE_LIMIT_PREFIX}${req.ip}`;
      const current = await client.get(key);

      if (current === null) {
        // First request from this IP
        await client.setEx(key, Math.ceil(windowMs / 1000), '1');
        req.rateLimit = {
          limit: max,
          current: 1,
          remaining: max - 1,
          resetTime: new Date(Date.now() + windowMs)
        };
      } else {
        const currentCount = parseInt(current);

        if (currentCount >= max) {
          // Rate limit exceeded
          logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
          throw new Error(message);
        }

        // Increment counter
        await client.incr(key);
        req.rateLimit = {
          limit: max,
          current: currentCount + 1,
          remaining: max - (currentCount + 1),
          resetTime: new Date(Date.now() + (await client.ttl(key)) * 1000)
        };
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': req.rateLimit.remaining,
        'X-RateLimit-Reset': req.rateLimit.resetTime.toISOString()
      });

      next();
    } catch (error) {
      httpError(next, error, req, 429);
    }
  };
};

// Pre-configured rate limiters
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later'
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 10 authentication attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later'
});

export const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: 'Too many messages, please slow down'
});

export default {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  chatLimiter
};