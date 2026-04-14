#include <WiFi.h>
#include "config.h"
#include "mic.h"
#include "api.h"

// 🔊 buffers iguais à v3
int16_t pcmBuffer[SAMPLES];
int16_t audioBuffer[MAX_BUFFER];

int audioIndex = 0;

// 🔥 controlo de silêncio (igual comportamento real da v3)
unsigned long lastSpeakingTime = 0;

void setup()
{
  Serial.begin(115200);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(300);
    Serial.print(".");
  }

  Serial.println("\n✅ WiFi CONNECTED");

  mic_setup();

  Serial.println("🎤 READY");
}

#define MIN_AUDIO_SAMPLES 8000   // ~0.5s

void loop()
{
  int samples = 0;
  bool isSpeaking = false;

  mic_process(pcmBuffer, &samples, &isSpeaking);

  // 🎤 enquanto fala → acumula (igual v3)
  if (isSpeaking)
  {
    lastSpeakingTime = millis();

    for (int i = 0; i < samples; i++)
    {
      if (audioIndex < MAX_BUFFER)
      {
        audioBuffer[audioIndex++] = pcmBuffer[i];
      }
    }
  }

  // 🛑 envia só após silêncio consistente
  if (!isSpeaking && audioIndex > 0)
  {
    if (millis() - lastSpeakingTime > 800)
    {
      if (audioIndex > MIN_AUDIO_SAMPLES)
      {
        Serial.printf("🎤 Sending %d samples\n", audioIndex);

        api_send(audioBuffer, audioIndex);
      }
      else
      {
        Serial.printf("⚠️ Ignorado (%d samples - muito curto)\n", audioIndex);
      }

      audioIndex = 0;
    }
  }
}