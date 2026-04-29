#include <WiFi.h>
#include "config.h"
#include "mic.h"
#include "api.h"
#include "tft.h"

// ================= AUDIO =================
int16_t pcmBuffer[SAMPLES];
int1