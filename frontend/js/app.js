let mediaRecorder;
let audioChunks = [];
let typingDiv = null;
let isRecording = false;

// 🔥 URL do n8n
const API_URL = "http://192.168.1.70:5678/webhook/voicev3";

// SESSION
let sessionId = localStorage.getItem("sessionId");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("sessionId", sessionId);
}

// UI helpers
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
  if (typingDiv) return;
  typingDiv = document.createElement("div");
  typingDiv.className = "msg ai typing";
  typingDiv.innerText = "🤖 A pensar...";
  document.getElementById("chat").appendChild(typingDiv);
}

function removeTyping() {
  if (typingDiv) {
    typingDiv.remove();
    typingDiv = null;
  }
}

function fixSpacing(text) {
  return text
    .replace(/([.,!?])([^\s])/g, "$1 $2")
    .replace(/([a-zà-ÿ])([A-ZÀ-Ý])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

// ⚡ efeito typing
function typeMessage(text) {
  const div = document.createElement("div");
  div.className = "msg ai";
  document.getElementById("chat").appendChild(div);

  let i = 0;

  function typing() {
    if (i <= text.length) {
      div.textContent = text.slice(0, i);
      i++;
      setTimeout(typing, 10);
    }
  }

  typing();
}

function resetSession() {
  localStorage.removeItem("sessionId");
  location.reload();
}

// 🎤 GRAVAÇÃO COM VAD
document.getElementById("recordBtn").onclick = async function () {
  if (isRecording) return;
  isRecording = true;

  const btn = this;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];

    let silenceTimer;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    source.connect(analyser);
    analyser.fftSize = 512;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function detectSilence() {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      if (volume < 10) {
        if (!silenceTimer) {
          silenceTimer = setTimeout(stopRecording, 1200);
        }
      } else {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }

      if (isRecording) requestAnimationFrame(detectSilence);
    }

    function stopRecording() {
      if (!isRecording) return;

      isRecording = false;
      mediaRecorder.stop();

      stream.getTracks().forEach(track => track.stop());

      btn.classList.remove("recording");
      setStatus("⏳ A processar...");
    }

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = sendAudio;

    mediaRecorder.start();
    btn.classList.add("recording");

    setStatus("🎤 Fala à vontade...");
    addMessage("🎤 ...", "user");

    detectSilence();

    setTimeout(stopRecording, 6000);

  } catch (err) {
    console.error(err);
    setStatus("❌ Erro no microfone");
    isRecording = false;
  }
};

// 🚀 ENVIO (STREAMING + HEADERS)
async function sendAudio() {
  showTyping();

  const blob = new Blob(audioChunks, { type: "audio/webm" });

  const formData = new FormData();
  formData.append("file", blob, "audio.webm");
  formData.append("sessionId", sessionId);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 🔥 HEADERS (AGORA TEXTO DIRETO — SEM atob)
    const userText = response.headers.get("X-User-Text");
    const reply = response.headers.get("X-AI-Reply");

    // 🔊 AUDIO
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
console.log("USER:", userText);
console.log("AI:", reply);

for (let [key, value] of response.headers.entries()) {
  console.log(key, value);
}

    removeTyping();

    // 👤 USER TEXT
    if (userText) {
      const lastMsg = document.querySelector(".msg.user:last-child");

      if (lastMsg && lastMsg.innerText === "🎤 ...") {
        lastMsg.innerText = userText;
      } else {
        addMessage(userText, "user");
      }
    }

    // 🤖 AI REPLY
    if (reply) {
      typeMessage(fixSpacing(reply));
    }

    // 🔊 PLAYER
    const player = document.getElementById("player");

    player.pause();
    player.currentTime = 0;

    if (window.currentAudioUrl) {
      URL.revokeObjectURL(window.currentAudioUrl);
    }

    window.currentAudioUrl = audioUrl;

    player.src = audioUrl;
    player.style.display = "block";
    player.controls = true;

    player.scrollIntoView({ behavior: "smooth" });

    player.play().catch(err =>
      console.warn("Audio play error:", err)
    );

    player.onended = () => {
      setStatus("✅ Pronto");
    };

  } catch (err) {
    console.error(err);
    removeTyping();
    setStatus("❌ Falha na comunicação");
  }
}

// ⌨️ TEXTO fallback
async function sendVoice(text) {
  showTyping();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        sessionId
      })
    });

    if (!res.ok) throw new Error("HTTP error");

    const reply = res.headers.get("X-AI-Reply");

    removeTyping();

    if (reply) {
      typeMessage(fixSpacing(reply));
    }

  } catch (err) {
    console.error(err);
    removeTyping();
    setStatus("❌ Falha");
  }
}