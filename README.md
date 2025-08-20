# 🧠 MaLong Academy

**MaLong Academy** is an interactive, role-playing chatbot tutor web application that adapts its teaching style based on the learner's mood and preferred tutor persona. Built with Flask, HTML/CSS, and integrated with the Google Gemini API for dynamic AI conversations and gTTS for voice feedback.

---

## 📌 Features

- 🎭 Select or create your own tutor role (e.g., Kind Sister, Mean Stepmother, Pirate)
- 🌐 Choose between English and Thai for interaction
- 🗣️ Voice replies using gTTS (Google Text-to-Speech)
- 📊 Mood-based adaptive teaching logic
- 📘 Post-lesson quiz adjusted by user's mood
- 📁 Supports session tracking with stateful interaction per chat

---

## 🛠 Tech Stack

- **Backend:** Python (Flask), Google Generative AI (Gemini 2.0 Flash)
- **Frontend:** HTML, CSS (with two themes), JavaScript
- **Voice:** gTTS for speech synthesis
- **Environment:** Google Colab, dotenv for API key management

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/malong-academy.git
cd malong-academy
```

### 2. Setup Python Environment

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Set your Google Gemini API Key

Create a `.env` file in the root folder and add your key:

```
GOOGLE_API_KEY=your_google_gemini_api_key
```

### 4. Run the App

```bash
python app.py
```

Visit `http://127.0.0.1:5000` to start your learning session!

---

## 📁 File Structure

- `app.py` – Main Flask backend logic
- `index.html` – Landing page for user setup
- `chat.html` – Main chat interface
- `/static/` – CSS, JS, and audio files
- `/templates/` – HTML templates for rendering

---

## 🎯 Highlights

- Mood-sensitive tutor behavior and session flow
- Interactive chat UI with real-time responses and voice feedback
- Intelligent branching logic to match user responses and guide conversations
- Custom character creation and multilingual support

---

## ✅ Conclusion

MaLong Academy is not just an educational tool—it's a dynamic and emotionally responsive learning companion. Whether you're feeling happy, stressed, or somewhere in between, this platform tailors your experience to help you learn better.

> _"Education meets empathy through AI."_ 💬✨
