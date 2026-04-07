import { sendToFlowise } from "./flowiseClient.js";
import { speechToText } from "./stt.js";

export async function processVoice({ text, audioBuffer, sessionId }) {
  let finalText = text;

  // 🎤 STT
  if (audioBuffer) {
    finalText = await speechToText(audioBuffer);

    if (!finalText) {
      throw new Error("STT falhou");
    }

    finalText = normalizeText(finalText);
  }

  if (!finalText || finalText.trim() === "") {
    throw new Error("Texto vazio");
  }

  // 🤖 LLM
  const flowiseResponse = await sendToFlowise({
    question: finalText,
    sessionId: sessionId || "anonymous"
  });

  let reply = "Não consegui responder.";

  if (flowiseResponse?.usedTools?.length > 0) {
    try {
      const toolData = JSON.parse(
        flowiseResponse.usedTools[0].toolOutput
      );

      reply = toolData.text || toolData.reply || reply;
    } catch {}
  } else {
    reply =
      flowiseResponse?.reply ||
      flowiseResponse?.text ||
      reply;
  }

  return reply;
}

function normalizeText(text) {
  return text
    .normalize("NFC")
    .replace(/�/g, "á")
    .replace(/est��/gi, "está")
    .trim();
}