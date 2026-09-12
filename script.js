let questionBank = [];
let currentScore = 0;
let currentLevel = 1;
let currentQuestionIndex = 0;

const levelNames = {
  1: "1 (Easy)",
  2: "2 (Medium)",
  3: "3 (Hard)",
  4: "4 (Very Hard)",
};

// Elemen DOM
const questionTxt = document.getElementById("question-txt");
const cardRow = document.getElementById("card-row");
const scoreTxt = document.getElementById("score-txt");
const levelTxt = document.getElementById("level-txt");
const levelBadge = document.getElementById("level-badge");
const feedbackEl = document.getElementById("feedback");

const levelModal = document.getElementById("level-modal");
const modalDesc = document.getElementById("modal-desc");
const closeModalBtn = document.getElementById("close-modal-btn");

closeModalBtn.addEventListener("click", () => {
  levelModal.classList.remove("show");
  levelModal.classList.add("hidden");
});

// Mengambil Data Soal dari Database Terpisah (JSON)
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

  feedbackEl.classList.add("hidden");
  const currentQ = questionBank[currentQuestionIndex];

  questionTxt.textContent = `${currentQ.question}`;
  cardRow.innerHTML = "";

  // Tampilkan opsi jawaban secara berurutan tanpa acak (A, B, C, D)
  currentQ.options.forEach((optionText) => {
    const cardButton = document.createElement("button");
    cardButton.classList.add("single-card");

    const cardContent = document.createElement("span");
    cardContent.classList.add("card-content");
    cardContent.textContent = optionText;

    cardButton.appendChild(cardContent);
    cardButton.onclick = () => checkAnswer(optionText);
    cardRow.appendChild(cardButton);
  });
}

function triggerLevelUpUI(newLevelName) {
  levelBadge.classList.add("pulse-level");
  setTimeout(() => levelBadge.classList.remove("pulse-level"), 1200);

  modalDesc.textContent = `Selamat! Kamu berhasil membuka Level ${newLevelName}`;
  levelModal.classList.remove("hidden");
  setTimeout(() => levelModal.classList.add("show"), 10);
}

function checkAnswer(selectedOptionText) {
  const currentQ = questionBank[currentQuestionIndex];

  if (selectedOptionText === currentQ.correctText) {
    currentScore += 5;
    scoreTxt.textContent = currentScore;

    feedbackEl.textContent = "Jawaban Benar! +5 Poin";
    feedbackEl.className = "feedback correct";

    let hasLeveledUp = false;

    if (currentScore === 50 && currentLevel === 1) {
      currentLevel = 2;
      hasLeveledUp = true;
    } else if (currentScore === 100 && currentLevel === 2) {
      currentLevel = 3;
      hasLeveledUp = true;
    } else if (currentScore === 150 && currentLevel === 3) {
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
        alert(
          `Game Selesai! Kamu berhasil menyelesaikan semua soal. Total Skor: ${currentScore}`,
        );
        resetGame();
      }
    }, 1000);
  } else {
    feedbackEl.textContent = "Jawaban Salah, coba pilih kartu lain!";
    feedbackEl.className = "feedback wrong";
  }
}

function resetGame() {
  currentQuestionIndex = 0;
  currentScore = 0;
  currentLevel = 1;
  scoreTxt.textContent = 0;
  levelTxt.textContent = levelNames[1];
  loadQuestion();
}

// Jalankan fetch saat aplikasi dibuka
fetchQuestionsFromDatabase();
