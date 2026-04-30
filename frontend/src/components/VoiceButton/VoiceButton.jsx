import { useVoice } from '../../contexts/VoiceContext';
import { VOICE_STATUS } from '../../utils/constants';
import './VoiceButton.css';

export default function VoiceButton() {
  const {
    status,
    isListening,
    isSpeaking,
    isSpeechSupported,
    toggleListening,
    stopAll,
    stopSpeaking,
  } = useVoice();

  if (!isSpeechSupported) {
    return (
      <div className="voice-btn-container">
        <p className="voice-btn-unsupported">
          Voice input is not supported in this browser.<br />
          Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  const isProcessing = status === VOICE_STATUS.PROCESSING;
  const isSpeakingState = status === VOICE_STATUS.SPEAKING || isSpeaking;

  const getButtonClass = () => {
    if (isListening) return 'voice-btn--listening';
    if (isProcessing) return 'voice-btn--processing';
    if (isSpeakingState) return 'voice-btn--speaking';
    return 'voice-btn--idle';
  };

  const getWrapperClass = () => {
    if (isListening) return 'voice-btn-wrapper--listening';
    if (isSpeakingState) return 'voice-btn-wrapper--speaking';
    return '';
  };

  const getLabel = () => {
    if (isListening) return 'Tap to send';
    if (isProcessing) return 'Thinking...';
    if (isSpeakingState) return 'Speaking...';
    return 'Tap to speak';
  };

  const getLabelClass = () => {
    if (isListening) return 'voice-btn-label--listening';
    if (isSpeakingState) return 'voice-btn-label--speaking';
    return '';
  };

  const handleClick = () => {
    if (isSpeakingState) {
      stopSpeaking();
      return;
    }
    if (isProcessing) return;
    toggleListening();
  };

  return (
    <div className="voice-btn-container" id="voice-button-container">
      <div className={`voice-btn-wrapper ${getWrapperClass()}`}>
        <button
          className={`voice-btn ${getButtonClass()}`}
          onClick={handleClick}
          disabled={isProcessing}
          aria-label={getLabel()}
          id="voice-button"
        >
          {isListening ? (
            /* Stop / square icon */
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : isProcessing ? (
            /* Spinner */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : isSpeakingState ? (
            /* Speaker icon */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            /* Microphone icon */
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2Z" />
            </svg>
          )}
        </button>
      </div>
      <span className={`voice-btn-label ${getLabelClass()}`}>
        {getLabel()}
      </span>
    </div>
  );
}
