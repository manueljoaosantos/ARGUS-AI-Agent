#pragma once
#include <Arduino.h>   // 🔥 resolve GPIO_NUM_X
#include "secrets.h"

// WIFI
#define API_HOST "192.168.1.70"
#define API_PORT 3001

// MIC
#define MIC_BCLK GPIO_NUM_9
#define MIC_WS GPIO_NUM_4
#define MIC_DIN GPIO_NUM_10
#define MIN_SAMPLES 3000

// SPEAKER
#define SPK_BCLK GPIO_NUM_5
#define SPK_WS GPIO_NUM_6
#define SPK_DOUT GPIO_NUM_7

#define I2S_MIC I2S_NUM_0
#define I2S_SPK I2S_NUM_1

// AUDIO
#define API_PATH "/audio"
#define SAMPLE_RATE 16000
#define SAMPLES 512
#define MIN_AUDIO_SAMPLES 8000  // ~0.5s
#define MAX_BUFFER 32000        // ~2s

