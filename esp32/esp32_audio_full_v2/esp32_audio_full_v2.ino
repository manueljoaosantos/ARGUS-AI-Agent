#include <WiFi.h>
#include <driver/i2s.h>
#include "mbedtls/base64.h"
#include "secrets.h"

// ================= CONFIG =================
#define API_HOST "192.168.1.70"
#define API_PORT 3001

// ================= STATES =================
enum State { IDLE, RECORDING, SENDING, PLAYING };
State state = IDLE;

// ================= PINS =================
#define MIC_BCLK GPIO_NUM_9
#define MIC_WS   GPIO_NUM_4
#define MIC_DIN  GPIO_NUM_10

#define SPK_BCLK GPIO_NUM_5
#define SPK_WS   GPIO_NUM_6
#define SPK_DOUT GPIO_NUM_7

#define I2S_MIC I2S_NUM_0
#define I2S_SPK I2S_NUM_1

// ================= AUDIO =================
#define SAMPLES 512
#define MAX_BUFFER 48000  // 🔥 garante >= 3s

int32_t rawBuffer[SAMPLES];
int16_t pcmBuffer[SAMPLES];
int16_t audioBuffer[MAX_BUFFER];

int bufferIndex = 0;

// ================= VAD =================
float noiseFloor = 50;

unsigned long lastVoiceTime = 0;
unsigned long speechStartTime = 0;

#define MIN_RECORD_MS 3000
#define SILENCE_MS    700

// ================= BASE64 =================
String decodeBase64(String input) {
  size_t len;
  unsigned char out[512];

  mbedtls_base64_decode(out, sizeof(out), &len,
    (const unsigned char*)input.c_str(), input.length());

  return String((char*)out, len);
}

// ================= WAV HEADER =================
void writeWavHeader(uint8_t* b, int dataSize) {

  int sampleRate = 16000;
  int bitsPerSample = 16;
  int channels = 1;

  int byteRate = sampleRate * channels * bitsPerSample / 8;
  int blockAlign = channels * bitsPerSample / 8;
  int chunkSize = 36 + dataSize;

  memcpy(b, "RIFF", 4);
  b[4] = chunkSize & 0xff;
  b[5] = (chunkSize >> 8) & 0xff;
  b[6] = (chunkSize >> 16) & 0xff;
  b[7] = (chunkSize >> 24) & 0xff;

  memcpy(b + 8, "WAVE", 4);
  memcpy(b + 12, "fmt ", 4);

  b[16]=16; b[17]=0; b[18]=0; b[19]=0;
  b[20]=1;  b[21]=0;
  b[22]=1;  b[23]=0;

  b[24]=sampleRate & 0xff;
  b[25]=(sampleRate>>8)&0xff;
  b[26]=(sampleRate>>16)&0xff;
  b[27]=(sampleRate>>24)&0xff;

  b[28]=byteRate & 0xff;
  b[29]=(byteRate>>8)&0xff;
  b[30]=(byteRate>>16)&0xff;
  b[31]=(byteRate>>24)&0xff;

  b[32]=blockAlign & 0xff;
  b[33]=(blockAlign>>8)&0xff;

  b[34]=bitsPerSample & 0xff;
  b[35]=(bitsPerSample>>8)&0xff;

  memcpy(b + 36, "data", 4);

  b[40]=dataSize & 0xff;
  b[41]=(dataSize>>8)&0xff;
  b[42]=(dataSize>>16)&0xff;
  b[43]=(dataSize>>24)&0xff;
}

// ================= MIC =================
void setupMic() {

  i2s_config_t config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S_MSB,
    .dma_buf_count = 8,
    .dma_buf_len = 256
  };

  i2s_pin_config_t pins = {
    .bck_io_num = MIC_BCLK,
    .ws_io_num = MIC_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = MIC_DIN
  };

  i2s_driver_install(I2S_MIC, &config, 0, NULL);
  i2s_set_pin(I2S_MIC, &pins);
}

// ================= SPEAKER =================
void setupSpeaker() {

  i2s_config_t config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S_MSB,
    .dma_buf_count = 8,
    .dma_buf_len = 256
  };

  i2s_pin_config_t pins = {
    .bck_io_num = SPK_BCLK,
    .ws_io_num = SPK_WS,
    .data_out_num = SPK_DOUT,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  i2s_driver_install(I2S_SPK, &config, 0, NULL);
  i2s_set_pin(I2S_SPK, &pins);
}

// ================= PLAY =================
void playWav(WiFiClient &client) {

  Serial.println("🔊 Playing WAV...");

  uint8_t buf[1024];
  size_t written;
  bool headerSkipped = false;

  while (client.connected() || client.available()) {

    int len = client.read(buf, sizeof(buf));

    if (len > 0) {

      if (!headerSkipped) {
        if (len > 44) {
          i2s_write(I2S_SPK, buf + 44, len - 44, &written, portMAX_DELAY);
          headerSkipped = true;
        }
      } else {
        i2s_write(I2S_SPK, buf, len, &written, portMAX_DELAY);
      }
    }
  }

  Serial.println("🔇 Done");
}

// ================= SEND =================
void sendToAPI(int16_t* data, int samples) {

  state = SENDING;

  int dataSize = samples * 2;

  uint8_t header[44];
  writeWavHeader(header, dataSize);

  String boundary = "----ESP32";

  String head =
    "--" + boundary + "\r\n"
    "Content-Disposition: form-data; name=\"file\"; filename=\"audio.wav\"\r\n"
    "Content-Type: audio/wav\r\n\r\n";

  String tail = "\r\n--" + boundary + "--\r\n";

  int totalSize = head.length() + 44 + dataSize + tail.length();

  WiFiClient client;

  if (!client.connect(API_HOST, API_PORT)) {
    Serial.println("❌ Connection failed");
    state = IDLE;
    return;
  }

  Serial.printf("📦 Sending MULTIPART (%d bytes)\n", totalSize);

  client.println("POST /api/voice HTTP/1.1");
  client.println("Host: " API_HOST);
  client.println("Content-Type: multipart/form-data; boundary=" + boundary);
  client.println("Content-Length: " + String(totalSize));
  client.println("Connection: close");
  client.println();

  client.write((uint8_t*)head.c_str(), head.length());
  client.write(header, 44);
  client.write((uint8_t*)data, dataSize);
  client.write((uint8_t*)tail.c_str(), tail.length());

  Serial.println("⏳ Waiting response...");

  bool ok = false;

  while (client.connected()) {
    String line = client.readStringUntil('\n');
    if (line == "\r") break;

    line.trim();
    Serial.println(line);

    if (line.startsWith("HTTP/1.1 200")) ok = true;
  }

  if (ok) {
    setupSpeaker();
    playWav(client);
    i2s_driver_uninstall(I2S_SPK);
  }

  client.stop();

  state = IDLE;
  Serial.println("🎤 READY");
}

// ================= SETUP =================
void setup() {

  Serial.begin(115200);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }

  Serial.println("\n✅ WiFi CONNECTED");

  setupMic();

  Serial.println("🎤 READY");
}

// ================= LOOP =================
void loop() {

  if (state != IDLE && state != RECORDING) return;

  size_t bytesRead = 0;
  i2s_read(I2S_MIC, rawBuffer, sizeof(rawBuffer), &bytesRead, portMAX_DELAY);

  int samplesRead = bytesRead / sizeof(int32_t);

  long sum = 0;

  for (int i = 0; i < samplesRead; i++) {

    int32_t raw = rawBuffer[i];
    raw = raw >> 8;
    int16_t sample = raw >> 8;

    pcmBuffer[i] = sample;

    sum += abs(sample);
  }

  float avg = (float)sum / samplesRead;

  // 🔥 VAD
  noiseFloor = (noiseFloor * 0.98) + (avg * 0.02);

  float startThreshold = noiseFloor * 2.5;
  float endThreshold   = noiseFloor * 1.5;

  bool voiceStart = avg > startThreshold;
  bool voiceEnd   = avg > endThreshold;

  if (voiceStart) {
    lastVoiceTime = millis();

    if (state == IDLE) {
      Serial.println("🎙️ START");
      state = RECORDING;
      bufferIndex = 0;
      speechStartTime = millis();
    }
  }

  if (state == RECORDING) {

    for (int i = 0; i < samplesRead && bufferIndex < MAX_BUFFER; i++) {
      audioBuffer[bufferIndex++] = pcmBuffer[i];
    }

    if (voiceEnd) {
      lastVoiceTime = millis();
    }

    unsigned long now = millis();

    bool minTime = (now - speechStartTime) > MIN_RECORD_MS;
    bool silence = (now - lastVoiceTime) > SILENCE_MS;

    if (minTime && silence) {

      Serial.println("🛑 END");

      if (bufferIndex > 2000) {
        sendToAPI(audioBuffer, bufferIndex);
      }

      state = IDLE;
    }
  }
}