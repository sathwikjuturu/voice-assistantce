# VoiceMail AI - Voice-Based Smart Email Assistant App

VoiceMail AI is a futuristic, voice-controlled, glassmorphic email assistant application. It enables hands-free email management using Speech-to-Text command parsing, Text-to-Speech narration, and Gemini AI-powered workflows.

---

## Key Features

1. **Secure User Authentication**: Complete flow containing Signup, Login, Password Reset, and OTP Verification powered by JWT sessions.
2. **Dual-Mode Sync Engine**:
   - **Server Mode**: Connects to the Express backend and saves to a transactional `db.json` file.
   - **Local fallback Mode**: Runs client-side using browser `localStorage` if accessed via `file:///` protocols without running a server.
3. **Voice Control System**:
   - Continuous listening overlays using Web Speech API's `SpeechRecognition`.
   - Advanced voice commands: *"Compose email to Sarah"*, *"Read latest email"*, *"Delete latest email"*, *"Open Calendar"*, *"Search invoices"*, and *"Go back"*.
4. **Text-To-Speech Narration**: Reads email contents, sender names, and notifications aloud with custom speech speed.
5. **AI Assistant Features**:
   - Smart Summary of long email threads.
   - Tone Enhancer: Formal, Friendly, or Professional email rewrites.
   - Meeting Reminder Extractor: Automatically detects scheduling invitations and schedules them in the integrated calendar.
6. **Smart Dashboard Modules**: Inbox, Sent Mail, Drafts, Trash, Spam, Contacts, and Calendar schedules.

---

## Technology Stack

* **Frontend**: Vanilla HTML5, Outfit Typography, FontAwesome Icons, Vanilla CSS Grid & Flexbox, Framer-inspired Micro-animations, and `js/app.js` Orchestrator.
* **Backend**: Node.js + Express.js APIs.
* **Database**: Secure file-based JSON database wrapper (`db.json`) for zero-setup execution (can easily link to MongoDB or SQLite).
* **AI Engine**: Google Gemini API integration (with rule-based fallbacks if no API key is specified).

---

## Installation & Running Locally

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Install Dependencies
Open your terminal in the project directory and run:
```bash
npm install
```

### 3. Configure Environment Variables
A `.env` file template has been created at the root of the project.
Copy `.env.example` to `.env` and update the fields before running the app:
```bash
copy .env.example .env
```

Example `.env` contents:
```env
PORT=3000
JWT_SECRET=voicemail-secret-key-12345
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```
*Provide your `GEMINI_API_KEY` to unlock premium generative AI capabilities. If left empty, the server automatically uses the built-in regex-based heuristic command parser and templates.*

### 4. Start the Server
Run the startup command:
```bash
node server.js
```

### 5. Access the Web App
Open your web browser and go to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## Voice Commands to Try
Click the **floating microphone button** in the bottom-right corner or on the dashboard to activate the voice overlay, then say:
* *"Compose email to Sarah"*
* *"Open inbox"*
* *"Open calendar"*
* *"Read latest"*
* *"Delete latest"*
* *"Open settings"*
* *"Go back"*

---

## CI/CD Pipeline & E2E Testing

The project includes an automated deployment and E2E testing pipeline using GitHub Pages and Python Selenium.

### Live Deployed Application
- **URL**: [https://sathwikjuturu.github.io/voice-assistantce/](https://sathwikjuturu.github.io/voice-assistantce/)

### Running Tests Locally

1. **Install python packages**:
   ```bash
   pip install -r tests/requirements.txt
   ```

2. **Package static application**:
   ```bash
   python tests/build.py
   ```

3. **Start local server**:
   ```bash
   npm run dev
   ```

4. **Run test suite**:
   ```bash
   # Windows PowerShell
   $env:BASE_URL="http://localhost:3000"
   python tests/run_tests.py

   # macOS/Linux Bash
   export BASE_URL="http://localhost:3000"
   python tests/run_tests.py
   ```

### CI/CD Workflow
- Defined in `.github/workflows/deploy-and-test.yml`.
- Automatically deploys the static files to GitHub Pages and runs the E2E Selenium tests in headless mode against the live URL on every push to the `main` branch.
- Generates and uploads Excel (`Automation_Test_Report.xlsx`), HTML (`execution-report.html`), Logs, and Screenshots as workflow artifacts.

