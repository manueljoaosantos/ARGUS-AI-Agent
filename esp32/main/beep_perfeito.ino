#include <driver/i2s.h>
#include <math.h>
 
// --- Pin Definitions ---
#define I2S_BCK 5
#define I2S_LRC 6
#define I2S_DOUT 7
 
#define SAMPLE_RATE 44100
#define I2S_NUM I2S_NUM_0
#define WAVE_FREQ_HZ 440
#define VOLUME 0.2

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("BOOT OK");

  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 64,
    .use_apll = false
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_BCK,
    .ws_io_num = I2S_LRC,
    .data_out_num = I2S_DOUT,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  i2s_driver_install(I2S_NUM, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_NUM, &pin_config);

  Serial.println("I2S OK - Playing tone");
}

void loop() {
  int16_t samples[128];
  static float phase = 0;

  for (int i = 0; i < 128; i++) {
    float output = sin(phase) * 32767 * VOLUME;
    phase += 2 * PI * WAVE_FREQ_HZ / SAMPLE_RATE;

    if (phase >= 2 * PI) phase -= 2 * PI;

    samples[i] = (int16_t)output;
  }

  size_t bytes_written;
  i2s_write(I2S_NUM, samples, sizeof(samples), &bytes_written, portMAX_DELAY);
}