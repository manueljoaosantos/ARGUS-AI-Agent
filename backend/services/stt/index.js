import { config } from "../../config/env.js";
import { sttOpenAI } from "./openai.js";
import { sttWhisper } from "./whispercpp.js";

export async function speechToText(buffer) {
  if (!buffer || buffer.length === 0) {
    console.warn("⚠️ STT buffer vazio");
    return null;
  }

  try {
    if (config.STT_PROVIDER === "whispercpp") {
      const res = await sttWhisper(buffer);
      if (res) return res;
    }

    return await sttOpenAI(buffer);

  } catch {
    return null;
  }
}