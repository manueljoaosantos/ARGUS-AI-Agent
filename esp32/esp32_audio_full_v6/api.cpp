#include "api.h"
#include "config.h"
#include "wav.h"
#include "tft.h"
#include "speaker.h"

#include <WiFi.h>
#include "mbedtls/base64.h"

void api_send(int16_t *data, int samples)
{
  if (samples > 30000) samples = 30000;

  int dataSize = samples * 2;

  Serial.printf("📦 Sending RAW audio (%d samples)\n", samples);

  // ================= OFFSET =================
  int32_t sum = 0;
  for (int i = 0; i < samples; i++) sum += data[i];
  int16_t offset = sum / samples;

  // ================= HEADER =================
  uint8_t header[44];
  writeWavHeader(header, dataSize);

  WiFiClient client;

  if (!client.connect(API_HOST, API_PORT)) {
    Serial.println("❌ HTTP failed");
    return;
  }

  int totalSize = 44 + dataSize;

  // ================= REQUEST =================
  client.println("POST /api/voice HTTP/1.1");
  client.printf("Host: %s\r\n", API_HOST);
  client.println("Content-Type: audio/wav");
  client.printf("Content-Length: %d\r\n", totalSize);
  client.println("Connection: close");
  client.println();

  client.write(header, 44);

  // ================= AUDIO =================
  for (int i = 0; i < samples; i++)
  {
    int32_t s = (data[i] - offset) * 4;

    if (s > 32767) s = 32767;
    if (s < -32768) s = -32768;

    int16_t out = (int16_t)s;
    client.write((uint8_t*)&out, 2);
  }

  // ================= HEADERS =================
String aiReplyB64 = "";
String userTextB64 = "";

while (client.connected())
{
  String line = client.readStringUntil('\n');

  if (line == "\r") break;

  if (line.startsWith("X-AI-Reply: "))
  {
    aiReplyB64 = line.substring(12);
    aiReplyB64.trim();
  }

  if (line.startsWith("X-User-Text: "))
  {
    userTextB64 = line.substring(13);
    userTextB64.trim();
  }
}

  // ================= DECODE =================
  char aiDecoded[256];
  char userDecoded[256];

  size_t aiLen = 0;
  size_t userLen = 0;

  if (aiReplyB64.length() > 0)
  {
    mbedtls_base64_decode(
      (unsigned char*)aiDecoded,
      sizeof(aiDecoded),
      &aiLen,
      (const unsigned char*)aiReplyB64.c_str(),
      aiReplyB64.length()
    );
    aiDecoded[aiLen] = '\0';
  }

  if (userTextB64.length() > 0)
  {
    mbedtls_base64_decode(
      (unsigned char*)userDecoded,
      sizeof(userDecoded),
      &userLen,
      (const unsigned char*)userTextB64.c_str(),
      userTextB64.length()
    );
    userDecoded[userLen] = '\0';
  }

  // ================= TFT =================
  if (aiLen > 0)
  {
    Serial.println("🤖 AI:");
    Serial.println(aiDecoded);

    tft_show_chat(
      String(userDecoded),
      String(aiDecoded)
    );
  }
  else
  {
    tft_processing();
  }

  // ================= AUDIO =================
  speaker_play(client);

  client.stop();

  Serial.println("✅ Done");
}