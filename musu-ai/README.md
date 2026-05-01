# 🎙️ Musu — AI Voice Assistant

A full-stack, voice-first AI assistant built with React, Node.js, and Google Gemini.

Speak naturally, get intelligent responses, and hear them read aloud — all in a premium dark-themed interface.

---

## ✨ Features

- **🎤 Voice Input** — Tap-to-talk with real-time transcription (Web Speech API)
- **🤖 AI Responses** — Powered by Google Gemini 2.5 Flash
- **🔊 Voice Output** — Automatic text-to-speech for responses
- **💬 Chat Interface** — Beautiful message bubbles with conversation history
- **📊 Audio Visualizer** — Real-time frequency visualization while speaking
- **⌨️ Text Fallback** — Type messages when voice isn't available
- **🔗 Session Memory** — Multi-turn context within a conversation

---

## 🏗️ Architecture

```
User speaks → Web Speech API (STT) → Transcript
    → POST /api/chat → Express Backend
    → Gemini 2.5 Flash (with conversation history)
    → JSON Response → Chat UI
    → Web Speech Synthesis (TTS) → Audio Output
```

---

## 📁 Project Structure

```
musu/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── ChatInterface/ # Message list + input
│   │   │   ├── Header/        # App branding + controls
│   │   │   ├── StatusBar/     # Connection status
│   │   │   ├── VoiceButton/   # Main mic button
│   │   │   └── VoiceVisualizer/ # Audio waveform
│   │   ├── contexts/          # React Context (state)
│   │   ├── hooks/             # Custom hooks (STT, TTS, visualizer)
│   │   ├── services/          # API communication
│   │   └── utils/             # Constants + helpers
│   └── vite.config.js
│
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── services/          # AI + session logic
│   │   ├── middleware/        # CORS, rate limit, errors
│   │   └── config/            # Environment config
│   └── server.js
│
└── shared/                    # Shared constants + types
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **Chrome** or **Edge** browser (required for Web Speech API)
- **Gemini API Key** — get one free at [aistudio.google.com](https://aistudio.google.com/)

### Setup

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Install frontend dependencies
cd ../frontend
npm install
```

### Run

```bash
# Terminal 1 — Start backend
cd backend
npm run dev

# Terminal 2 — Start frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in Chrome.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|:---------|:---------|:--------|:------------|
| `GEMINI_API_KEY` | ✅ | — | Google AI Studio API key |
| `PORT` | ❌ | `3001` | Backend server port |
| `FRONTEND_URL` | ❌ | `http://localhost:5173` | Frontend URL for CORS |
| `GEMINI_MODEL` | ❌ | `gemini-2.5-flash` | Gemini model to use |
| `NODE_ENV` | ❌ | `development` | Environment |

---

## 🎨 Design

- **Dark theme** with pure black background
- **Glassmorphism** cards with backdrop blur
- **Ambient glow** orbs with floating animations
- **Subtle grid** pattern background
- **Inter** + **Plus Jakarta Sans** typography
- **Violet-to-teal** accent gradient

---

## 🗺️ Roadmap

- [ ] App control commands ("open YouTube")
- [ ] Long-term memory across sessions
- [ ] Custom voice commands
- [ ] Multi-language support
- [ ] Cloud TTS (ElevenLabs) integration
- [ ] Streaming responses for real-time display

---

## 📄 License

MIT
