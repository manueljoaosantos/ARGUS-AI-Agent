import { config } from "../config/env.js";

export async function sendToFlowise(payload) {
  const { FLOWISE_URL, FLOWISE_CHATFLOW_ID } = config;

  const res = await fetch(
    `${FLOWISE_URL}/api/v1/prediction/${FLOWISE_CHATFLOW_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        question: payload.question,
        overrideConfig: {
          sessionId: payload.sessionId
        }
      })
    }
  );
  if (!res.ok) {
    throw new Error(`Flowise error: ${res.status}`);
  }
  const data = await res.json();

  console.log("🔥 FLOWISE RAW:", data);

  return {
    reply: data.text || "",
    usedTools: data.usedTools || [],
    raw: data
  };
}