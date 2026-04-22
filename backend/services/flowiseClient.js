import fetch from "node-fetch";
import { config } from "../config/env.js";

export async function sendToFlowise(payload) {
  const { FLOWISE_URL, FLOWISE_CHATFLOW_ID } = config;

  try {
    // 🔒 validações
    if (!FLOWISE_URL) {
      throw new Error("FLOWISE_URL não definido");
    }

    if (!FLOWISE_CHATFLOW_ID) {
      throw new Error("FLOWISE_CHATFLOW_ID não definido");
    }

    if (!payload?.question || payload.question.trim() === "") {
      throw new Error("Payload sem 'question'");
    }

    const url = `${FLOWISE_URL}/api/v1/prediction/${FLOWISE_CHATFLOW_ID}`;

    console.log("🌐 FLOWISE URL:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: payload.question,
        overrideConfig: {
          sessionId: payload.sessionId || "anonymous"
        }
      })
    });

    // 🔥 FIX UTF-8 (CRÍTICO)
    const buffer = await res.arrayBuffer();
    const raw = new TextDecoder("utf-8").decode(buffer);

    console.log("📦 FLOWISE RAW:", raw);

    // ❌ erro HTTP
    if (!res.ok) {
      throw new Error(`Flowise error ${res.status}: ${raw}`);
    }

    // ❌ HTML (erro clássico de URL)
    if (raw.startsWith("<!DOCTYPE")) {
      throw new Error("Flowise devolveu HTML → URL inválida");
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("Erro a fazer parse do JSON do Flowise");
    }

    console.log("🧠 FLOWISE JSON:", data);

    // ==========================
    // 🔥 RESOLVE REPLY (MELHORADO)
    // ==========================
    let reply =
      data?.text ||
      data?.response ||
      data?.output ||
      data?.outputs?.[0]?.output ||
      "";

    // 🔥 PRIORIDADE: TOOL (mais inteligente)
    if (data?.usedTools?.length > 0) {
      const raw = data.usedTools[0].toolOutput;

      if (raw && raw.trim() !== "") {
        try {
          const toolData = JSON.parse(raw);

          if (toolData.text) {
            reply = toolData.text;
          }
        } catch {
          // 🔥 fallback inteligente
          reply = raw;
        }
      }
    }

    if (!reply || reply.trim() === "") {
      reply = "Não consegui obter resposta.";
    }

    // 🔥 normalização final (segura)
    reply = reply
      .normalize("NFC")
      .replace(/\s+/g, " ")
      .trim();

    return {
      reply,
      usedTools: data?.usedTools || [],
      raw: data
    };

  } catch (err) {
    console.error("❌ FLOWISE FAIL:", err.message);

    return {
      reply: "Erro ao comunicar com o assistente.",
      usedTools: [],
      raw: null,
      error: err.message
    };
  }
}