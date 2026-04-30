import corsLib from 'cors';
import config from '../config/index.js';

/**
 * CORS middleware configured for frontend origin
 */
export const corsMiddleware = corsLib({
  origin: config.frontendUrl,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
});
