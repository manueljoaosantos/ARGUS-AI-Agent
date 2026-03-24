import { config } from "../config/env.js";

export async function sendToN8N(payload) {
  const res = await fetch(config.N8N_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
console.log("👉 N8N URL:", config.N8N_WEBHOOK);
  console.log("📡 RAW n8n:", text);

  if (!text) return {};

  try {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data[0] : data;
  } catch {
    return {};
  }
}