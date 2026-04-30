import { generateChatResponse, getKeyStatus } from '../services/aiService.js';
import { parseCommand, executeCommand } from '../services/commandService.js';
import {
  getOrCreateSession,
  addToHistory,
  getHistory,
  getActiveSessionCount,
} from '../services/sessionService.js';
import { healthCheck } from '../services/aiService.js';

/**
 * POST /api/chat
 * Handle a chat message, detect commands, and return AI response
 */
export async function handleChat(req, res, next) {
  try {
    const { message, sessionId } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string.',
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 5000 characters.',
      });
    }

    // Get or create session
    const session = getOrCreateSession(sessionId);
    const history = getHistory(session.id);

    console.log(`💬 [${session.id.slice(0, 8)}] User: ${message.slice(0, 100)}`);

    // Generate AI response (with auto key rotation)
    const rawResponse = await generateChatResponse(message.trim(), history);

    // Parse for commands
    const { command, spokenText } = parseCommand(rawResponse);

    // Execute server-side commands if detected
    let commandResult = null;
    let finalCommand = command; // command to send to frontend
    if (command) {
      console.log(`🎯 Command detected: ${command.type}`);
      commandResult = await executeCommand(command);

      // WhatsApp: if contact found, override command with OPEN_URL to wa.me link
      if (commandResult && commandResult.overrideCommand) {
        finalCommand = commandResult.overrideCommand;
      }
    }

    // Build final spoken text — append command result info if needed
    let finalSpokenText = spokenText;
    if (commandResult && !commandResult.success && commandResult.message) {
      finalSpokenText = commandResult.message; // Show error from command service
    }

    // Save to history
    addToHistory(session.id, message.trim(), finalSpokenText);

    console.log(`🤖 [${session.id.slice(0, 8)}] Musu: ${finalSpokenText.slice(0, 100)}`);

    res.json({
      success: true,
      response: finalSpokenText,
      command: finalCommand || null,
      commandResult: commandResult || null,
      sessionId: session.id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/health
 * Health check endpoint
 */
export async function handleHealth(req, res) {
  const aiStatus = await healthCheck();
  const keyStatus = getKeyStatus();

  res.json({
    status: 'ok',
    service: 'musu-backend',
    ai: aiStatus ? 'connected' : 'disconnected',
    keys: keyStatus,
    activeSessions: getActiveSessionCount(),
    timestamp: new Date().toISOString(),
  });
}
