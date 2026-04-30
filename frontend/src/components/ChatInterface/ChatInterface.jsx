import { useState, useRef, useEffect } from 'react';
import { useVoice } from '../../contexts/VoiceContext';
import { VOICE_STATUS, PLACEHOLDER_TEXTS } from '../../utils/constants';
import { randomFrom } from '../../utils/helpers';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import './ChatInterface.css';

const QUICK_COMMANDS = [
  '🎵 Gaana bajao', '📸 Screenshot', '🔋 Battery', '📱 YouTube kholo',
  '⏰ 5 min timer', '😂 Joke sunao', '🔊 Volume badha do', '🕐 Time kya hai',
];

export default function ChatInterface() {
  const {
    messages,
    status,
    isListening,
    transcript,
    interimTranscript,
    sendMessage,
  } = useVoice();

  const [inputText, setInputText] = useState('');
  const [placeholder] = useState(() => randomFrom(PLACEHOLDER_TEXTS));
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Handle text input submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleQuickCommand = (cmd) => {
    // Remove emoji prefix
    const text = cmd.replace(/^[^\w\s]+\s*/, '').trim();
    sendMessage(text);
  };

  const isProcessing = status === VOICE_STATUS.PROCESSING;
  const hasTranscript = transcript || interimTranscript;
  const showQuickCommands = messages.length <= 2 && !isProcessing;

  return (
    <div className="chat" id="chat-interface">
      {/* Message list */}
      <div className="chat__messages" id="message-list">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Quick command chips — only show at start */}
        {showQuickCommands && (
          <div className="chat__quick-cmds" id="quick-commands">
            <p className="chat__quick-label">Try saying:</p>
            <div className="chat__quick-grid">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  className="chat__quick-chip"
                  onClick={() => handleQuickCommand(cmd)}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing indicator when processing */}
        {isProcessing && messages[messages.length - 1]?.status === 'sending' && (
          <TypingIndicator />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Live transcript preview when listening */}
      {isListening && hasTranscript && (
        <div className="chat__transcript" id="transcript-preview">
          <svg className="chat__transcript-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2h-2v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2Z" />
          </svg>
          <p className="chat__transcript-text">
            {transcript}
            {interimTranscript && <span> {interimTranscript}</span>}
          </p>
        </div>
      )}

      {/* Text input bar */}
      <form className="chat__input-bar" onSubmit={handleSubmit} id="input-bar">
        <input
          ref={inputRef}
          type="text"
          className="chat__input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isProcessing}
          maxLength={5000}
          autoComplete="off"
          id="message-input"
        />
        <button
          type="submit"
          className="chat__send-btn"
          disabled={!inputText.trim() || isProcessing}
          title="Send message"
          id="send-button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </form>
    </div>
  );
}
