#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

#include "config.h"
#include "mic.h"
#include "api.h"
#include "tft.h"
#include "speaker.h"

// ================= AUDIO =================
int16_t pcmBuffer[SAMPLES];
int16_t audioBuffer[MAX_BUFFER];
int audioIndex = 0;

// ================= UI =================
enum UiState {
  UI_IDLE,
  UI_LISTENING,
  UI_PROCESSING
};

UiState currentUiState = UI_IDLE;
UiState lastUiState = UI_IDLE;

// ================= TIMING =================
unsigned long lastSpeakingTime = 0;

#define MIN_AUDIO_SAMPLES 6000

// ================= MQTT =================
WiFiClient espClient;
PubSubClient client(espClient);

// 🔹 Forward declaration
void playAudioFromURL(String url);

// 🔹 MQTT callback
void callback(char* topic, byte* payload, unsigned int length) {
  String msg;

  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  Serial.println("MQTT RX: " + msg);

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, msg);

  if (error) {
    Serial.println("JSON parse failed");
    return;
  }

  String text = doc["text"] | "";
  String audioUrl = doc["audio_url"] | "";

  Serial.println("🤖 " + text);

  // 🔥 UI
  if (text.length() > 0) {
    tft_show_chat("", text);
  }

  delay(150);

  // 🔊 áudio via URL
  if (audioUrl.length() > 0 && audioUrl.startsWith("http")) {
    playAudioFromURL(audioUrl);
  }
}

// 🔹 tocar áudio via HTTP
void playAudioFromURL(String url) {
  HTTPClient http;
  WiFiClient stream;

  Serial.println("🌐 GET: " + url);

  http.begin(stream, url);
  int httpCode = http.GET();

  if (httpCode == 200) {
    Serial.println("🔊 Streaming audio...");
    speaker_play(stream);
  } else {
    Serial.printf("❌ HTTP error: %d\n", httpCode);
  }

  http.end();
}

// 🔹 setup MQTT
void setupMQTT() {
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setBufferSize(40000);
  client.setCallback(callback);
}

// 🔹 reconnect MQTT
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.println("Connecting MQTT...");

    if (client.connect(MQTT_CLIENT_ID)) {
      Serial.println("MQTT connected");
      client.subscribe("argus/voice/output");
    } else {
      Serial.print("MQTT failed, rc=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

// ================= SETUP =================
void setup()
{
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(500);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");

  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(300);
    Serial.print(".");

    // 🔥 ALIMENTA WATCHDOG
    yield();

    // 🔥 TIMEOUT (CRÍTICO)
    if (millis() - start > 10000)
    {
      Serial.println("\n❌ WiFi timeout");
      break;
    }
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("\n✅ Connected!");
    Serial.println(WiFi.localIP());
  }
  else
  {
    Serial.println("\n❌ Failed to connect");
    Serial.println(WiFi.status());
  }

  // TFT
  tft_setup();
  drawBootAnimation();
  tft_clear();

  // MIC
  mic_setup();

  Serial.println("🎤 READY");

  // MQTT
  setupMQTT();
}

// ================= UI =================
void updateUI(UiState newState)
{
  currentUiState = newState;

  if (newState != lastUiState)
  {
    tft_clear();
    lastUiState = newState;
  }

  switch (newState)
  {
    case UI_LISTENING:
      tft_listening();
      break;

    case UI_PROCESSING:
      tft_processing();
      break;

    default:
      break;
  }
}

// ================= LOOP =================
void loop()
{
  // MQTT primeiro
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  int samples = 0;
  bool isSpeaking = false;

  mic_process(pcmBuffer, &samples, &isSpeaking);

  static int silenceFrames = 0;
  static int speechFrames = 0;

  // UI
  if (isSpeaking || audioIndex == 0)
  {
    updateUI(UI_LISTENING);
  }

  // ================= CAPTURA =================
  if (isSpeaking)
  {
    speechFrames++;
    silenceFrames = 0;

    lastSpeakingTime = millis();

    for (int i = 0; i < samples; i++)
    {
      if (audioIndex < MAX_BUFFER)
      {
        audioBuffer[audioIndex++] = pcmBuffer[i];
      }
    }
  }
  else
  {
    silenceFrames++;
  }

  // ================= DETECÇÃO FIM DE FRASE =================
  bool speechStarted = speechFrames > 8;     // houve fala real
  bool silenceEnough = silenceFrames > 30;   // silêncio consistente (~500ms)

  if (speechStarted && silenceEnough && audioIndex > MIN_AUDIO_SAMPLES)
  {
    Serial.printf("🎤 Sending %d samples\n", audioIndex);

    updateUI(UI_PROCESSING);

    api_send(audioBuffer, audioIndex);

    // reset
    audioIndex = 0;
    speechFrames = 0;
    silenceFrames = 0;
  }

  // ================= SEGURANÇA BUFFER =================
  if (audioIndex >= MAX_BUFFER)
  {
    Serial.println("⚠️ Buffer cheio, envio forçado");

    api_send(audioBuffer, audioIndex);

    audioIndex = 0;
    speechFrames = 0;
    silenceFrames = 0;
  }
}