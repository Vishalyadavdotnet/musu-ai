/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique message ID
 * @property {'user' | 'model'} role - Message sender role
 * @property {string} text - Message content
 * @property {number} timestamp - Unix timestamp
 * @property {'sending' | 'sent' | 'error'} status - Message delivery status
 */

/**
 * @typedef {Object} ChatRequest
 * @property {string} message - User's message text
 * @property {string} sessionId - Session identifier for conversation history
 */

/**
 * @typedef {Object} ChatResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} [response] - AI response text
 * @property {string} [error] - Error message if failed
 * @property {string} sessionId - Session identifier
 */

/**
 * @typedef {Object} Session
 * @property {string} id - Session ID
 * @property {Array<{role: string, parts: Array<{text: string}>}>} history - Conversation history
 * @property {number} createdAt - Creation timestamp
 * @property {number} lastActivity - Last activity timestamp
 */

export {};
