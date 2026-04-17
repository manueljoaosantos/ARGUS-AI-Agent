#pragma once
#include <Arduino.h>

void tft_setup();
void tft_clear();
void tft_listening();
void tft_processing();
void tft_show_chat(String user, String ai);
void drawBootAnimation();