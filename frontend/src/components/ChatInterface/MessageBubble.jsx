import { formatTime } from '../../utils/helpers';
import { useVoice } from '../../contexts/VoiceContext';
import { ROLES } from '../../utils/constants';

export default function MessageBubble({ message }) {
  const { speak } = useVoice();
  const isUser = message.role === ROLES.USER;
  const isError = message.status === 'error';

  return (
    <div
      className={`message message--${isUser ? 'user' : 'assistant'} ${isError ? 'message--error' : ''}`}
      id={`message-${message.id}`}
    >
      <div className="message__avatar">
        {isUser ? 'U' : 'M'}
      </div>
      <div className="message__content">
        {message.text}

        {/* Speak button for assistant messages */}
        {!isUser && message.status === 'sent' && message.text && (
          <button
            className="message__speak-btn"
            onClick={() => speak(message.text)}
            title="Read aloud"
            aria-label="Read message aloud"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        )}

        <span className="message__time">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}
