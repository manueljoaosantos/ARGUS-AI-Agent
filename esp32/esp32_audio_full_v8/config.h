#include "api.h"
#include "config.h"
#include "wav.h"
#include "speaker.h"
#include "tft.h"

#include <WiFi.h>
#include "mbedtls/base64.h"

// ================= BASE64 =================
String base64Decode(String input)
{
  size_t outputLen;
  unsigned char output[1024];

  if (mbedtls_base64_decode(output, sizeof(output), &outputLen,
                            (const unsigned char*)input.c_str(), input.length()) != 0)
  {
    return "";
  }

  return String((char*)output).substring(0, outputLen);
}

// ================= API SEND =================
void api_send(int16_t