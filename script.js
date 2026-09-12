let questionBank = [];
let currentScore = 0;
let comboStreak = 0;
let lives = 3;
const maxLives = 5;
let currentLevel = 1;
let currentQuestionIndex = 0;
let isAnswering = false;
let wrongQuestions = [];

const levelNames = {
  1: "1 (Easy)",
  2: "2 (Medium)",
  3: "3 (Hard)",
  4: "4 (Very Hard)",
};

// DOM Elements
const gameArea = document.getElementById("game-area");
const reviewScreen = document.getElementById("review-screen");
const questionTxt = document.getElementById("question-txt");
const cardRow = document.getElementById("card-row");
const scoreTxt = document.getElementById("score-txt");
const comboTxt = document.getElementById("combo-txt");
const livesTxt = document.getElementById("lives-txt");
const levelTxt = document.getElementById("level-txt");
const levelBadge = document.getElementById("level-badge");
const feedbackEl = document.getElementById("feedback");
const progressBar = document.getElementById("progress-bar");
const explanationBox = document.getElementById("explanation-box");
const explanationTxt = document.getElementById("explanation-txt");
const wrongList = document.getElementById("wrong-list");
const finalScoreTxt = document.getElementById("final-score-txt");

const levelModal = document.getElementById("level-modal");
const modalDesc = document.getElementById("modal-desc");
const closeModalBtn = document.getElementById("close-modal-btn");

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function speakJapanese(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/^[A-D]\.\s*/, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ja-JP";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function playSound(type) {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === "correct") {
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } else if (type === "wrong") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.setValueAtTime(110, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
}

closeModalBtn.addEventListener("click", () => {
  levelModal.classList.remove("show");
  levelModal.classList.add("hidden");
});

async function fetchQuestionsFromDatabase() {
  try {
    const response = await fetch("questions.json");
    questionBank = await response.json();
    loadQuestion();
  } catch (error) {
    console.error("Gagal mengambil data soal:", error);
    questionTxt.textContent = "Gagal memuat soal dari database.";
  }
}

function loadQuestion() {
  if (questionBank.length === 0) return;

  isAnswering = false;
  feedbackEl.classList.add("hidden");
  explanationBox.classList.add("hidden");

  const currentQ = questionBank[currentQuestionIndex];
  questionTxt.textContent = `${currentQ.question}`;
  cardRow.innerHTML = "";

  const progressPercent = (currentQuestionIndex / questionBank.length) * 100;
  progressBar.style.width = `${progressPercent}%`;

  currentQ.options.forEach((optionText) => {
    const cardContainer = document.createElement("div");
    cardContainer.classList.add("card-container");

    const cardInner = document.createElement("div");
    cardInner.classList.add("card-inner");

    const cardFront = document.createElement("div");
    cardFront.classList.add("card-front");
    const cardContent = document.createElement("span");
    cardContent.classList.add("card-content");
    cardContent.textContent = optionText;
    cardFront.appendChild(cardContent);

    const cardBack = document.createElement("div");
    cardBack.classList.add("card-back");

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    cardContainer.appendChild(cardInner);

    cardContainer.onclick = () => {
      if (isAnswering) return;
      speakJapanese(optionText);
      checkAnswer(optionText, cardContainer, cardBack);
    };

    cardRow.appendChild(cardContainer);
  });
}

function checkAnswer(selectedOptionText, cardContainer, cardBack) {
  isAnswering = true;

  const currentQ = questionBank[currentQuestionIndex];
  cardContainer.classList.add("flipped");

  if (selectedOptionText === currentQ.correctText) {
    setTimeout(() => playSound("correct"), 150);

    cardBack.textContent = "✓ Benar";
    cardBack.classList.add("correct-bg");

    comboStreak++;
    currentScore += 5;
    scoreTxt.textContent = currentScore;
    comboTxt.textContent = `${comboStreak}x`;

    let feedbackMsg = "Jawaban Benar! +5 Poin";

    // Combo 5x = +1 Darah
    if (comboStreak % 5 === 0) {
      if (lives < maxLives) {
        lives++;
        updateLivesUI();
        feedbackMsg = `🔥 5x COMBO! +1 Darah Tambahan ❤️ (+5 Poin)`;
      } else {
        feedbackMsg = `🔥 5x COMBO! Darah Sudah Penuh! (+5 Poin)`;
      }
    }

    feedbackEl.textContent = feedbackMsg;
    feedbackEl.className = "feedback correct";

    if (currentQ.explanation) {
      explanationTxt.textContent = currentQ.explanation;
      explanationBox.classList.remove("hidden");
    }

    let hasLeveledUp = false;
    if (currentScore >= 50 && currentLevel === 1) {
      currentLevel = 2;
      hasLeveledUp = true;
    } else if (currentScore >= 100 && currentLevel === 2) {
      currentLevel = 3;
      hasLeveledUp = true;
    } else if (currentScore >= 150 && currentLevel === 3) {
      currentLevel = 4;
      hasLeveledUp = true;
    }

    if (hasLeveledUp) {
      levelTxt.textContent = levelNames[currentLevel];
      triggerLevelUpUI(levelNames[currentLevel]);
    }

    setTimeout(() => {
      currentQuestionIndex++;
      if (currentQuestionIndex < questionBank.length) {
        loadQuestion();
      } else {
        endGame();
      }
    }, 1800);
  } else {
    setTimeout(() => playSound("wrong"), 150);

    cardBack.textContent = "✗ Salah";
    cardBack.classList.add("wrong-bg");

    comboStreak = 0;
    lives--;
    comboTxt.textContent = "0x";
    updateLivesUI();

    if (!wrongQuestions.some((q) => q.id === currentQ.id)) {
      wrongQuestions.push(currentQ);
    }

    feedbackEl.textContent = "Jawaban Salah! Nyawa Berkurang 1";
    feedbackEl.className = "feedback wrong";

    if (lives <= 0) {
      setTimeout(() => endGame(), 1000);
    } else {
      setTimeout(() => {
        cardContainer.classList.remove("flipped");
        isAnswering = false;
      }, 1000);
    }
  }
}

function updateLivesUI() {
  let hearts = "";
  for (let i = 0; i < lives; i++) hearts += "❤️";
  livesTxt.textContent = hearts || "💀";
}

function triggerLevelUpUI(newLevelName) {
  levelBadge.classList.add("pulse-level");
  setTimeout(() => levelBadge.classList.remove("pulse-level"), 1200);

  modalDesc.textContent = `Selamat! Kamu berhasil membuka Level ${newLevelName}`;
  levelModal.classList.remove("hidden");
  setTimeout(() => levelModal.classList.add("show"), 10);

  if (typeof confetti === "function") {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
}

function endGame() {
  gameArea.classList.add("hidden");
  reviewScreen.classList.remove("hidden");
  finalScoreTxt.textContent = `Skor Akhir: ${currentScore}`;

  wrongList.innerHTML = "";
  if (wrongQuestions.length === 0) {
    wrongList.innerHTML =
      "<p style='color:#34d399;'>Hebat! Tidak ada jawaban yang salah 🎉</p>";
  } else {
    wrongQuestions.forEach((q) => {
      const div = document.createElement("div");
      div.className = "wrong-item";
      div.innerHTML = `<strong>Soal:</strong> ${q.question}<br/><strong>Kunci Jawaban:</strong> ${q.correctText}<br/><em>${q.explanation}</em>`;
      wrongList.appendChild(div);
    });
  }
}

function resetGame() {
  currentQuestionIndex = 0;
  currentScore = 0;
  comboStreak = 0;
  lives = 3;
  currentLevel = 1;
  wrongQuestions = [];

  scoreTxt.textContent = "0";
  comboTxt.textContent = "0x";
  levelTxt.textContent = levelNames[1];
  updateLivesUI();

  reviewScreen.classList.add("hidden");
  gameArea.classList.remove("hidden");
  loadQuestion();
}

fetchQuestionsFromDatabase();
