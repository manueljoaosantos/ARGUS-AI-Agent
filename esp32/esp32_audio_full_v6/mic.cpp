#include <Arduino.h>
#include "mic.h"
#include "config.h"
#include <driver/i2s.h>

static int32_t rawBuffer[SAMPLES];

static float noiseFloor = 50;

bool mic_process(int16_t *outBuffer, int *samplesOut, bool *isSpeaking)
{
  size_t bytesRead = 0;

  i2s_read(I2S_MIC, rawBuffer, sizeof(rawBuffer), &bytesRead, portMAX_DELAY);

  int samplesRead = bytesRead / sizeof(int32_t);

  long sum = 0;

  for (int i = 0; i < samplesRead; i++)
  {
    int32_t raw = rawBuffer[i];
    raw = raw >> 8;

    // 🔊 ganho com proteção
    int32_t boosted = (raw >> 8) * 2;

    if (boosted > 32767) boosted = 32767;
    if (boosted < -32768) boosted = -32768;

    int16_t sample = (int16_t)boosted;

    outBuffer[i] = sample;

    sum += abs((int32_t)sample);
  }

  float avg = (float)sum / samplesRead;

  // 🔥 noise tracking (suave)
  noiseFloor = (noiseFloor * 0.98) + (avg * 0.02);
  float threshold = noiseFloor * 2.2;

  bool speakingNow = false;

  // 🔥 memória de voz
  static unsigned long lastVoiceTime = 0;

  // 🔥 consistência de frames
  static int voiceFrames = 0;

  // ================= VAD AJUSTADO =================
  if (avg > threshold * 0.8)
  {
    voiceFrames++;

    if (voiceFrames > 2)
    {
      lastVoiceTime = millis();
      speakingNow = true;
    }
  }
  else
  {
    voiceFrames = 0;

    // 🔥 mantém fala durante pausas naturais
    if (millis() - lastVoiceTime < 900)
    {
      speakingNow = true;
    }
    else
    {
      speakingNow = false;
    }
  }

  *samplesOut = samplesRead;
  *isSpeaking = speakingNow;

  return true;
}

void mic_setup()
{
  i2s_config_t config = {
      .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
      .sample_rate = SAMPLE_RATE,
      .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
      .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
      .communication_format = I2S_COMM_FORMAT_I2S_MSB,
      .dma_buf_count = 8,
      .dma_buf_len = 256};

  i2s_pin_config_t pins = {
      .bck_io_num = MIC_BCLK,
      .ws_io_num = MIC_WS,
      .data_out_num = I2S_PIN_NO_CHANGE,
      .data_in_num = MIC_DIN};

  i2s_driver_install(I2S_MIC, &config, 0, NULL);
  i2s_set_pin(I2S_MIC, &pins);
}