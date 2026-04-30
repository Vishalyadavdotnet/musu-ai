import { useVoice } from '../../contexts/VoiceContext';
import './Header.css';

export default function Header() {
  const { clearChat, isAutoSpeak, toggleAutoSpeak } = useVoice();

  return (
    <header className="header" id="header">
      <div className="header__brand">
        <div className="header__logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="white" stroke="none" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" />
            <line x1="12" y1="19" x2="12" y2="22" stroke="white" />
          </svg>
        </div>
        <div>
          <h1 className="header__title">Musu</h1>
          <p className="header__subtitle">AI Voice Assistant</p>
        </div>
      </div>

      <div className="header__actions">
        <button
          className={`header__btn ${isAutoSpeak ? 'header__btn--active' : ''}`}
          onClick={toggleAutoSpeak}
          title={isAutoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
          id="toggle-autospeak"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isAutoSpeak ? (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </>
            ) : (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </>
            )}
          </svg>
          {isAutoSpeak ? 'Voice On' : 'Voice Off'}
        </button>

        <button
          className="header__btn"
          onClick={clearChat}
          title="Clear conversation"
          id="clear-chat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Clear
        </button>
      </div>
    </header>
  );
}
