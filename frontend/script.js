let questions = [];
let currentQuestion = 0;
let score = 0;
let username = "";
let timer;
let timeLeft = 15;

document.getElementById("start-btn").addEventListener("click", startQuiz);
document.getElementById("next-btn").addEventListener("click", nextQuestion);
document.getElementById("restart-btn").addEventListener("click", () => location.reload());

async function startQuiz() {
    username = document.getElementById("username").value;
    if (!username) return alert("Please enter your name");
    await fetchQuestions();
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("quiz-screen").classList.remove("hidden");
    showQuestion();
}

async function fetchQuestions() {
    const res = await fetch("http://127.0.0.1:5000/get_questions");
    questions = await res.json();
}

function showQuestion() {
    const q = questions[currentQuestion];
    document.getElementById("question-text").innerText = q.question;
    const answersDiv = document.getElementById("answers");
    answersDiv.innerHTML = "";
    q.options.forEach(option => {
        const btn = document.createElement("button");
        btn.innerText = option;
        btn.addEventListener("click", () => selectAnswer(option));
        answersDiv.appendChild(btn);
    });

    // Timer start
    timeLeft = 15;
    document.getElementById("timer").innerText = timeLeft;
    timer = setInterval(countdown, 1000);
}

function countdown() {
    timeLeft--;
    document.getElementById("timer").innerText = timeLeft;
    if (timeLeft === 0) {
        clearInterval(timer);
        lockAnswers();
        document.getElementById("next-btn").classList.remove("hidden");
    }
}

function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function selectAnswer(answer) {
    clearInterval(timer);
    
    const rawQuestion = questions[currentQuestion].question;
    const rawAnswer = answer;  // usually the same as option, no decode needed

    console.log("Sending validation for question:", rawQuestion);
    console.log("Selected answer:", rawAnswer);

    fetch("http://127.0.0.1:5000/validate", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ question: rawQuestion, answer: rawAnswer })
    })

    .then(res => res.json())
    .then(data => {
        console.log("Validation response:", data);
        if (data.correct) {
            score++;
            console.log("Score incremented:", score);
        } else {
            console.log("Answer was incorrect.");
        }
        lockAnswers();
        document.getElementById("next-btn").classList.remove("hidden");
    })
    .catch(err => {
        console.error("Error validating answer:", err);
        lockAnswers();
        document.getElementById("next-btn").classList.remove("hidden");
    });
}


function lockAnswers() {
    document.querySelectorAll("#answers button").forEach(b => b.disabled = true);
}

function nextQuestion() {
    currentQuestion++;
    if (currentQuestion >= questions.length) {
        finishQuiz();
    } else {
        document.getElementById("next-btn").classList.add("hidden");
        showQuestion();
    }
}

function finishQuiz() {
    document.getElementById("quiz-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");
    document.getElementById("score").innerText = `Score: ${score}/${questions.length}`;

    fetch("http://127.0.0.1:5000/save_score", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, score })
    })
    .then(() => loadLeaderboard());
}

function loadLeaderboard() {
    fetch("http://127.0.0.1:5000/leaderboard")
    .then(res => res.json())
    .then(data => {
        const lb = document.getElementById("leaderboard");
        lb.innerHTML = "";
        data.forEach(entry => {
            const li = document.createElement("li");
            li.innerText = `${entry.username} - ${entry.score}`;
            lb.appendChild(li);
        });
    });
}

