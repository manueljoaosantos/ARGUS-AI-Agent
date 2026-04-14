#include "api.h"
#include "config.h"
#include "wav.h"
#include "speaker.h"
#include <WiFi.h>

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

  client.println("POST /api/voice HTTP/1.1");
  client.println("Host: " API_HOST);
  client.println("Content-Type: multipart/form-data; boundary=" + boundary);
  client.println("Content-Length: " + String(totalSize));
  client.println("Connection: close");
  client.println();

  client.write((uint8_t *)head.c_str(), head.length());
  client.write(header, 44);
  client.write((uint8_t *)data, dataSize);
  client.write((uint8_t *)tail.c_str(), tail.length());

  Serial.println("⏳ Waiting response...");

  bool ok = false;

  while (client.connected())
  {
    String line = client.readStringUntil('\n');
    if (line == "\r")
      break;

    line.trim();
    Serial.println(line);

    if (line.startsWith("HTTP/1.1 200"))
      ok = true;
  }

  if (ok)
  {
    speaker_play(client);
  }

  client.stop();
}