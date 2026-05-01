import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();

// --- Middleware ---
app.use(corsMiddleware);
app.use(express.json({ limit: '10kb' }));
app.use('/api', apiLimiter);

// --- Routes ---
app.use('/api', chatRoutes);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --- Error handler ---
app.use(errorHandler);

export default app;
