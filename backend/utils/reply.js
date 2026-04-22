// ==========================
// 🧠 RESOLVE REPLY
// ==========================
export function resolveReply(res) {
  if (!res) return null;

  let reply =
    res.reply ||
    res.text ||
    res.response ||
    res.output ||
    res.outputs?.[0]?.output ||
    "";

  // 🔥 prioridade a tools
  if (res.usedTools?.length > 0) {
    const raw = res.usedTools[0].toolOutput;

    if (raw && raw.trim() !== "") {
      try {
        const tool = JSON.parse(raw);
        if (tool?.text) {
          reply = tool.text;
        }
      } catch {
        reply = raw; // fallback
      }
    }
  }

  if (!reply || reply.trim() === "") {
    reply = "Desculpa, não consegui responder.";
  }

  return reply
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}