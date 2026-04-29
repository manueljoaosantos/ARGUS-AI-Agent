#include <Arduino.h>
#include "mic.h"
#include "config.h"
#include <driver/i2s.h>

static int32_t rawBuffer[SAMPLES];   // 🔥 usa o teu define
static flo