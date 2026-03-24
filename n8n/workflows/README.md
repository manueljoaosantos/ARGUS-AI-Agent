# ARGUS n8n Workflows

## v1 (legacy)
- argus-voice-full-pipeline.json
- versão inicial
- sem fallback robusto

# ARGUS Voice Pipeline (v2)

## 🚀 Descrição

A versão v2 do pipeline de voz do ARGUS introduz uma arquitetura robusta com suporte a:

* 🎤 Entrada de áudio (microfone)
* ⌨️ Fallback para texto
* 🧠 Memória (PostgreSQL)
* 🤖 Resposta via LLM (GPT)
* 🔊 Síntese de voz (TTS)
* 🔁 Resposta estruturada (reply, audio, userText)

---

## 🧩 Workflow

```
Webhook → IF (audio?)
   ├── TRUE → STT → GPT → TTS
   └── FALSE → GPT
         ↓
   Format Response → Respond to Webhook
```

---

## 📦 Ficheiro

```
argus-voice-full-pipeline-v2.json
```

---

## ⚙️ Execução (ambiente local)

### 1️⃣ Iniciar n8n

```bash
N8N_HOST=0.0.0.0 \
N8N_SECURE_COOKIE=false \
N8N_CORS_ALLOW_ORIGIN=http://192.168.1.70:8000 \
n8n start
```

---

### 2️⃣ Iniciar frontend

```bash
cd frontend
python -m http.server 8000
```

---

### 3️⃣ Iniciar backend

```bash
cd backend
node server.js
```

---

## 🌐 Endpoints

### Backend API

```
POST http://192.168.1.70:3000/api/voice
```

---

### n8n Webhook (produção)

```
http://localhost:5678/webhook/voicev2
```

---

### n8n Webhook (teste)

```
http://localhost:5678/webhook-test/voicev2
```

⚠️ Em modo teste é necessário clicar em **Execute Workflow** antes de cada chamada.

---

## 📥 Input

### Texto

```json
{
  "text": "Olá ARGUS",
  "sessionId": "manuel"
}
```

---

### Áudio (FormData)

```
file: audio.webm
sessionId: manuel
```

---

## 📤 Output

```json
{
  "reply": "Olá! Como estás?",
  "audio": "BASE64_AUDIO",
  "userText": "Olá ARGUS"
}
```

---

## 🧠 Notas

* O campo `reply` é usado pelo frontend para mostrar a resposta do assistente.
* O campo `audio` contém o áudio em base64.
* O campo `userText` permite sincronizar UI e histórico.

---

## 🔥 Melhorias face à v1

* Suporte híbrido (texto + áudio)
* Fallback robusto sem crashes
* Estrutura de resposta padronizada
* Preparado para API e ESP32
* Melhor separação de responsabilidades

---

## 🚀 Próximos passos

* ⚡ Redução de latência
* 🔊 Melhor qualidade de voz
* 🤖 Integração com ESP32
* 🧠 Memória contextual avançada
* 📡 Streaming de resposta

---


## Notas
- usar /webhook/voicev2 em produção
- usar /webhook-test/voicev2 em desenvolvimento