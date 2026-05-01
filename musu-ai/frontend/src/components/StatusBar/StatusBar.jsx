import { useState, useEffect } from 'react';
import { useVoice } from '../../contexts/VoiceContext';
import { checkHealth } from '../../services/api';
import './StatusBar.css';

export default function StatusBar() {
  const { error } = useVoice();
  const [healthStatus, setHealthStatus] = useState('checking');

  useEffect(() => {
    const check = async () => {
      const result = await checkHealth();
      setHealthStatus(result.status === 'ok' ? 'connected' : 'disconnected');
    };

    check();
    const interval = setInterval(check, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="status-bar" id="status-bar">
        <div className={`status-bar__dot status-bar__dot--${healthStatus}`} />
        <span>
          {healthStatus === 'connected'
            ? 'Connected to Musu'
            : healthStatus === 'disconnected'
            ? 'Server disconnected'
            : 'Connecting...'}
        </span>
      </div>
      {error && (
        <div className="status-bar__error" id="error-banner">
          {error}
        </div>
      )}
    </>
  );
}
