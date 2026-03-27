# 🤖 ARGUS AI Agent

ARGUS (Autonomous Responsive General Utility System) é um assistente de voz com Inteligência Artificial construído com n8n, Flowise e PostgreSQL.

Sistema modular de AI Agent com:

- 🧠 Flowise (Agent com tools)
- 🔀 n8n (router + automações)
- 🌐 ngrok (exposição externa)
- 🗣️ Voice pipeline (STT + TTS)
- 📡 ESP32 (objetivo final IoT)

---

# 🧩 Arquitetura

ESP32 / UI  
 ↓  
Frontend (voice.html)  
 ↓  
Backend (Node.js)  
 ↓  
Voice Pipeline (n8n)  
 ↓  
ARGUS Agent Router (n8n)  
 ↓  
Tools (n8n)  
 ↓  
Resposta → Voice → Output

---

# ⚙️ Setup Local (Manjaro)

## 🔹 1. Iniciar n8n

N8N_HOST=0.0.0.0 \
N8N_SECURE_COOKIE=false \
N8N_CORS_ALLOW_ORIGIN=http://192.168.1.70:8000 \
n8n start

Acesso:
http://localhost:5678

---

## 🔹 2. Iniciar Flowise

flowise start

Acesso:
http://localhost:3000

---

# 🌐 Frontend e Backend

## 🔹 Frontend

Na pasta `frontend`:

python -m http.server 8000

Acesso:
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

---

### Abrir no Chrome (permitir microfone em HTTP)

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --unsafely-treat-insecure-origin-as-secure="http://192.168.1.70:8000"
```

---

## 🔹 Backend

Na pasta `backend`:

node server.js

---

# 🌐 Exposição externa (ngrok)

## 🔹 Instalar

yay -S ngrok

## 🔹 Configurar conta

1. Criar conta:
   https://dashboard.ngrok.com/signup

2. Obter authtoken:
   https://dashboard.ngrok.com/get-started/your-authtoken

3. Configurar:

ngrok config add-authtoken SEU_TOKEN

## 🔹 Expor n8n

ngrok http 5678

Vai gerar algo tipo:
https://abc123.ngrok-free.dev

## 🔹 URLs importantes

https://abc123.ngrok-free.dev/webhook/ARGUSAgentRouter  
https://abc123.ngrok-free.dev/webhook/weather  
https://abc123.ngrok-free.dev/webhook/home_control

---

# 🧠 Workflows n8n

## ARGUS-Agent-Router-v2

- Classifica intenção com LLM
- Decide:
  - home_control
  - weather
  - fallback

## Tools

### Weather

- API: Open-Meteo
- Extrai cidade
- Retorna temperatura + vento

### Home Control

- Endpoint simples (mock)
- Preparado para IoT (ESP32)

---

# 🤖 Flowise

## Chatflow

- Model: gpt-4o-mini
- Agent: Tool Agent
- Memory: Buffer Window

## Tool principal

requests_post

Body:

{
"input": "{{input}}"
}

## System Prompt

Tens acesso a uma tool chamada "agent".

Sempre que o utilizador fizer um pedido que envolva ações ou informação,
deves usar essa tool.

Nunca respondas diretamente se a tool puder tratar do pedido.

Responde sempre em português de Portugal.

---

# 🔊 Voice Pipeline (n8n)

Endpoint:
/webhook/voicev2

Função:

1. Recebe áudio
2. STT (Whisper)
3. Chama Router
4. Recebe resposta
5. TTS
6. Envia para cliente (ESP32 ou frontend)

---

# 🔗 Integração

Voice → Router  
POST /webhook/ARGUSAgentRouter

Router → Tools  
POST /webhook/weather  
POST /webhook/home_control

---

## 🎯 Objetivo

Criar um sistema AI capaz de:

- ouvir 🎤
- pensar 🧠
- falar 🔊
- agir ⚙️

... tanto em software como em dispositivos físicos (IoT).

---

# ⚠️ Notas

Não usar:
0.0.0.0

Usar:
localhost ou ngrok

Se erro Flowise:

export TOOL_REQUEST_ALLOW_LIST=\*
flowise start

- Não incluir API keys no repositório
- Usar variáveis de ambiente (.env)
- Configurar credenciais no n8n

---

# 🧪 Testes

curl -X POST http://localhost:5678/webhook/ARGUSAgentRouter \
-H "Content-Type: application/json" \
-d '{"input":"Liga a luz da sala"}'

---

# 🚀 Roadmap

- ESP32 integração
- Streaming áudio
- Routing inteligente
- Mais tools

---

## 📄 Licença

MIT

---

## ⭐ ARGUS

**Autonomous Responsive General Utility System**

# 👨‍💻 Autor

Manuel João Santos
