const gameState = {
  index: 0,
  row: 0,
  correctWord: "",
  guessWord: [],
  isGameOver: false,
  isLoading: false,
};

const letterBoxes = document.getElementsByClassName("letter-box");

function toggleLoader(show) {
  const loader = document.querySelector(".loader");
  if (!loader) return;

  if (show) {
    loader.classList.remove("loader-hidden");
    gameState.isLoading = true;
  } else {
    loader.classList.add("loader-hidden");
    gameState.isLoading = false;
  }
}

async function validateWord(word) {
  const url = "https://words.dev-apis.com/validate-word";

  toggleLoader(true);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ word: word }),
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Validation result:", result);

    return result.validWord;
  } catch (error) {
    console.error("Validation error:", error.message);
    return false;
  } finally {
    toggleLoader(false);
  }
}

function checkGuess() {
  const correctLetters = gameState.correctWord.split("");
  const guessedLetters = [...gameState.guessWord];

  const letterCount = {};

  for (let i = 0; i < 5; i++) {
    const elem = letterBoxes[gameState.row * 5 + i];
    elem.classList.remove("pink");

    if (guessedLetters[i] === correctLetters[i]) {
      setTimeout(() => {
        elem.classList.add("flip");
        setTimeout(() => {
          elem.classList.add("green");
        }, 300);
      }, i * 100);

      guessedLetters[i] = null;
      correctLetters[i] = null;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (correctLetters[i] !== null) {
      letterCount[correctLetters[i]] =
        (letterCount[correctLetters[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (guessedLetters[i] === null) continue;

    const elem = letterBoxes[gameState.row * 5 + i];

    setTimeout(() => {
      elem.classList.add("flip");
      setTimeout(() => {
        if (letterCount[guessedLetters[i]] > 0) {
          elem.classList.add("yellow");
          letterCount[guessedLetters[i]]--;
        } else {
          elem.classList.add("red");
        }
      }, 300);
    }, i * 100);
  }

  setTimeout(() => {
    checkGameEnd();
  }, 600);
}

function showModal(title, message, isWin) {
  const modal = document.querySelector(".modal");
  const overlay = document.querySelector(".modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const modalWord = document.getElementById("modal-word");

  modalTitle.innerHTML = title;
  modalWord.textContent = gameState.correctWord;

  const messageText = document.createTextNode(message);
  modalMessage.innerHTML = "";
  modalMessage.appendChild(messageText);
  modalMessage.appendChild(modalWord);

  overlay.classList.add("show");
  modal.classList.add("show");

  if (isWin) {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        letterBoxes[gameState.row * 5 + i].classList.add("win");
      }, i * 100);
    }
  }
}

function checkGameEnd() {
  const guessedWord = gameState.guessWord.join("");

  if (guessedWord === gameState.correctWord) {
    gameState.isGameOver = true;
    setTimeout(() => {
      showModal(
        "🎉 Amazing!",
        `You guessed the word in ${gameState.row + 1} ${
          gameState.row === 0 ? "try" : "tries"
        }! The word was `,
        true
      );
    }, 800);
  } else if (gameState.row >= 5) {
    gameState.isGameOver = true;
    setTimeout(() => {
      showModal(
        "😢&nbsp;Game&nbsp;Over",
        "Better luck next time! The word was ",
        false
      );
    }, 800);
  } else {
    gameState.row++;
    gameState.index = 0;
    gameState.guessWord = [];
  }
}

async function getWordOfTheDay() {
  const url = "https://words.dev-apis.com/word-of-the-day";

  toggleLoader(true);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    gameState.correctWord = result.word.toUpperCase();
    console.log("Word loaded successfully");
  } catch (error) {
    console.error("Failed to fetch word:", error.message);
    alert("Failed to load the word. Please refresh the page.");
  } finally {
    toggleLoader(false);
  }
}

function markInvalidWord() {
  for (let i = 0; i < 5; i++) {
    const elem = letterBoxes[gameState.row * 5 + i];
    elem.classList.add("pink", "shake");

    setTimeout(() => {
      elem.classList.remove("shake");
    }, 500);
  }
}

async function handleKeyPress(e) {
  if (gameState.isGameOver || gameState.isLoading) {
    return;
  }

  const key = e.key;

  if (key === "Backspace") {
    if (gameState.index <= 0) return;

    gameState.index--;
    letterBoxes[gameState.row * 5 + gameState.index].textContent = "";
    gameState.guessWord[gameState.index] = "";
    return;
  }

  if (isLetter(key) && gameState.index < 5) {
    const upperKey = key.toUpperCase();
    const elem = letterBoxes[gameState.row * 5 + gameState.index];

    elem.textContent = upperKey;
    elem.classList.add("pop");

    setTimeout(() => {
      elem.classList.remove("pop");
    }, 300);

    gameState.guessWord[gameState.index] = upperKey;
    gameState.index++;
    return;
  }

  if (key === "Enter" && gameState.index === 5) {
    const guessedWord = gameState.guessWord.join("");

    const isValid = await validateWord(guessedWord);

    if (isValid) {
      checkGuess();
    } else {
      markInvalidWord();
    }
  }
}

function isLetter(key) {
  return /^[a-zA-Z]$/.test(key);
}

document.addEventListener("keydown", handleKeyPress);

getWordOfTheDay();
