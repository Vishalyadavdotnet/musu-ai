import { VoiceProvider } from './contexts/VoiceContext';
import Header from './components/Header/Header';
import StatusBar from './components/StatusBar/StatusBar';
import ChatInterface from './components/ChatInterface/ChatInterface';
import VoiceVisualizer from './components/VoiceVisualizer/VoiceVisualizer';
import VoiceButton from './components/VoiceButton/VoiceButton';
import './App.css';

export default function App() {
  return (
    <VoiceProvider>
      {/* Ambient background */}
      <div className="app-background">
        <div className="app-background__grid" />
        <div className="app-background__orb app-background__orb--1" />
        <div className="app-background__orb app-background__orb--2" />
        <div className="app-background__orb app-background__orb--3" />
      </div>

      {/* Main app container */}
      <div className="app" id="app">
        <Header />
        <StatusBar />
        <ChatInterface />
        <VoiceVisualizer />
        <VoiceButton />
      </div>
    </VoiceProvider>
  );
}
