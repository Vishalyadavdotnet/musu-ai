import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';

/**
 * In-memory session store for conversation history.
 * In production, replace with Redis or a database.
 * @type {Map<string, {id: string, history: Array, createdAt: number, lastActivity: number}>}
 */
const sessions = new Map();

/**
 * Get or create a session
 * @param {string} [sessionId] - Existing session ID, or null for new session
 * @returns {{id: string, history: Array, createdAt: number, lastActivity: number}}
 */
export function getOrCreateSession(sessionId) {
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    session.lastActivity = Date.now();
    return session;
  }

  // Create new session
  const newSession = {
    id: uuidv4(),
    history: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  sessions.set(newSession.id, newSession);
  console.log(`📝 New session created: ${newSession.id}`);
  return newSession;
}

/**
 * Add a message pair to session history
 * @param {string} sessionId
 * @param {string} userMessage
 * @param {string} assistantMessage
 */
export function addToHistory(sessionId, userMessage, assistantMessage) {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.history.push(
    { role: 'user', parts: [{ text: userMessage }] },
    { role: 'model', parts: [{ text: assistantMessage }] }
  );

  // Keep history manageable — last 20 exchanges (40 messages)
  if (session.history.length > 40) {
    session.history = session.history.slice(-40);
  }

  session.lastActivity = Date.now();
}

/**
 * Get session history
 * @param {string} sessionId
 * @returns {Array}
 */
export function getHistory(sessionId) {
  const session = sessions.get(sessionId);
  return session ? session.history : [];
}

/**
 * Clear expired sessions
 */
export function cleanupSessions() {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, session] of sessions) {
    if (now - session.lastActivity > config.session.maxAge) {
      sessions.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired sessions. Active: ${sessions.size}`);
  }
}

/**
 * Get active session count
 * @returns {number}
 */
export function getActiveSessionCount() {
  return sessions.size;
}

// Auto-cleanup expired sessions
setInterval(cleanupSessions, config.session.cleanupInterval);
