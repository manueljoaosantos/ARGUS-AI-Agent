export function normalizeText(text) {
  return text
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}