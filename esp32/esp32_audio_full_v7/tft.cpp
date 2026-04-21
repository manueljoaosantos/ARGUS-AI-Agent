#include "tft.h"
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>

// ===== PINOS =====
#define TFT_MOSI 17
#define TFT_SCLK 18
#define TFT_CS   14
#define TFT_DC   13
#define TFT_RST  -1

Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RST);

// ================= SETUP =================
void tft_setup()
{
  SPI.begin(TFT_SCLK, -1, TFT_MOSI, TFT_CS);

  tft.init(240, 320);
  tft.setRotation(3);

  tft.fillScreen(ST77XX_BLACK);
  tft.setTextSize(2);
  tft.setTextColor(ST77XX_WHITE);
}

// ================= CLEAR =================
void tft_clear()
{
  tft.fillScreen(ST77XX_BLACK);
}

// ================= WRAP TEXT =================
void drawWrapped(String text, int x, int y, uint16_t color)
{
  tft.setTextColor(color);
  tft.setTextSize(2);

  int maxWidth = tft.width() - 10;

  String line = "";

  for (int i = 0; i < text.length(); i++)
  {
    line += text[i];

    int16_t x1, y1;
    uint16_t w, h;
    tft.getTextBounds(line, 0, 0, &x1, &y1, &w, &h);

    if (w > maxWidth)
    {
      tft.setCursor(x, y);
      tft.print(line);

      line = "";
      y += 22;
    }
  }

  if (line.length())
  {
    tft.setCursor(x, y);
    tft.print(line);
  }
}

// ================= ESTADOS SIMPLES =================
void tft_listening()
{
  static unsigned long animTimer = 0;

  if (millis() - animTimer < 80) return;
  animTimer = millis();

  int screenW = tft.width();   // 👉 320
  int screenH = tft.height();  // 👉 240

  tft.fillRect(0, 100, screenW, 140, ST77XX_BLACK);

  int baseY = screenH - 20; // mais adaptável

  int numBars = 12; // mais barras fica melhor em 320px
  int spacing = screenW / numBars;
  int barWidth = spacing - 4;

  for (int i = 0; i < numBars; i++)
  {
    int x = i * spacing + 2;

    int h = random(10, 100);

    uint16_t color = tft.color565(0, random(150,255), random(50,200));

    tft.fillRect(x, baseY - h, barWidth, h, color);
  }
}

void tft_processing()
{
  tft.fillScreen(ST77XX_BLACK);
  tft.setTextColor(ST77XX_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(10, 40);
  tft.println("Processing...");
}

// ================= CHAT UI =================
void tft_show_chat(String user, String ai)
{
  tft.fillScreen(ST77XX_BLACK);

  int x = 5;
  int y = 10;

  // ===== USER =====
  tft.setTextSize(2);
  tft.setTextColor(ST77XX_CYAN);
  tft.setCursor(x, y);
  tft.println("You:");

  y += 20;

  drawWrapped(user, x, y, ST77XX_WHITE);

  // espaço após pergunta
  y += 100;

  // ===== AI =====
  tft.setTextColor(ST77XX_GREEN);
  tft.setCursor(x, y);
  tft.println("AI:");

  y += 20;

  drawWrapped(ai, x, y, ST77XX_WHITE);
}

void drawBootAnimation()
{
  tft.fillScreen(ST77XX_BLACK);

  tft.setTextSize(3);
  tft.setTextColor(ST77XX_CYAN);

  // centro horizontal aproximado
  tft.setCursor(60, 100);
  tft.println("ARGUS");

  // linha animada simples
  for (int i = 0; i < 255; i += 20)
  {
    tft.setTextColor(tft.color565(0, i, i));
    tft.setCursor(60, 100);
    tft.println("ARGUS");
    delay(50);
  }

  delay(800);

  tft.fillScreen(ST77XX_BLACK);
}