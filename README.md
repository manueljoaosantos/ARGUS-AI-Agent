# 🤖 ARGUS AI Agent — Part 1

ARGUS (Autonomous Responsive General Utility System) é um assistente de voz com Inteligência Artificial construído com n8n, Flowise e PostgreSQL.

⚡ **Esta é a Parte 1 do projeto**, focada na criação de um pipeline completo de voz com memória e interface web.

---

## 🎬 Demo

👉 https://www.youtube.com/watch?v=rqHoJIh602I

---

## 🚀 Funcionalidades

- 🎤 Speech-to-Text (Whisper API)
- 🧠 Conversação com LLM (GPT / Flowise)
- 💾 Memória persistente (PostgreSQL)
- 🔊 Text-to-Speech (voz natural)
- ⚙️ Automação com n8n
- 🌐 Interface web (voice.html)

---

## 🧱 Arquitetura

Frontend (voice.html)
↓
Webhook (n8n)
↓
STT → Memory → LLM → TTS
↓
Resposta (voz)

---

## ⚙️ Workflow n8n

Pipeline completo:

Webhook → STT (Whisper) → Extract Session → PostgreSQL (SELECT) → Build Messages → GPT → Add Assistant → PostgreSQL (UPSERT) → TTS → Response

---

## Voice Pipeline

- v1 → legacy
- v2 → current (recomendado)

---

## 🖥️ Como executar (local)

### 1. Iniciar n8n

```bash
N8N_HOST=0.0.0.0 N8N_SECURE_COOKIE=false n8n start
```

---

### 2. Servir frontend

```bash
cd frontend
python -m http.server 8000
```

---

### 3. Abrir no Chrome (permitir microfone em HTTP)

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --unsafely-treat-insecure-origin-as-secure="http://192.168.1.70:8000"
```

---

### 4. Aceder à interface

http://192.168.1.70:8000/voice.html

---

## 💾 Base de Dados

Tabela principal:

```sql
CREATE TABLE public.conversations (
    session_id TEXT PRIMARY KEY,
    messages JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

Formato do histórico:

```json
[
  { "role": "user", "content": "Olá" },
  { "role": "assistant", "content": "Olá! Como posso ajudar?" }
]
```

---

## 📁 Estrutura do Projeto

- frontend/ → interface de voz
- n8n/ → workflows
- flowise/ → chatflows
- database/ → schema
- esp32/ → integração futura
- docs/ → documentação

---

## 🔧 Tecnologias

- n8n
- Flowise
- Langflow (futuro)
- PostgreSQL
- OpenAI (Whisper + GPT + TTS)
- Manjaro Linux

---

## 📡 Roadmap

### 🔹 Parte 1 (este repositório)

- [x] Pipeline AI Voice completo
- [x] Memória com PostgreSQL
- [x] Interface web (voice.html)

---

### 🔹 Parte 2

- [ ] Integração com Flowise
- [ ] Integração com Langflow
- [ ] Melhor gestão de contexto

---

### 🔹 Parte 3 — Hardware (ESP32)

Integração com:

- INMP441 Digital Microphone / SPH0645
- MAX98357A Amplifier
- Cavity Speaker (8Ω 2W)
- 1.54" IPS Display
- TFT SPI ST7789 (2.4")
- ESP32-S3 WROOM-1-N16R8 (com câmera OV3660)
- ESP32-S3 AIoT Board (Wi-Fi + Bluetooth)

---

## 🎯 Objetivo

Criar um sistema AI capaz de:

- ouvir 🎤
- pensar 🧠
- falar 🔊
- agir ⚙️

... tanto em software como em dispositivos físicos (IoT).

---

## ⚠️ Notas

- Não incluir API keys no repositório
- Usar variáveis de ambiente (.env)
- Configurar credenciais no n8n

---

## 📄 Licença

MIT

---

## ⭐ ARGUS

**Autonomous Responsive General Utility System**
