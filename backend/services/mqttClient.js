import mqtt from "mqtt";

const client = mqtt.connect(process.env.MQTT_URL || "mqtt://localhost:1883");

let handleVoiceInput = async () => {};
let handleEvent = async () => {};

client.on("connect", () => {
  console.log("MQTT connected");
  client.subscribe("argus/#");
});

client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    if (topic === "argus/voice/input") {
      await handleVoiceInput(data);
    }

    if (topic === "argus/event") {
      await handleEvent(data);
    }

  } catch (err) {
    console.error("MQTT error:", err);
  }
});

function registerHandlers(handlers) {
  handleVoiceInput = handlers.handleVoiceInput;
  handleEvent = handlers.handleEvent;
}

function publish(topic, data) {
  client.publish(topic, JSON.stringify(data));
}

export default {
  client,
  publish,
  registerHandlers
};