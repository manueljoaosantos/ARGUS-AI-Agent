#include <WiFi.h>
#include "config.h"
#include "mic.h"
#include "api.h"
#include "tft.h"

// ================= AUDIO =================
int16_t pcmBuffer[SAMPLES];
int16_t audioBuffer[MAX_BUFFER];

int audioIndex = 0;

// ================= UI =================
enum UiState {
  UI_IDLE,
  UI_LISTENING,
  UI_PROCESSING
};

UiState currentUiState = UI_IDLE;
UiState lastUiState = UI_IDLE;

// ================= TIMING =================
unsigned long lastSpeakingTime = 0;

#define MIN_AUDIO_SAMPLES 6000   // mantém como tens

// ================= SETUP =================
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

  tft_setup();
  drawBootAnimation();
  tft_clear();

  mic_setup();

  Serial.println("🎤 READY");
}

// ================= UI =================
void updateUI(UiState newState)
{
  currentUiState = newState;

  if (newState != lastUiState)
  {
    tft_clear();
    lastUiState = newState;
  }

  switch (newState)
  {
    case UI_LISTENING:
      tft_listening();
      break;

    case UI_PROCESSING:
      tft_processing();
      break;

    default:
      break;
  }
}

// ================= LOOP =================
void loop()
{
  int samples = 0;
  bool isSpeaking = false;

  mic_process(pcmBuffer, &samples, &isSpeaking);

  // 🎤 UI
  if (isSpeaking || audioIndex == 0)
  {
    updateUI(UI_LISTENING);
  }

  // 🔥 FIX PRINCIPAL: acumular SEMPRE (não só quando fala)
  for (int i = 0; i < samples; i++)
  {
    if (audioIndex < MAX_BUFFER)
    {
      audioBuffer[audioIndex++] = pcmBuffer[i];
    }
  }

  // 🎤 atualizar tempo de fala
  if (isSpeaking)
  {
    lastSpeakingTime = millis();
  }

  // 🛑 fim de frase
  if (!isSpeaking && audioIndex > 0)
  {
    if (millis() - lastSpeakingTime > 1200)
    {
      if (audioIndex > MIN_AUDIO_SAMPLES)
      {
        Serial.printf("🎤 Sending %d samples\n", audioIndex);

        updateUI(UI_PROCESSING);

        api_send(audioBuffer, audioIndex);
      }
      else
      {
        Serial.printf("⚠️ Ignorado (%d samples - muito curto)\n", audioIndex);
      }

      audioIndex = 0;
    }
  }

  // 🔒 proteção buffer
  if (audioIndex >= MAX_BUFFER)
  {
    Serial.println("⚠️ Buffer full");

    if (audioIndex > MIN_AUDIO_SAMPLES)
    {
      updateUI(UI_PROCESSING);
      api_send(audioBuffer, audioIndex);
    }

    audioIndex = 0;
  }
}