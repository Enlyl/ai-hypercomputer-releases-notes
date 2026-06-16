# 🚀 AI Hypercomputer Release Notes Dashboard

A premium, real-time web dashboard for tracking **Google Cloud AI Hypercomputer** release notes — featuring live feed updates, smart categorization, full-text search, Russian translation, and one-click sharing to X/Twitter.

![Flask](https://img.shields.io/badge/Flask-3.0%2B-blue?style=flat-square&logo=flask)
![Python](https://img.shields.io/badge/Python-3.8%2B-blue?style=flat-square&logo=python)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

- **📡 Live Feed** — Fetches release notes directly from the official [Google Cloud AI Hypercomputer Atom feed](https://docs.cloud.google.com/feeds/ai-hypercomputer-release-notes.xml)
- **⚡ Smart Caching** — In-memory cache (1-hour TTL) to minimize API calls; stale cache fallback on network errors
- **🔍 Full-text Search** — Instantly filter release notes by title, content, or category
- **🏷️ Auto-categorization** — Parses `<h3>` tags from HTML content to extract update categories automatically
- **🌐 Russian Translation** — One-click EN↔RU translation powered by Google Translate (no API key required)
- **🐦 Share to X/Twitter** — Built-in tweet composer with character counter and Web Intent integration
- **💎 Premium UI** — Dark glassmorphism design, shimmer loading states, smooth micro-animations
- **📱 Responsive** — Fully mobile-friendly with a master-detail layout and back navigation

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Python 3.8+, Flask 3.0+           |
| Frontend   | Vanilla HTML5, CSS3, JavaScript   |
| Data       | Atom/XML feed via `urllib`        |
| Typography | Google Fonts (Inter, Outfit)      |
| Translation| Google Translate single API (free)|

---

## 📁 Project Structure

```
ai-hypercomputer-releases-notes/
├── app.py                  # Flask backend — feed parsing, caching, translation API
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Main SPA template
└── static/
    ├── css/
    │   └── style.css       # Full design system & animations
    └── js/
        └── app.js          # Frontend logic — rendering, search, translation, tweet
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- pip

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Enlyl/ai-hypercomputer-releases-notes.git
cd ai-hypercomputer-releases-notes

# 2. (Optional) Create a virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python app.py
```

Then open your browser at **http://localhost:5000**

---

## 🔌 API Endpoints

| Method | Endpoint                            | Description                                       |
|--------|-------------------------------------|---------------------------------------------------|
| `GET`  | `/`                                 | Serves the main dashboard                         |
| `GET`  | `/api/release-notes`                | Returns parsed release notes JSON                 |
| `GET`  | `/api/release-notes?force=true`     | Force-refresh feed, bypassing cache               |
| `POST` | `/api/translate`                    | Translates a note's HTML content to target lang   |

### `POST /api/translate` — Request Body

```json
{
  "id": "unique-note-id",
  "content": "<p>HTML content to translate...</p>",
  "target": "ru"
}
```

---

## 🌍 Data Source

Release notes are fetched from the official Google Cloud feed:

```
https://docs.cloud.google.com/feeds/ai-hypercomputer-release-notes.xml
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

> Built with ❤️ using Flask and Vanilla JS
