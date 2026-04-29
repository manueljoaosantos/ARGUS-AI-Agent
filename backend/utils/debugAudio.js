import fs from "fs";
import path from "path";

const DEBUG_DIR = path.resolve("./debug");

if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR);
}

export function saveDebugAudio(buffer, prefix = "input") {
  if (process.env.DEBUG_AUDIO !== "true") return;

  const timestamp = Date.now();
  const file = path.join(DEBUG_DIR, `${prefix}_${timestamp}.wav`);

  fs.writeFileSync(file, buffer);

  console.log(`💾 ${prefix} guardado:`, file);
}