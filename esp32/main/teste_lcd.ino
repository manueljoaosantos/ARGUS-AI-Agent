#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>

// ===== PINOS =====
#define TFT_MOSI 11
#define TFT_SCLK 12
#define TFT_CS   14
#define TFT_DC   13
#define TFT_RST  -1

Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RST);

// ===== TEMPO =====
unsigned long startTime;
int lastSeconds = -1;

void drawFrame() {

  tft.fillScreen(ST77XX_BLACK);

  // usar width/height dinâmico (IMPORTANTE)
  int w = tft.width();
  int h = tft.height();

  tft.drawRect(0, 0, w, h, ST77XX_BLUE);
  tft.drawRect(2, 2, w - 4, h - 4, ST77XX_BLUE);

  tft.setTextSize(2);
  tft.setTextColor(ST77XX_CYAN);

  tft.setCursor((w / 2) - 60, 10);
  tft.println("SYSTEM TIMER");
}

void setup() {

  Serial.begin(115200);

  SPI.begin(TFT_SCLK, -1, TFT_MOSI, TFT_CS);

  tft.init(240, 320);
  tft.setRotation(3);

  drawFrame();

  startTime = millis();
}

void loop() {

  int seconds = (millis() - startTime) / 1000;

  if (seconds != lastSeconds) {

    int minutes = seconds / 60;
    int secs = seconds % 60;

    char buffer[10];
    sprintf(buffer, "%02d:%02d", minutes, secs);

    // 🔥 apagar SEMPRE toda a área do relógio
    tft.fillRect(0, 80, tft.width(), 120, ST77XX_BLACK);

    // cor dinâmica
    uint16_t color = (seconds % 2 == 0) ? ST77XX_GREEN : ST77XX_WHITE;

    tft.setTextSize(6);
    tft.setTextColor(color);

    // centralização REAL
    int16_t x1, y1;
    uint16_t w, h;
    tft.getTextBounds(buffer, 0, 0, &x1, &y1, &w, &h);

    int x = (tft.width() - w) / 2;
    int y = (tft.height() - h) / 2;

    tft.setCursor(x, y);
    tft.print(buffer);

    // 🔥 barra limpa primeiro
    tft.fillRect(0, tft.height() - 20, tft.width(), 10, ST77XX_BLACK);

    int barWidth = map(seconds % 60, 0, 59, 0, tft.width());
    tft.fillRect(0, tft.height() - 20, barWidth, 10, ST77XX_GREEN);

    lastSeconds = seconds;
  }
}