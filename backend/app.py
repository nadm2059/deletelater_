from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import json
import requests
import os
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load or initialize leaderboard from scores.json
leaderboard = []
if os.path.exists('scores.json'):
    try:
        with open('scores.json', encoding='utf-8') as f:
            content = f.read().strip()
            if content:
                leaderboard = json.loads(content)
    except json.JSONDecodeError:
        leaderboard = []

@app.route('/')
def index():
    return "Backend is running. Use /get_questions, /validate, /leaderboard etc."

@app.route('/get_questions')
def get_questions():
    """
    Fetch 5 trivia questions from Open Trivia DB,
    shuffle options, save questions locally, and return as JSON.
    """
    response = requests.get("https://opentdb.com/api.php?amount=5&type=multiple")
    data = response.json()
    questions = []

    for item in data.get("results", []):
        question = {
            "question": item["question"],
            "options": item["incorrect_answers"] + [item["correct_answer"]],
            "answer": item["correct_answer"]
        }
        random.shuffle(question["options"])
        questions.append(question)

    # Save locally for possible C++ quiz engine read
    with open("questions.json", "w", encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    return jsonify(questions)

@app.route('/validate', methods=['POST'])
def validate():
    data = request.json
    question = data.get('question', '')
    answer = data.get('answer', '')

    print(f"Received question: {question}")
    print(f"Received answer: {answer}")

    try:
        process = subprocess.run(
            ['./quiz_engine', question, answer],
            capture_output=True,
            text=True,
            check=True
        )
        output = process.stdout.strip()
        print(f"quiz_engine output: '{output}'")  # Debug output here
        correct = output == "CORRECT"
    except Exception as e:
        print("Error running quiz_engine:", e)
        correct = False

    return jsonify({'correct': correct})



@app.route('/save_score', methods=['POST'])
def save_score():
    """
    Save a new user score to leaderboard, keep top 10 scores.
    """
    global leaderboard
    data = request.json
    username = data.get('username', 'Anonymous')
    score = data.get('score', 0)

    leaderboard.append({
        "username": username,
        "score": score
    })

    # Sort descending by score and keep top 10
    leaderboard = sorted(leaderboard, key=lambda x: x['score'], reverse=True)[:10]

    with open('scores.json', 'w', encoding='utf-8') as f:
        json.dump(leaderboard, f, ensure_ascii=False, indent=2)

    return '', 204

@app.route('/leaderboard')
def get_leaderboard():
    """Return the leaderboard as JSON."""
    return jsonify(leaderboard)

if __name__ == '__main__':
    # Run on all interfaces so Docker container exposes it
    app.run(host='0.0.0.0', port=5000, debug=True)
