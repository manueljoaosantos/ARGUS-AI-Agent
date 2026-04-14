#pragma once
#include <Arduino.h>

inline void writeWavHeader(uint8_t *b, int dataSize)
{

  int sampleRate = 16000;
  int bitsPerSample = 16;
  int channels = 1;

  int byteRate = sampleRate * channels * bitsPerSample / 8;
  int blockAlign = channels * bitsPerSample / 8;
  int chunkSize = 36 + dataSize;

  memcpy(b, "RIFF", 4);
  b[4] = chunkSize & 0xff;
  b[5] = (chunkSize >> 8);
  b[6] = (chunkSize >> 16);
  b[7] = (chunkSize >> 24);

  memcpy(b + 8, "WAVE", 4);
  memcpy(b + 12, "fmt ", 4);

  b[16] = 16;
  b[17] = 0;
  b[18] = 0;
  b[19] = 0;
  b[20] = 1;
  b[21] = 0;
  b[22] = 1;
  b[23] = 0;

  b[24] = sampleRate & 0xff;
  b[25] = (sampleRate >> 8);
  b[26] = (sampleRate >> 16);
  b[27] = (sampleRate >> 24);

  b[28] = byteRate & 0xff;
  b[29] = (byteRate >> 8);
  b[30] = (byteRate >> 16);
  b[31] = (byteRate >> 24);

  b[32] = blockAlign;
  b[33] = (blockAlign >> 8);

  b[34] = bitsPerSample;
  b[35] = (bitsPerSample >> 8);

  memcpy(b + 36, "data", 4);

  b[40] = dataSize & 0xff;
  b[41] = (dataSize >> 8);
  b[42] = (dataSize >> 16);
  b[43] = (dataSize >> 24);
}