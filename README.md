# 🤖 ARGUS AI Agent

🎬 **Demo completa (ESP32 + AI + Flowise + n8n):**  
👉 https://www.youtube.com/watch?v=HarB0kFafXM

---

ARGUS (Autonomous Responsive General Utility System) é um assistente de voz com Inteligência Artificial totalmente funcional, integrando hardware (ESP32), IA (Flowise), automação (n8n) e base de dados (PostgreSQL).

---

# 🚀 Funcionalidades

## 🎤 Voz (ESP32)
- Captura de áudio via I2S
- Voice Activity Detection (VAD)
- Envio automático após silêncio
- Reprodução de áudio (TTS)
- Interface TFT com:
  - Boot animation
  - Listening (ondas animadas)
  - Processing
  - Chat (User + AI)

---

## 🧠 Inteligência (Flowise)
- Agent com tools
- Memória conversacional
- Decisão automática de tools
- Interação multi-step (ex: criação de produtos)

---

## 🔀 Automação (n8n)
- Router de intenções
- Execução de tools:
  - 🌤️ Weather
  - 💡 Home Control
  - ⏰ Time
  - 🧠 Memory
  - 📊 Database (PostgreSQL)

---

## 💾 Base de Dados (PostgreSQL)
- Conversas
- Produtos
- Queries dinâmicas
- CRUD via AI

---

# 🧩 Arquitetura

```

ESP32 (voz + TFT)
↓
Backend (Node.js)
↓
n8n (Voice Pipeline)
↓
Flowise (Agent)
↓
n8n (Tools)
↓
PostgreSQL / APIs externas
↓
Resposta → ESP32 (áudio + TFT)

```

---

# ⚙️ ARRANQUE DO SISTEMA (IMPORTANTE)

## 🔹 1. n8n

```bash
cd /home/manuel/ARGUS-AI-Agent 
N8N_HOST=0.0.0.0 \
N8N_SECURE_COOKIE=false \
N8N_CORS_ALLOW_ORIGIN=http://192.168.1.70:8000 \
n8n start
```

👉 [http://localhost:5678](http://localhost:5678)

---

## 🔹 2. Flowise

```bash
cd /home/manuel/ARGUS-AI-Agent
flowise start
```

👉 [http://localhost:3000](http://localhost:3000)

---

## 🔹 3. Frontend

```bash
cd /home/manuel/ARGUS-AI-Agent/frontend/
python -m http.server 8000
```

👉 [http://192.168.1.70:8000/voice.html](http://192.168.1.70:8000/voice.html)

---

## 🔹 4. Backend

```bash
cd /home/manuel/ARGUS-AI-Agent/backend/
node server.js
```

---

## 🔹 5. ngrok (exposição externa)

```bash
cd /home/manuel/ARGUS-AI-Agent
ngrok http 5678
```

---

# 🔊 Voice Pipeline

Endpoint:

```
/webhook/voicev2
```

Fluxo:

1. Recebe áudio
2. STT (Whisper)
3. Chama Flowise
4. Flowise decide tools
5. n8n executa
6. TTS
7. Resposta enviada ao ESP32

---

# 🧠 Flowise

## Agent

* Model: gpt-4o-mini
* Tool Agent
* Memory ativa

## Tools integradas

* weather
* home_control
* time
* memory
* product_manager (DB)

---

# 💾 PostgreSQL

## Conversas

```sql
CREATE TABLE conversations (
    session_id TEXT PRIMARY KEY,
    messages JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Produtos

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2),
  category TEXT,
  stock INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 🔥 Tools Avançadas

## 📊 Product Manager

* Verifica existência
* Pergunta campos em falta (Flowise)
* Insere na base de dados

## 🧠 Memory

* Guarda dados do utilizador
* Responde com contexto

## 💡 Home Control

* Preparado para IoT (ESP32)

---

# 🎬 Exemplos de Uso

### 🧠 Memória

> "O meu nome é Manuel"
> "Qual é o meu nome?"

---

### 🌤️ Weather

> "Está calor hoje?"

---

### 💡 Automação

> "Liga a luz da sala"

---

### 📊 Base de Dados

> "Quantos produtos temos?"

---

### ➕ Criação inteligente

> "Adiciona Coca-Cola"

👉 IA pergunta:

* preço
* categoria
* stock

---

# 🔐 Notas Importantes

* Não incluir API keys no repo
* Usar `.env`
* Configurar credenciais no n8n
* Flowise:

```bash
export TOOL_REQUEST_ALLOW_LIST=*
```

---

# 🧪 Testes

```bash
curl -X POST http://localhost:5678/webhook/ARGUSAgentRouter \
-H "Content-Type: application/json" \
-d '{"input":"Liga a luz da sala"}'
```

Ver lista completa de testes em:
👉 docs/testing/ARGUS-TEST-SUITE.md

---

# 🚀 Estado do Projeto

✅ ESP32 totalmente funcional
✅ Voice pipeline completo
✅ Tools com n8n
✅ IA com Flowise
✅ DB integrada
🔥 Sistema end-to-end completo

---

# 🎯 Objetivo

Criar um assistente AI capaz de:

* ouvir 🎤
* pensar 🧠
* falar 🔊
* agir ⚙️
* interagir com dados reais 📊

---

# 📄 Licença

MIT

---

# 👨‍💻 Autor

Manuel João Santos


---