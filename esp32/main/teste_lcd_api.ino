#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "Audio.h"
#include "secrets.h"

#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>

// ================= LOG =================
#define LOG(x) Serial.println(x)
#define LOGF(...) Serial.printf(__VA_ARGS__)

// TFT
#define TFT_MOSI 11
#define TFT_SCLK 12
#define TFT_CS   14
#define TFT_DC   13
#define TFT_RST  -1

Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RST);

// AUDIO
#define I2S_BCK 5
#define I2S_LRC 6
#define I2S_DOUT 7

Audio* audio = nullptr;

const char* server = "http://192.168.1.70:3001/api/voice";

// ===== ESTADO =====
enum AudioState { IDLE, PLAY_QUESTION, PLAY_ANSWER };
AudioState audioState = IDLE;

bool isRequesting = false;
unsigned long lastRequest = 0;

String pendingQuestion = "";
String pendingAnswer = "";

// ===== TIMERS =====
unsigned long idleTimer = 0;
unsigned long audioAnimTimer = 0;

// ===== CIDADES 🇵🇹 =====
const char* cidades[] = {
  "Lisboa","Porto","Braga","Viseu","Aveiro","Coimbra",
  "Leiria","Faro","Setubal","Evora","Santarem",
  "Viana do Castelo","Guarda","Castelo Branco",
  "Beja","Braganca","Portalegre"
};
int totalCidades = sizeof(cidades) / sizeof(cidades[0]);

// ---------------- UTF8 → LATIN1 ----------------
String utf8ToLatin1(String input) {
  String output = "";

  for (int i = 0; i < input.length(); i++) {
    uint8_t c = input[i];

    if (c == 0xC3 && i + 1 < input.length()) {
      uint8_t c2 = input[i + 1];

      switch (c2) {
        case 0xA1: output += char(0xE1); break;
        case 0xA9: output += char(0xE9); break;
        case 0xAD: output += char(0xED); break;
        case 0xB3: output += char(0xF3); break;
        case 0xBA: output += char(0xFA); break;
        case 0xA3: output += char(0xE3); break;
        case 0xB5: output += char(0xF5); break;
        case 0xA7: output += char(0xE7); break;
        default: output += '?'; break;
      }
      i++;
    } else {
      output += (char)c;
    }
  }

  return output;
}

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  LOG("=== ARGUS BOOT ===");

  SPI.begin(TFT_SCLK, -1, TFT_MOSI, TFT_CS);
  tft.init(240, 320);
  tft.setRotation(3);

  drawBootAnimation();

  LOG("Connecting WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }

  LOG("\nWiFi OK");
  LOG(WiFi.localIP());

  randomSeed(micros());

  audio = new Audio();
  audio->setPinout(I2S_BCK, I2S_LRC, I2S_DOUT);
  audio->setVolume(20);
}

// ---------------- LOOP ----------------
void loop() {

  if (audio != nullptr) {
    audio->loop();

    if (audio->isRunning()) {
      drawAudioBars();
    }

    if (!audio->isRunning() && isRequesting) {

      if (audioState == PLAY_QUESTION) {
        audioState = PLAY_ANSWER;
        delay(200);
        playAudio(pendingAnswer);
        return;
      }

      if (audioState == PLAY_ANSWER) {
        delay(1500);

        audioState = IDLE;
        isRequesting = false;
        lastRequest = millis();

        tft.fillScreen(ST77XX_BLACK);
      }
    }
  }

  if (!isRequesting && !audio->isRunning() && audioState == IDLE) {
    drawNeuralIdle();
  }

  if (!isRequesting && !audio->isRunning() && millis() - lastRequest > 15000) {
    isRequesting = true;
    perguntarAleatorio();
  }
}

// ---------------- PERGUNTAR ----------------
void perguntarAleatorio() {
  int idx = random(totalCidades);
  String cidade = cidades[idx];

  String pergunta = "Como está o tempo em " + cidade + "?";
  perguntar(pergunta);
}

void perguntar(String pergunta) {

  tft.fillScreen(ST77XX_BLACK);
  drawVoiceUI(pergunta, "...");

  HTTPClient http;

  String url = String(server) + "?text=" + urlencode(pergunta);

  http.setReuse(false);
  http.setTimeout(8000);
  http.begin(url);
  http.addHeader("Connection", "close");

  const char* headers[] = {"X-User-Text","X-AI-Reply"};
  http.collectHeaders(headers, 2);

  int code = http.GET();

  if (code > 0) {

    String userText = utf8ToLatin1(base64Decode(http.header("X-User-Text")));
    String replyText = utf8ToLatin1(base64Decode(http.header("X-AI-Reply")));

    drawVoiceUI(userText, replyText);

    http.end();
    delay(300);

    pendingQuestion = userText;
    pendingAnswer = replyText;

    audioState = PLAY_QUESTION;
    playAudio(pendingQuestion);

  } else {

    http.end();
    drawErrorAnimation();

    delay(4000);

    isRequesting = false;
    lastRequest = millis();
  }
}

// ---------------- AUDIO ----------------
void playAudio(String text) {

  if (audio->isRunning()) {
    audio->stopSong();
    delay(200);
  }

  String url = String(server) + "?text=" + urlencode(text) + "&tts=1";
  audio->connecttohost(url.c_str());
}

// ---------------- URL ENCODE ----------------
String urlencode(String str) {
  String encoded = "";
  char hex[4];

  for (int i = 0; i < str.length(); i++) {
    char c = str.charAt(i);

    if (isalnum(c)) encoded += c;
    else {
      sprintf(hex, "%%%02X", (unsigned char)c);
      encoded += hex;
    }
  }

  return encoded;
}

// ---------------- AUDIO BARS ----------------
void drawAudioBars() {
  if (millis() - audioAnimTimer < 80) return;
  audioAnimTimer = millis();

  int baseY = 300;

  for (int i = 0; i < 10; i++) {
    int x = 15 + i * 20;

    tft.fillRect(x, baseY - 60, 10, 60, ST77XX_BLACK);

    int h = random(10, 55);
    uint16_t color = tft.color565(0, random(150,255), random(50,200));

    tft.fillRect(x, baseY - h, 10, h, color);
  }
}

// ---------------- IDLE ----------------
void drawNeuralIdle() {
  if (millis() - idleTimer < 200) return;
  idleTimer = millis();

  tft.fillRect(0, 100, tft.width(), 120, ST77XX_BLACK);

  int nodes = 6;
  int x[6], y[6];

  for (int i = 0; i < nodes; i++) {
    x[i] = random(tft.width());
    y[i] = random(100, 220);
    tft.fillCircle(x[i], y[i], 2, ST77XX_CYAN);
  }

  for (int i = 0; i < nodes; i++) {
    int j = random(nodes);
    tft.drawLine(x[i], y[i], x[j], y[j], tft.color565(0, 50, random(100,255)));
  }
}

// ---------------- BOOT ----------------
void drawBootAnimation() {

  tft.fillScreen(ST77XX_BLACK);

  for (int i = 0; i < 255; i += 20) {
    tft.setTextColor(tft.color565(0, i, i));
    tft.setTextSize(3);
    tft.setCursor(40, 60);
    tft.println("ARGUS");
    delay(40);
  }

  tft.setTextSize(2);
  tft.setCursor(90, 100);
  tft.setTextColor(ST77XX_CYAN);
  tft.println("AI");

  for (int i = 0; i < tft.width(); i += 5) {
    tft.fillRect(0, 150, i, 8, ST77XX_GREEN);
    delay(10);
  }

  tft.setTextSize(1);
  tft.setCursor(50, 300);
  tft.setTextColor(ST77XX_WHITE);
  tft.println("by Manuel Joao");

  delay(800);
}

// ---------------- ERROR ----------------
void drawErrorAnimation() {
  tft.fillScreen(ST77XX_BLACK);

  tft.setTextColor(ST77XX_RED);
  tft.setTextSize(2);
  tft.setCursor(70, 100);
  tft.println("ERROR");

  for (int i = 0; i < 3; i++) {
    tft.fillCircle(120, 180, 10, ST77XX_RED);
    delay(200);
    tft.fillCircle(120, 180, 10, ST77XX_BLACK);
    delay(200);
  }
}

// ---------------- UI ----------------
void drawVoiceUI(String pergunta, String resposta) {

  tft.fillScreen(ST77XX_BLACK);

  tft.setTextSize(2);
  tft.setTextColor(ST77XX_CYAN);
  tft.setCursor(60, 10);
  tft.println("ARGUS AI");

  tft.setTextColor(ST77XX_YELLOW);
  tft.setCursor(10, 50);
  tft.println("Pergunta:");
  drawWrappedText(pergunta, 10, 70, ST77XX_WHITE);

  tft.setTextColor(ST77XX_GREEN);
  tft.setCursor(10, 150);
  tft.println("Resposta:");
  drawWrappedText(resposta, 10, 170, ST77XX_WHITE);
}

// ---------------- WRAP ----------------
void drawWrappedText(String text, int x, int y, uint16_t color) {
  tft.setTextColor(color);
  tft.setTextSize(2);

  String line = "";
  int cursorY = y;

  for (int i = 0; i < text.length(); i++) {
    line += text[i];

    int16_t x1, y1;
    uint16_t w, h;
    tft.getTextBounds(line, 0, 0, &x1, &y1, &w, &h);

    if (w > tft.width() - 20) {
      tft.setCursor(x, cursorY);
      tft.println(line);
      line = "";
      cursorY += h + 5;
    }
  }

  if (line.length() > 0) {
    tft.setCursor(x, cursorY);
    tft.println(line);
  }
}

// ---------------- BASE64 ----------------
String base64Decode(String input) {
  const char* chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  String output = "";
  int val = 0, valb = -8;

  for (int i = 0; i < input.length(); i++) {
    char c = input[i];
    if (c == '=' || c == '\n') break;

    const char* p = strchr(chars, c);
    if (!p) continue;

    val = (val << 6) + (p - chars);
    valb += 6;

    if (valb >= 0) {
      output += char((val >> valb) & 0xFF);
      valb -= 8;
    }
  }

  return output;
}
