let mediaRecorder;
let audioChunks = [];
let typingDiv = null;

// 🔥 podes trocar entre backend ou n8n direto
const API_URL = "http://192.168.1.70:5678/webhook/voicev2";
// const API_URL = "http://192.168.1.70:3000/api/voice";

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
  typingDiv = document.createElement("div");
  typingDiv.className = "msg ai typing";
  typingDiv.innerText = "🤖 A pensar...";
  document.getElementById("chat").appendChild(typingDiv);
}

function removeTyping() {
  if (typingDiv) typingDiv.remove();
}

function fixSpacing(text) {
  return text
    // espaço após pontuação
    .replace(/([.,!?])([^\s])/g, "$1 $2")

    // separar palavras coladas comuns (heurística)
    .replace(/([a-zà-ÿ])([A-ZÀ-Ý])/g, "$1 $2")

    // separar casos tipo "Comoestás" → "Como estás"
    .replace(/([a-zà-ÿ])(?=[A-ZÀ-Ý])/g, "$1 ")

    // limpar espaços duplicados
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
        div.textContent = text.slice(0, i); // 🔥 diferença CRÍTICA
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
  const btn = this;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  audioChunks = [];

  let silenceTimer;
  let isRecording = true;

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

  setTimeout(stopRecording, 6000); // fallback
};

// 🚀 ENVIO
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

    const res = await response.json();

    console.log("RAW RESPONSE:", res);

    // 🔥 compatível com backend e n8n direto
    const payload = res?.data || res;

    if (!payload) {
      setStatus("❌ Resposta inválida");
      removeTyping();
      return;
    }

    removeTyping();

    // 👤 texto do utilizador (STT)
    if (payload.userText) {
      addMessage(payload.userText, "user");
    }

    // 🤖 resposta AI
    if (payload.reply) {
      const fixed = fixSpacing(payload.reply);
      typeMessage(fixed);
    }

    // 🔊 áudio
    if (payload.audio) {
      const byteCharacters = atob(payload.audio);
      const byteArray = new Uint8Array(
        [...byteCharacters].map(c => c.charCodeAt(0))
      );

      const audioBlob = new Blob([byteArray], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);

      const player = document.getElementById("player");

      player.src = audioUrl;
      player.style.display = "block";

      setTimeout(() => {
        player.play();
      }, 50);

      player.onended = () => setStatus("✅ Pronto");
    }

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

    const data = await res.json();

    const payload = data?.data || data;

    removeTyping();

    if (payload?.reply) {
      typeMessage(payload.reply);
    }

  } catch (err) {
    console.error(err);
    removeTyping();
    setStatus("❌ Falha");
  }
}