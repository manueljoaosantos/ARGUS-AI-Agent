#include "api.h"
#include "config.h"
#include "wav.h"
#include "speaker.h"
#include "tft.h"

#include <WiFi.h>
#include "mbedtls/base64.h"

// ================= BASE64 =================
String base64Decode(String input)
{
  size_t outputLen;
  unsigned char output[1024];

  if (mbedtls_base64_decode(output, sizeof(output), &outputLen,
                            (const unsigned char*)input.c_str(), input.length()) != 0)
  {
    return "";
  }

  return String((char*)output).substring(0, outputLen);
}

// ================= API SEND =================
void api_send(int16_t *data, int samples)
{
  int dataSize = samples * 2;

  uint8_t header[44];
  writeWavHeader(header, dataSize);

  String boundary = "----ESP32";

  String head =
      "--" + boundary + "\r\n"
                        "Content-Disposition: form-data; name=\"file\"; filename=\"audio.wav\"\r\n"
                        "Content-Type: audio/wav\r\n\r\n";

  String tail = "\r\n--" + boundary + "--\r\n";

  int totalSize = head.length() + 44 + dataSize + tail.length();

  WiFiClient client;

  if (!client.connect(API_HOST, API_PORT))
  {
    Serial.println("❌ Connection failed");
    return;
  }

  Serial.printf("📦 Sending (%d bytes)\n", totalSize);

  // ===== REQUEST =====
  client.println("POST /api/voice HTTP/1.1");
  client.println("Host: " API_HOST);
  client.println("Content-Type: multipart/form-data; boundary=" + boundary);
  client.println("Content-Length: " + String(totalSize));
  client.println("Connection: close");
  client.println();

  // ===== BODY =====
  client.write((uint8_t *)head.c_str(), head.length());
  client.write(header, 44);
  client.write((uint8_t *)data, dataSize);
  client.write((uint8_t *)tail.c_str(), tail.length());

  Serial.println("⏳ Waiting response...");

  String userText = "";
  String aiReply = "";
  bool ok = false;

  // ===== HEADERS =====
  while (client.connected() || client.available())
  {
    String line = client.readStringUntil('\n');

    if (line.startsWith("HTTP/1.1 200"))
      ok = true;

    if (line.startsWith("X-User-Text:"))
    {
      userText = line.substring(12);
      userText.trim();
    }

    if (line.startsWith("X-AI-Reply:"))
    {
      aiReply = line.substring(11);
      aiReply.trim();
    }

    if (line == "\r")
      break;
  }

  if (!ok)
  {
    Serial.println("❌ Bad response");
    client.stop();
    return;
  }

  // ===== DECODE =====
  String userDecoded = base64Decode(userText);
  String aiDecoded   = base64Decode(aiReply);

  Serial.println("🧑 " + userDecoded);
  Serial.println("🤖 " + aiDecoded);

  // =========================
  // 🔥 UX PRO FLOW
  // =========================

  // 💬 1. mostrar imediatamente no TFT
  if (userDecoded.length() > 0 || aiDecoded.length() > 0)
  {
    tft_show_chat(userDecoded, aiDecoded);
  }

  // ⏳ 2. pequena pausa natural (efeito "pensar")
  delay(150);

  // 🔊 3. tocar áudio (stream completo)
  speaker_play(client);

  client.stop();
}