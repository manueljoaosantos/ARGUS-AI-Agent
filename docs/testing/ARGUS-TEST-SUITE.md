# 🧠 ARGUS Test Suite

Conjunto de frases para testar o sistema ARGUS (ESP32 + Flowise + n8n + Tools)

---

## 🧠 🧪 TESTES GERAIS (baseline)

- "Olá ARGUS"
- "Estás online?"
- "Consegues ajudar-me?"
- "Quem és tu?"

---

## 🔒 🧪 TESTES DE CONTROLO (fora de domínio)

👉 Devem dar resposta bloqueada

- "Quem ganhou o Mundial de 2018?"
- "Qual é a capital de França?"
- "Conta-me uma piada"
- "Quem é o Cristiano Ronaldo?"

---

## 📚 🧪 TESTES RAG (DevOps)

👉 Devem usar a tool `knowledge_devops`

- "Quem é Gene Kim?"
- "O que é DevOps?"
- "Quais são as três maneiras do DevOps?"
- "Qual é o objetivo do DevOps segundo o livro?"
- "Porque surgiu o DevOps?"
- "O que é CI/CD no contexto de DevOps?"

---

## ⏰ 🧪 TESTES TOOL: TIME

👉 ESP32 + tool call

- "Que horas são?"
- "Diz-me a hora atual"
- "Qual é a data de hoje?"

---

## 🌤️ 🧪 TESTES TOOL: WEATHER

- "Como está o tempo hoje?"
- "Qual é a temperatura em Lisboa?"
- "Vai chover hoje?"

---

## 💡 🧪 TESTES TOOL: HOME CONTROL

👉 muito importante para ESP32

- "Liga a luz da sala"
- "Desliga a luz da cozinha"
- "Liga o aquecedor"
- "Desliga todos os dispositivos"
- "Liga a ventoinha"

---

## 🧠 💾 TESTES MEMÓRIA

👉 deve guardar info

- "O meu nome é Manuel"
- "Gosto de café"
- "Moro em Lisboa"
- "Trabalho em IT"

👉 depois testar:

- "Qual é o meu nome?"
- "Onde moro?"
- "O que gosto?"

---

## 📊 🧪 TESTES PRODUCT MANAGER

### CREATE

- "Cria um produto chamado rato"
- "Cria um produto chamado teclado com preço 20 euros"

👉 deve pedir campos em falta

---

### CREATE COMPLETO

- "Cria um produto chamado rato, preço 15, categoria periféricos, stock 10"

---

### READ

- "Lista os produtos"
- "Quantos produtos existem?"
- "Mostra o produto rato"

---

### UPDATE

- "Atualiza o preço do rato para 20"
- "Muda o stock do teclado para 50"

---

### DELETE

- "Apaga o produto rato"

---

## 🔥 🧪 TESTES EDGE CASES

👉 para apanhar bugs

- "Liga a luz e diz-me a hora"
- "Qual é o tempo e liga a luz"
- "Cria produto rato e depois lista produtos"
- "O meu nome é João e liga a luz"

---

## ⚡ 🧪 TESTES ESP32 (curtos / voz)

👉 ideais para input simples:

- "Hora"
- "Liga luz"
- "Desliga luz"
- "Temperatura"
- "Quem é Gene Kim"
- "DevOps"

---

## 🚀 EXTRA (stress test)

- "Explica DevOps em 2 frases"
- "Resume as três maneiras"
- "Liga a luz e explica DevOps"