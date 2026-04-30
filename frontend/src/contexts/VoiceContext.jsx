import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { sendChatMessage } from '../services/api';
import { generateId, randomFrom } from '../utils/helpers';
import { VOICE_STATUS, ROLES, GREETINGS } from '../utils/constants';

// --- State ---
const initialState = {
  messages: [],
  status: VOICE_STATUS.IDLE,
  sessionId: null,
  error: null,
  isAutoSpeak: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.payload.id ? { ...m, ...action.payload } : m
        ),
      };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'TOGGLE_AUTO_SPEAK':
      return { ...state, isAutoSpeak: !state.isAutoSpeak };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], sessionId: null };
    default:
      return state;
  }
}

/**
 * Execute frontend-side commands (open URLs, search, etc.)
 */
function executeFrontendCommand(command) {
  if (!command) return;

  switch (command.type) {
    case 'OPEN_URL': {
      const url = command.url;
      if (url) {
        console.log(`🌐 Opening URL: ${url}`);
        window.open(url, '_blank');
      }
      break;
    }
    case 'SEARCH_WEB': {
      const query = command.query;
      if (query) {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        console.log(`🔍 Searching: ${query}`);
        window.open(searchUrl, '_blank');
      }
      break;
    }
    // PLAY_MUSIC is handled by backend — arrives as OPEN_URL via overrideCommand
    // All other commands (OPEN_APP, CREATE_FOLDER, SHUTDOWN, VOLUME, etc.) 
    // are handled by the backend
    default:
      break;
  }
}

/**
 * Play notification sound using Web Audio API
 */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — pleasant chime
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch (e) {
    // Audio not available
  }
}

// --- Context ---
const VoiceContext = createContext(null);

export function VoiceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    messages: [
      {
        id: 'greeting',
        role: ROLES.ASSISTANT,
        text: randomFrom(GREETINGS),
        timestamp: Date.now(),
        status: 'sent',
      },
    ],
  });

  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();
  const isProcessingRef = useRef(false);

  // --- Send message to backend ---
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;

    // Add user message
    const userMsg = {
      id: generateId(),
      role: ROLES.USER,
      text: text.trim(),
      timestamp: Date.now(),
      status: 'sent',
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    dispatch({ type: 'SET_STATUS', payload: VOICE_STATUS.PROCESSING });
    dispatch({ type: 'SET_ERROR', payload: null });

    // Add placeholder for assistant
    const assistantMsgId = generateId();
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: assistantMsgId,
        role: ROLES.ASSISTANT,
        text: '',
        timestamp: Date.now(),
        status: 'sending',
      },
    });

    try {
      const result = await sendChatMessage(text.trim(), state.sessionId);

      if (result.success) {
        // Build display text
        let displayText = result.response;
        if (result.commandResult && result.commandResult.message && result.commandResult.success) {
          displayText += `\n✅ ${result.commandResult.message}`;
        }

        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: assistantMsgId,
            text: displayText,
            timestamp: Date.now(),
            status: 'sent',
          },
        });

        if (result.sessionId) {
          dispatch({ type: 'SET_SESSION_ID', payload: result.sessionId });
        }

        // Execute frontend commands
        if (result.command) {
          executeFrontendCommand(result.command);
          // Play notification sound for action commands
          playNotificationSound();
        }

        // Auto-speak response
        if (state.isAutoSpeak) {
          dispatch({ type: 'SET_STATUS', payload: VOICE_STATUS.SPEAKING });
          tts.speak(result.response);
        } else {
          dispatch({ type: 'SET_STATUS', payload: VOICE_STATUS.IDLE });
        }
      } else {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: assistantMsgId,
            text: result.error || 'Kuch gadbad ho gayi.',
            status: 'error',
          },
        });
        dispatch({ type: 'SET_STATUS', payload: VOICE_STATUS.ERROR });
        dispatch({ type: 'SET_ERROR', payload: result.error });
      }
    } catch (err) {
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: assistantMsgId,
          text: 'Server se connect nahi ho paya.',
          status: 'error',
        },
      });
      dispatch({ type: 'SET_STATUS', payload: VOICE_STATUS.ERROR });
    } finally {
      isProcessingRef.current = false;
    }
  }, [state.sessionId, state.isAutoSpeak, tts]);

  // --- Watch TTS state ---
  useEffect(() => {
    if (!tts.isSpeaking && state.status === VOICE_STATUS.SPEAKING) {
      dispatch({ type: 'SET_STATUS', payload: VOICE_STATUS.IDLE });
    }
  }, [tts.isSpeaking, state.status]);

  // --- Watch speech recognition errors ---
  useEffect(() => {
    if (speech.error) {
      dispatch({ type: 'SET_ERROR', payload: speech.error });
    }
  }, [speech.error]);

  // --- Toggle listening ---
  const toggleListening = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening();
      if (speech.transcript.trim()) {
        sendMessage(speech.transcript);
        speech.resetTranscript();
      }
      dispatch({ type: 'SET_STATUS', payload: VOICE_STATUS.IDLE });
    } else {
      tts.stop();
      speech.startListening();
      dispatch({ type: 'SET_STATUS', payload: VOICE_STATUS.LISTENING });
    }
  }, [speech, tts, sendMessage]);

  // --- Stop everything ---
  const stopAll = useCallback(() => {
    speech.stopListening();
    tts.stop();
    dispatch({ type: 'SET_STATUS', payload: VOICE_STATUS.IDLE });
  }, [speech, tts]);

  // --- Clear chat ---
  const clearChat = useCallback(() => {
    stopAll();
    dispatch({ type: 'CLEAR_MESSAGES' });
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: 'greeting-new',
        role: ROLES.ASSISTANT,
        text: randomFrom(GREETINGS),
        timestamp: Date.now(),
        status: 'sent',
      },
    });
  }, [stopAll]);

  const value = {
    messages: state.messages,
    status: state.status,
    error: state.error,
    isAutoSpeak: state.isAutoSpeak,
    isListening: speech.isListening,
    transcript: speech.transcript,
    interimTranscript: speech.interimTranscript,
    isSpeechSupported: speech.isSupported,
    isSpeaking: tts.isSpeaking,
    isTTSSupported: tts.isSupported,
    voiceName: tts.selectedVoice,
    sendMessage,
    toggleListening,
    stopAll,
    clearChat,
    toggleAutoSpeak: () => dispatch({ type: 'TOGGLE_AUTO_SPEAK' }),
    speak: tts.speak,
    stopSpeaking: tts.stop,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
