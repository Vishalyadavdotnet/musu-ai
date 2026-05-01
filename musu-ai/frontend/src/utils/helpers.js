/**
 * Helper utilities for Musu
 */

/**
 * Generate a simple unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/**
 * Format a timestamp for display
 * @param {number} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get a random element from an array
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Delay utility
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if Web Speech API is supported
 * @returns {boolean}
 */
export function isSpeechRecognitionSupported() {
  return !!(
    window.SpeechRecognition ||
    window.webkitSpeechRecognition
  );
}

/**
 * Check if Speech Synthesis is supported
 * @returns {boolean}
 */
export function isSpeechSynthesisSupported() {
  return 'speechSynthesis' in window;
}

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
