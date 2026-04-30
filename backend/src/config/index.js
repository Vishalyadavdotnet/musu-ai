import dotenv from 'dotenv';
dotenv.config();

/**
 * Parse all GEMINI_API_KEY entries from env
 * Supports: GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.
 */
function loadApiKeys() {
  const keys = [];
  
  // Primary key
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  
  // Additional keys: GEMINI_API_KEY_2, GEMINI_API_KEY_3, ...
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  
  return keys;
}

const apiKeys = loadApiKeys();

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  geminiApiKeys: apiKeys,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  rateLimit: {
    windowMs: 60 * 1000,   // 1 minute
    maxRequests: 30,        // 30 requests per minute
  },
  session: {
    maxAge: 60 * 60 * 1000, // 1 hour
    cleanupInterval: 5 * 60 * 1000, // cleanup every 5 minutes
  },
};

// Validate required config
if (apiKeys.length === 0) {
  console.error('❌ GEMINI_API_KEY is required. Get one at https://aistudio.google.com/');
  console.error('   Copy .env.example to .env and add your key.');
  process.exit(1);
}

console.log(`🔑 Loaded ${apiKeys.length} API key(s) for auto-rotation`);

export default config;
