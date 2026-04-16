import OpenAI from "openai";
import { config } from "./config/env.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const claudePath = path.resolve(__dirname, "../CLAUDE.md");
const claudeContext = fs.readFileSync(claudePath, "utf-8");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: config.OPENAI_BASE_URL,
});

export async function generateResponse({
  messages,
  model = "gpt-4.1",
  temperature = 0.2,
}) {
  try {
    console.log("🧠 Prompt:", messages[messages.length - 1].content);

    const response = await client.chat.completions.create({
      model,
      messages,
      temperature,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("❌ LLM error:", error);
    return "Erro ao gerar resposta";
  }
}

export async function devPrompt(prompt) {
  return generateResponse({
    messages: [
      {
        role: "system",
        content: "És um AI developer experiente a ajudar a desenvolver o sistema ARGUS.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
}

export async function argusPrompt(prompt) {
  return generateResponse({
    messages: [
      {
        role: "system",
        content: `És um AI developer a trabalhar no sistema ARGUS.

Responde sempre com soluções práticas, claras e compatíveis com a arquitetura.

Segue a arquitetura e regras do sistema abaixo:

${claudeContext}`
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
}