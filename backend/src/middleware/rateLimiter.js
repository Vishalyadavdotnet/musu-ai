import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

/**
 * Rate limiter for API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests. Please slow down and try again in a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
