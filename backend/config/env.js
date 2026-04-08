export const config = {
  PORT: process.env.PORT || 3001,

  // 🔥 Flowise
  FLOWISE_URL: process.env.FLOWISE_URL,
  FLOWISE_CHATFLOW_ID: process.env.FLOWISE_CHATFLOW_ID,

  // 🔧 n8n
  N8N_WEBHOOK:
    process.env.N8N_WEBHOOK || "http://localhost:5678/webhook/voice",

  // 🌐 frontend
  FRONTEND_URL: process.env.FRONTEND_URL,

  // 🔊 TTS
  TTS_MODEL: process.env.TTS_MODEL || "gpt-4o-mini-tts",
  TTS_VOICE: process.env.TTS_VOICE || "alloy",

  // 🎤 STT
  STT_MODEL: process.env.STT_MODEL || "whisper-1",
  STT_LANGUAGE: process.env.STT_LANGUAGE || "pt",

  // 🌍 OpenAI
  OPENAI_BASE_URL:
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
};