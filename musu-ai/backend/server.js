import app from './src/app.js';
import config from './src/config/index.js';

const server = app.listen(config.port, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║                                      ║');
  console.log('  ║     🎙️  MUSU AI Voice Assistant      ║');
  console.log('  ║         Backend Server                ║');
  console.log('  ║                                      ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  🚀 Server running on http://localhost:${config.port}`);
  console.log(`  🌐 Frontend URL: ${config.frontendUrl}`);
  console.log(`  🤖 AI Model: ${config.geminiModel}`);
  console.log(`  📊 Environment: ${config.nodeEnv}`);
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\\n🛑 Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down...');
  server.close(() => process.exit(0));
});
