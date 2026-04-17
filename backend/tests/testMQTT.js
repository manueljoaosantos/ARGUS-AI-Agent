import mqtt from "mqtt";

const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  console.log("Connected to MQTT");
console.log("TESTE:", "Olá 👁️");
  client.subscribe("argus/#");

  client.publish("argus/voice/input", JSON.stringify({
    text: "Olá ARGUS",
    device: "test-device"
  }));
});

client.on("message", (topic, message) => {
  console.log("RX:", topic, message.toString("utf8"));
});