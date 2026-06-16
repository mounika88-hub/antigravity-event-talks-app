# 🚀 BigQuery Release Explorer

A premium, modern, and highly interactive web application designed to track, filter, and share Google BigQuery release notes. Built using a **Python Flask** backend and a plain **vanilla HTML5, CSS3, and JavaScript** frontend, it parses Google's official release notes RSS feed, splits daily updates into distinct, granular cards, and enables one-click sharing to X (Twitter) via a custom Tweet Composer.

---

## ✨ Features

- **🔍 Granular Update Splitting**: Google's official feed groups all updates for a single day into one large block. This app parses and decomposes those blocks into independent, color-coded cards (Features, Changes, Issues, Deprecations) for a cleaner reading experience.
- **⚡ Smart Tweet Composer**: Click the Twitter/X button on any card to open a custom in-app composer modal. It auto-generates a draft respecting the **280-character limit**, truncates text cleanly at word boundaries, appends the source documentation link, and provides one-click hashtag suggestions (like `#BigQuery`, `#GoogleCloud`, `#AI`).
- **🛡️ Thread-Safe 10-Minute Caching**: Saves bandwidth and ensures fast page-load speeds by caching the parsed RSS feed in-memory. 
- **🔄 Force Sync**: Use the refresh button in the header (with spinning indicator) to bypass the cache and fetch the live feed on demand. It displays the exact sync time (e.g. `Last sync: 12:24:05 PM`).
- **🎨 Premium UI/UX**: Designed with modern dark-mode aesthetics, featuring glassmorphism cards, subtle backdrop glows, custom SVG icons, responsive flex-grid layouts, and smooth micro-animations.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.13+, Flask, Requests, BeautifulSoup4
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Variables, Keyframe Animations), Vanilla JavaScript (ES6+ AJAX, Debounced Search, Event Handlers)
- **Styling**: Inter & Outfit Google Fonts, Custom SVG Icons

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher installed on your machine.
- Git.

### Installation & Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/mounika88-hub/antigravity-event-talks-app.git
   cd antigravity-event-talks-app
   ```

2. **Set up a Virtual Environment**
   - **On Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **On macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask Server**
   ```bash
   python app.py
   ```

5. **Open the Application**
   Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

---

## 🏗️ Architecture

```
                               ┌──────────────────────────┐
                               │  Google Cloud BQ Feed   │
                               │        (Atom XML)        │
                               └─────────────┬────────────┘
                                             │
                                             ▼
                               ┌──────────────────────────┐
                               │       Flask Backend      │
                               │  - fetch_and_parse_feed  │
                               │  - 10-Min Cache & Lock   │
                               └─────────────┬────────────┘
                                             │
                                             ▼
                               ┌──────────────────────────┐
                               │     REST API Endpoint    │
                               │     (/api/releases)      │
                               └─────────────┬────────────┘
                                             │
                                             ▼
                               ┌──────────────────────────┐
                               │      Vanilla JS Core     │
                               │  - AJAX fetch / Debounce │
                               │  - Client-side Filter    │
                               └─────────────┬────────────┘
                        ┌────────────────────┴────────────────────┐
                        ▼                                         ▼
           ┌──────────────────────────┐              ┌──────────────────────────┐
           │      Interactive UI      │              │   Tweet Composer Modal   │
           │  - Color-coded badges    │              │  - 280-char Truncation   │
           │  - Glassmorphic design   │              │  - Hashtag Suggestions   │
           └──────────────────────────┘              └──────────────┬───────────┘
                                                                    │
                                                                    ▼
                                                     ┌──────────────────────────┐
                                                     │   Twitter/X Share API    │
                                                     │   (Web Intent Overlay)   │
                                                     └──────────────────────────┘
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
