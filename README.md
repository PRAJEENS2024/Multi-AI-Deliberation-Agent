# Veritas AI: Autonomous Multi-Agent Courtroom System 🚀

> "Where Specialized AI Personas Debate, Cross-Examine Evidence, and Synthesize Truth."

**Veritas AI** is an advanced Multi-Agent Deliberation & Synthesizer System. Instead of relying on a single AI model's potentially biased or hallucinated answer, Veritas AI orchestrates **5 specialized autonomous AI agents** powered by free open-weight models on Groq to cross-examine claims, audit logic, verify facts live on the web, and synthesize an authoritative verdict.

---

## 🤖 The 5 Autonomous Agents

1. **⚙️ Orchestrator Agent**: Controls session state, persistent storage (`backend/data/sessions.json`), and asynchronous workflow execution.
2. **🔍 Primary Research Agent** (`Meta Llama 3.3 70B Versatile`): Generates deep, technical primary facts and initial assessments.
3. **⚡ Critical Audit Agent** (`Meta Llama 3.1 8B Instant`): Acts as the skeptic/devil's advocate, uncovering hidden assumptions, fallacies, and edge cases.
4. **⚖️ Data & Logic Agent** (`Qwen 2.5 27B`): Audits metrics, exact definitions, scope, and numerical consistency.
5. **👑 Lead Synthesis Engine** (`Meta Llama 3.3 70B Versatile`): Synthesizes multi-turn cross-examination debates and verified web search evidence into a clean, objective verdict.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide-React
- **Backend**: Python 3.12, FastAPI, Asyncio, Pydantic
- **LLM Infrastructure**: Groq API (Zero cost, high-speed open-weights: Llama 3.3 70B, Llama 3.1 8B, Qwen 2.5 27B)
- **Persistence**: File-based JSON database (`backend/data/sessions.json` & `users.json`)

---

## 🚀 How to Run the Project

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python 3.10+](https://www.python.org/)
- A **free Groq API key** from [console.groq.com](https://console.groq.com)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/PRAJEENS2024/Multi-AI-Deliberation-Agent.git
cd Multi-AI-Deliberation-Agent
```

---

### Step 2: Set Up & Run the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file inside the `backend/` folder:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --port 8000 --reload
   ```
   *Backend server will run at `http://localhost:8000`.*

---

### Step 3: Set Up & Run the Frontend

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend interface will run at `http://localhost:5173`.*

---

### Step 4: Open in Browser
Open `http://localhost:5173` in your browser. Type any prompt (e.g. *"Is nuclear energy safe and green?"* or *"Who is the CM of TN during 2021?"*) to watch the 4 autonomous sub-agents cross-examine evidence and synthesize a verified verdict!

---

## 🌟 Features
- **No Paid Models Required**: Completely free to run using Groq API keys.
- **Interactive Courtroom Cross-Examination Visualizer**: View live turn-by-turn debates between Critical Audit and Primary Research agents.
- **Persistent Chat History**: Sessions automatically save to disk and reload upon server restart.
- **Live Web Verification**: Automatically checks disputed claims against web sources.
