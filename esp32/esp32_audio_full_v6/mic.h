#pragma once

#include <Arduino.h>   // 🔥 resolve int16_t, millis, etc

bool mic_process(int16_t *buffer, int *samplesOut, bool *isSpeaking);
void mic_setup();