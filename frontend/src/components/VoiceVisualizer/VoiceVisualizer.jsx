import { useEffect } from 'react';
import { useVoice } from '../../contexts/VoiceContext';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';
import './VoiceVisualizer.css';

export default function VoiceVisualizer() {
  const { isListening } = useVoice();
  const { canvasRef, isActive, start, stop } = useAudioVisualizer();

  useEffect(() => {
    if (isListening) {
      start();
    } else {
      stop();
    }
  }, [isListening, start, stop]);

  return (
    <div
      className={`visualizer ${isListening ? 'visualizer--active' : 'visualizer--hidden'}`}
      id="voice-visualizer"
    >
      <canvas ref={canvasRef} className="visualizer__canvas" />
    </div>
  );
}
