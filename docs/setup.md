# ARGUS AI Voice Assistant — Setup Guide

Este documento descreve todos os passos necessários para configurar e executar o ARGUS AI Voice Assistant em ambiente local (Manjaro/Linux).

---

# 🧠 🖥️ BASE DO SISTEMA

## Node.js + npm
sudo pacman -S nodejs npm

## Git
sudo pacman -S git

---

# 🌐 BACKEND (Node API)

npm install express multer cors node-fetch dotenv

---

# 🎤 VOICE (STT + TTS)

Adicionar no .env:
OPENAI_API_KEY=sk-xxxx

---

# 🤖 FLOWISE

npm install -g flowise
flowise start

http://localhost:3000

---

# 🔧 N8N

npm install -g n8n
n8n

http://localhost:5678

---

# 🌍 NGROK

sudo pacman -S ngrok
ngrok http 5678

---

# 🎧 FRONTEND

python -m http.server 8000

---

# 🧠 CONFIG (.env)

PORT=3001
FRONTEND_URL=http://192.168.1.70:8000

OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1

FLOWISE_URL=http://localhost:3000
FLOWISE_CHATFLOW_ID=...

N8N_WEBHOOK=http://localhost:5678/webhook/agent

TTS_MODEL=gpt-4o-mini-tts
TTS_VOICE=alloy

STT_MODEL=whisper-1
STT_LANGUAGE=pt

---

# 📡 REDE

Backend: 0.0.0.0  
IP local: 192.168.x.x  
CORS ativo  

---

# 🚀 EXECUÇÃO

N8N_HOST=0.0.0.0 N8N_SECURE_COOKIE=false N8N_CORS_ALLOW_ORIGIN=http://192.168.1.70:8000 n8n start
flowise start
node server.js
ngrok http 5678
python -m http.server 8000

---

# 🧠 ARQUITETURA

ESP32 / Frontend → Node API → STT → Flowise → n8n → Flowise → TTS → Speaker

---

# 💥 RESUMO

sudo pacman -S nodejs npm git ngrok
npm install -g flowise n8n
npm install express multer cors node-fetch dotenv

---

# 🚀 ESTADO

AI Voice Agent completo  
Flowise + n8n integrado  
STT + TTS funcional  
Pronto para ESP32
