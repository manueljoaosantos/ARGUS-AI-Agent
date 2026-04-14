#include "speaker.h"
#include "config.h"
#include <driver/i2s.h>

void speaker_play(WiFiClient &client)
{

  i2s_config_t config = {
      .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
      .sample_rate = SAMPLE_RATE,
      .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
      .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
      .communication_format = I2S_COMM_FORMAT_I2S_MSB,
      .dma_buf_count = 8,
      .dma_buf_len = 256};

  i2s_pin_config_t pins = {
      .bck_io_num = SPK_BCLK,
      .ws_io_num = SPK_WS,
      .data_out_num = SPK_DOUT,
      .data_in_num = I2S_PIN_NO_CHANGE};

  i2s_driver_install(I2S_SPK, &config, 0, NULL);
  i2s_set_pin(I2S_SPK, &pins);

  uint8_t buf[1024];
  size_t written;
  bool headerSkipped = false;

  while (client.connected() || client.available())
  {

    int len = client.read(buf, sizeof(buf));

    if (len > 0)
    {

      if (!headerSkipped && len > 44)
      {
        i2s_write(I2S_SPK, buf + 44, len - 44, &written, portMAX_DELAY);
        headerSkipped = true;
      }
      else
      {
        i2s_write(I2S_SPK, buf, len, &written, portMAX_DELAY);
      }
    }
  }

  i2s_driver_uninstall(I2S_SPK);
}