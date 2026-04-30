import { GoogleGenAI } from '@google/genai';
import config from '../config/index.js';
import { SYSTEM_PROMPT } from '../../../shared/constants.js';

/**
 * API Key Rotation Manager
 * Automatically switches to next key when rate limit is hit
 */
class KeyManager {
  constructor(keys) {
    this.keys = keys;
    this.currentIndex = 0;
    this.clients = keys.map(key => new GoogleGenAI({ apiKey: key }));
    this.failedKeys = new Set(); // temporarily failed keys
    this.cooldowns = new Map(); // key index -> cooldown expiry timestamp
  }

  /** Get current active client */
  getClient() {
    // Check if current key is on cooldown
    if (this.cooldowns.has(this.currentIndex)) {
      const expiry = this.cooldowns.get(this.currentIndex);
      if (Date.now() > expiry) {
        this.cooldowns.delete(this.currentIndex);
        this.failedKeys.delete(this.currentIndex);
      }
    }

    // If current key is failed, try to find a working one
    if (this.failedKeys.has(this.currentIndex)) {
      const nextGood = this._findNextGoodKey();
      if (nextGood !== -1) {
        this.currentIndex = nextGood;
        console.log(`🔄 Switched to API key #${this.currentIndex + 1}`);
      } else {
        // All keys exhausted — reset and try anyway
        console.log('⚠️ All API keys on cooldown, retrying with key #1...');
        this.failedKeys.clear();
        this.currentIndex = 0;
      }
    }

    return this.clients[this.currentIndex];
  }

  /** Mark current key as rate-limited and switch to next */
  markRateLimited() {
    const idx = this.currentIndex;
    this.failedKeys.add(idx);
    // Cooldown for 60 seconds
    this.cooldowns.set(idx, Date.now() + 60_000);
    
    console.log(`⛔ API key #${idx + 1} rate limited. Cooldown 60s.`);

    const nextGood = this._findNextGoodKey();
    if (nextGood !== -1) {
      this.currentIndex = nextGood;
      console.log(`🔄 Auto-switched to API key #${this.currentIndex + 1}`);
      return true; // retry is possible
    }
    
    return false; // no keys available
  }

  _findNextGoodKey() {
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + 1 + i) % this.keys.length;
      if (!this.failedKeys.has(idx)) return idx;
    }
    return -1;
  }

  getStatus() {
    return {
      totalKeys: this.keys.length,
      activeKey: this.currentIndex + 1,
      failedKeys: this.failedKeys.size,
    };
  }
}

const keyManager = new KeyManager(config.geminiApiKeys);

/**
 * Check if an error is a rate limit error
 */
function isRateLimitError(error) {
  const msg = error.message || '';
  return (
    msg.includes('429') ||
    msg.includes('RATE_LIMIT') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Too Many Requests') ||
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand')
  );
}

/**
 * Check if an error is an invalid API key error
 */
function isInvalidKeyError(error) {
  const msg = error.message || '';
  return (
    msg.includes('API_KEY_INVALID') ||
    msg.includes('API key not valid') ||
    msg.includes('INVALID_ARGUMENT') ||
    msg.includes('API_KEY')
  );
}

/**
 * Generate a chat response with auto key rotation
 * @param {string} userMessage
 * @param {Array} history
 * @returns {Promise<string>}
 */
export async function generateChatResponse(userMessage, history = []) {
  const maxRetries = config.geminiApiKeys.length;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const ai = keyManager.getClient();

      const chat = ai.chats.create({
        model: config.geminiModel,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        history: history,
      });

      const result = await chat.sendMessage({
        message: userMessage,
      });

      const responseText = result.text;

      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }

      return responseText;
    } catch (error) {
      console.error(`❌ Gemini API Error (key #${keyManager.currentIndex + 1}):`, error.message);

      // If rate limited OR invalid key, try to switch key and retry
      if (isRateLimitError(error) || isInvalidKeyError(error)) {
        const canRetry = keyManager.markRateLimited();
        if (canRetry && attempt < maxRetries) {
          console.log(`🔁 Retrying with key #${keyManager.currentIndex + 1}...`);
          continue; // retry with next key
        }
        if (isRateLimitError(error)) {
          throw new Error('Abhi sab API keys busy hain. Thoda wait karo, 1 minute mein try karo.');
        }
        throw new Error('Sab API keys invalid hain. .env file check karo.');
      }
      if (error.message?.includes('SAFETY')) {
        throw new Error('Ye response safety filter ne rok diya. Thoda alag tarike se poocho.');
      }

      throw new Error('Kuch gadbad ho gayi. Please dobara try karo.');
    }
  }

  throw new Error('Abhi sab API keys busy hain. 1 minute baad try karo.');
}

/**
 * Health check with key status
 */
export async function healthCheck() {
  try {
    const ai = keyManager.getClient();
    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: 'Say "OK" and nothing else.',
    });
    return !!response.text;
  } catch {
    return false;
  }
}

/**
 * Get key rotation status
 */
export function getKeyStatus() {
  return keyManager.getStatus();
}
