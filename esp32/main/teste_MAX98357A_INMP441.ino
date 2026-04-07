#include "driver/i2s_std.h"

#define SAMPLE_RATE 16000

// 🔊 SPEAKER (TX)
#define SPK_BCLK GPIO_NUM_8
#define SPK_WS   GPIO_NUM_7
#define SPK_DOUT GPIO_NUM_9

// 🎤 MICRO (RX)
#define MIC_BCLK GPIO_NUM_5
#define MIC_WS   GPIO_NUM_4
#define MIC_DIN  GPIO_NUM_6

i2s_chan_handle_t tx_handle;
i2s_chan_handle_t rx_handle;

void setup() {

  Serial.begin(115200);
  Serial.println("START LOOPBACK");

  // =========================
  // 🔊 SPEAKER (TX)
  // =========================
  i2s_chan_config_t tx_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_0, I2S_ROLE_MASTER);
  i2s_new_channel(&tx_cfg, &tx_handle, NULL);

  i2s_std_config_t tx_std_cfg = {
    .clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(SAMPLE_RATE),
    .slot_cfg = I2S_STD_MSB_SLOT_DEFAULT_CONFIG(
      I2S_DATA_BIT_WIDTH_16BIT,
      I2S_SLOT_MODE_STEREO
    ),
    .gpio_cfg = {
      .mclk = I2S_GPIO_UNUSED,
      .bclk = SPK_BCLK,
      .ws   = SPK_WS,
      .dout = SPK_DOUT,
      .din  = I2S_GPIO_UNUSED
    }
  };

  i2s_channel_init_std_mode(tx_handle, &tx_std_cfg);
  i2s_channel_enable(tx_handle);

  // =========================
  // 🎤 MICRO (RX)
  // =========================
  i2s_chan_config_t rx_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_1, I2S_ROLE_MASTER);
  i2s_new_channel(&rx_cfg, NULL, &rx_handle);

  i2s_std_config_t rx_std_cfg = {
    .clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(SAMPLE_RATE),
    .slot_cfg = I2S_STD_MSB_SLOT_DEFAULT_CONFIG(
      I2S_DATA_BIT_WIDTH_32BIT,
      I2S_SLOT_MODE_MONO
    ),
    .gpio_cfg = {
      .mclk = I2S_GPIO_UNUSED,
      .bclk = MIC_BCLK,
      .ws   = MIC_WS,
      .dout = I2S_GPIO_UNUSED,
      .din  = MIC_DIN
    }
  };

  i2s_channel_init_std_mode(rx_handle, &rx_std_cfg);
  i2s_channel_enable(rx_handle);

  Serial.println("LOOPBACK READY 🔥");
}

void loop() {

  int32_t mic_buffer[256];   // micro 32-bit
  int16_t spk_buffer[256];   // speaker 16-bit

  size_t bytes_read, bytes_written;

  // 🎤 ler micro
  i2s_channel_read(rx_handle, mic_buffer, sizeof(mic_buffer), &bytes_read, portMAX_DELAY);

  // converter 32 → 16 bit
  for (int i = 0; i < 256; i++) {
    spk_buffer[i] = mic_buffer[i] >> 14; // ajuste ganho
  }

  // 🔊 enviar para speaker
  i2s_channel_write(tx_handle, spk_buffer, sizeof(spk_buffer), &bytes_written, portMAX_DELAY);
}