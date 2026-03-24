let mediaRecorder;
let audioChunks = [];
let typingDiv = null;

// CONFIG
const API_URL = "http://192.168.1.70:5678/webhook/voice";

// SESSION
let sessionId = localStorage.getItem("sessionId");

if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("sessionId", sessionId);
}

function resetSession() {
  localStorage.removeItem("sessionId");
  location.reload();
}

function setStatus(text) {
  document.getElementById("status").innerText = text;
}

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.innerText = text;
  document.getElementById("chat").appendChild(div);
  div.scrollIntoView({ behavior: "smooth" });
}

function showTyping() {
  typingDiv = document.createElement("div");
  typingDiv.className = "msg ai typing";
  typingDiv.innerText = "🤖 A pensar...";
  document.getElementById("chat").appendChild(typingDiv);
}

function removeTyping() {
  if (typingDiv) typingDiv.remove();
}

// 🎙 botão gravação
document.getElementById("recordBtn").onclick = async function () {
  const btn = this;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  audioChunks = [];

  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = sendAudio;

  mediaRecorder.start();
  btn.classList.add("recording");

  setStatus("🎤 A gravar...");

  setTimeout(() => {
    mediaRecorder.stop();
    btn.classList.remove("recording");
    }, 4000);
};

async function sendAudio() {
  setStatus("⏳ A enviar...");
  showTyping();

  const blob = new Blob(audioChunks, { type: 'audio/webm' });

  const formData = new FormData();
  formData.append("file", blob, "audio.webm");
  formData.append("sessionId", sessionId);

  try {
      const response = await fetch(API_URL, {
      method: "POST",
      body: formData
    });


    if (!response.ok) {
      setStatus("❌ Erro no servidor");
      removeTyping();
      return;
    }

    let payload;
    try {
      const data = await response.json();
      payload = Array.isArray(data) ? data[0] : data;
      if (payload.json) payload = payload.json;
    } catch {
      setStatus("❌ Resposta inválida");
      removeTyping();
      return;
    }

    removeTyping();

    if (payload.userText) addMessage(payload.userText, "user");
    if (payload.aiText) addMessage(payload.aiText, "ai");

    if (payload.audio) {
      setStatus("🔊 A falar...");

      const byteCharacters = atob(payload.audio);
      const byteArray = new Uint8Array([...byteCharacters].map(c => c.charCodeAt(0)));

      const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const player = document.getElementById("player");

      player.pause();
      player.currentTime = 0;

      player.src = audioUrl;
      player.style.display = "block";

      player.onended = () => setStatus("✅ Pronto");

      await player.play();
    }


  } catch (err) {
    console.error(err);
    removeTyping();
    setStatus("❌ Falha na comunicação");
  }
}
