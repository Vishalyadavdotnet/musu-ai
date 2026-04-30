import { Router } from 'express';
import { handleChat, handleHealth } from '../controllers/chatController.js';

const router = Router();

// Chat endpoint
router.post('/chat', handleChat);

// Health check
router.get('/health', handleHealth);

export default router;
