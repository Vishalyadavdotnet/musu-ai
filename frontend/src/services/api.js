/**
 * API service layer for communicating with Musu backend
 */

import { API_BASE_URL } from '../utils/constants';

/**
 * Send a chat message and get AI response
 * @param {string} message - User's message
 * @param {string|null} sessionId - Session ID for context
 * @returns {Promise<{success: boolean, response?: string, command?: object, commandResult?: object, sessionId?: string, error?: string}>}
 */
export async function sendChatMessage(message, sessionId = null) {
  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      return {
        success: false,
        error: 'Server se response nahi aaya. Dobara try karo.',
      };
    }

    if (!res.ok) {
      throw new Error(data.error || `Server error (${res.status})`);
    }

    return data;
  } catch (error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Server se connect nahi ho pa raha. Backend port 3001 pe chal raha hai?',
      };
    }
    return {
      success: false,
      error: error.message || 'Kuch gadbad ho gayi. Dobara try karo.',
    };
  }
}

/**
 * Check backend health
 * @returns {Promise<{status: string, ai: string}>}
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await res.json();
  } catch {
    return { status: 'error', ai: 'disconnected' };
  }
}
