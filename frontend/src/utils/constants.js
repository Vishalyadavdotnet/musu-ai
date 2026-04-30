/**
 * Frontend constants for Musu
 */

export const API_BASE_URL = '/api';

export const VOICE_STATUS = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

export const ROLES = {
  USER: 'user',
  ASSISTANT: 'model',
};

export const ASSISTANT_NAME = 'Musu';

export const GREETINGS = [
  "Hey! Main Musu hoon — tumhari apni AI assistant! 💕 Bolo kya help chahiye?",
  "Namaste! Main hoon Musu. YouTube kholo, gaana bajao, WhatsApp message bhejo — sab karungi! 😊",
  "Hi! Main Musu hoon — volume control, screenshot, timer, system info — sab commands ready hain! Mic daba ke bolo!",
  "Welcome! Main Musu hoon. Hindi ya English — jo bhi bolo, samajh jaungi! Kya kar sakti hoon? 🎵",
];

export const PLACEHOLDER_TEXTS = [
  'Bolo ya type karo — sab samajhti hoon!',
  '"YouTube khol do" ya "volume badha do" try karo',
  '"Battery kitni hai" ya "screenshot le lo" bolo',
  '"5 minute ka timer laga do"',
  '"WhatsApp pe hello bhejo"',
  '"Ek joke sunao"',
];

export const MAX_MESSAGE_LENGTH = 5000;

/**
 * All supported command categories for help display
 */
export const COMMAND_CATEGORIES = {
  'Media & Web': [
    'YouTube khol do', 'Gaana bajao [artist]', 'Google pe search karo [query]',
    'Instagram kholo', 'Wikipedia kholo',
  ],
  'System Controls': [
    'Volume badha do / kam karo', 'Brightness badha do', 'Screenshot le lo',
    'Computer lock kar do', 'Sleep mode mein daal do',
  ],
  'Apps': [
    'Notepad kholo', 'Calculator kholo', 'VS Code kholo',
    'Chrome kholo', 'Paint kholo', 'Settings kholo',
  ],
  'WhatsApp & Email': [
    'WhatsApp pe [naam] ko [message] bhejo',
    'Contact save karo [naam] phone [number]',
    'Mere contacts dikhao',
    'Email bhejo [address]',
  ],
  'Files & Folders': [
    'D drive mein folder bana do', 'Desktop pe project folder create karo',
  ],
  'Timer & Reminder': [
    '5 minute ka timer laga do', '30 min baad yaad dila dena',
    'Mere reminders dikhao',
  ],
  'System Info': [
    'Battery kitni hai?', 'Time kya hai?', 'WiFi kaisa hai?',
    'System info batao', 'RAM kitni free hai?',
  ],
  'Fun & Knowledge': [
    'Ek joke sunao', 'Ek fun fact batao', 'Koi kahani sunao',
    'Translate karo...', 'Maths solve karo...',
  ],
};
