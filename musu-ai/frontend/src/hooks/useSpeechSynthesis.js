import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for Text-to-Speech with sweet female voice preference
 * Prioritizes Google Hindi Female > Microsoft Swara > Google US Female voices
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const utteranceRef = useRef(null);
  const chunksRef = useRef([]);
  const chunkIndexRef = useRef(0);
  const isSupported = 'speechSynthesis' in window;

  // Voice preference order — sweet female voices first
  const PREFERRED_VOICES = [
    // Hindi female voices (best for Hinglish)
    'Google हिन्दी',
    'Microsoft Swara Online',
    'Microsoft Swara',
    // English female voices (sweet/natural sounding)
    'Google UK English Female',
    'Google US English Female', 
    'Microsoft Zira Online',
    'Microsoft Zira',
    'Samantha', // macOS
    'Karen',    // macOS Australian
    'Victoria', // macOS
    // Fallback — any female
    'Female',
    'female',
  ];

  // Load and select the best voice
  useEffect(() => {
    if (!isSupported) return;

    const selectBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      console.log('🔊 Available voices:', voices.map(v => `${v.name} (${v.lang})`).join(', '));

      // Try each preferred voice in order
      for (const pref of PREFERRED_VOICES) {
        const match = voices.find(v =>
          v.name.includes(pref) || v.name.toLowerCase().includes(pref.toLowerCase())
        );
        if (match) {
          setSelectedVoice(match);
          console.log(`🎙️ Selected voice: ${match.name} (${match.lang})`);
          return;
        }
      }

      // Fallback: look for any female voice
      const femaleVoice = voices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('swara') ||
        v.name.toLowerCase().includes('samantha')
      );

      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        console.log(`🎙️ Fallback female voice: ${femaleVoice.name}`);
        return;
      }

      // Last resort: any Hindi voice, then first available
      const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
      if (hindiVoice) {
        setSelectedVoice(hindiVoice);
        console.log(`🎙️ Hindi voice fallback: ${hindiVoice.name}`);
        return;
      }

      // Absolute fallback
      setSelectedVoice(voices[0]);
      console.log(`🎙️ Default voice: ${voices[0].name}`);
    };

    selectBestVoice();
    window.speechSynthesis.onvoiceschanged = selectBestVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  /**
   * Split text into chunks to avoid Chrome's ~15s cutoff bug
   */
  const splitIntoChunks = (text, maxLength = 180) => {
    const sentences = text.match(/[^.!?।]+[.!?।]?\s*/g) || [text];
    const chunks = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).length > maxLength && current.length > 0) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  };

  /**
   * Speak the next chunk in the queue
   */
  const speakNextChunk = useCallback(() => {
    if (chunkIndexRef.current >= chunksRef.current.length) {
      setIsSpeaking(false);
      return;
    }

    const text = chunksRef.current[chunkIndexRef.current];
    const utterance = new SpeechSynthesisUtterance(text);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Sweet female voice tuning
    utterance.rate = 0.95;   // Slightly slower for clarity
    utterance.pitch = 1.15;  // Slightly higher for sweetness
    utterance.volume = 1.0;

    utterance.onend = () => {
      chunkIndexRef.current++;
      speakNextChunk();
    };

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error('TTS error:', event.error);
      }
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice]);

  /**
   * Start speaking text
   */
  const speak = useCallback((text) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    chunksRef.current = splitIntoChunks(text);
    chunkIndexRef.current = 0;
    setIsSpeaking(true);

    // Small delay after cancel to avoid Chrome bug
    setTimeout(() => {
      speakNextChunk();
    }, 50);
  }, [isSupported, speakNextChunk]);

  /**
   * Stop speaking
   */
  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    setIsSpeaking(false);
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    selectedVoice: selectedVoice?.name || 'Default',
  };
}
