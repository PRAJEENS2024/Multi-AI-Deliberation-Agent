# AI Jury: Multi-Agent Deliberation Platform ⚖️🚀

> "Where 7 Specialized AI Agents Debate, Cross-Examine Evidence, and Synthesize Verified Truth"

**AI Jury** is a premium enterprise-grade multi-agent deliberation platform that orchestrates **7 autonomous AI agents** in a structured pipeline to research, critique, fact-check, detect bias, synthesize, format, and deliver verified answers. Instead of relying on a single AI model's potentially biased or hallucinated answer, AI Jury transforms multi-model querying into a structured consensus workflow.

---

## 🔥 Key Features

### 7 Chained Agent Pipeline
Each agent's output feeds the next in a linear deliberation chain:

1. **🔬 Research Agent** (Llama 3.3 70B) - Deep domain research & evidence gathering
2. **⚡ Critic Agent** (Llama 3.1 8B) - Devil's advocate, challenges assumptions & fallacies
3. **🔎 Fact Checker Agent** (Llama 3.3 70B) - Web-verifies claims with live DuckDuckGo search
4. **🧭 Bias Detector Agent** (Qwen 3.6-27B) - Audits for cognitive bias, framing, cultural skew
5. **👑 Synthesis Agent** (Llama 3.3 70B) - Writes final authoritative verdict
6. **📋 Report Formatter Agent** (Llama 3.1 8B) - Structures professional PDF and DOCX reports
7. **📧 Email Dispatch Agent** (Llama 3.1 8B) - Generates & sends dual attachments directly to user's registered inbox

---

### 🆕 Latest Platform Enhancements (v2.5)

- **📧 Dual PDF & Word Document Email Dispatch** - Generates and attaches **BOTH** PDF (`.pdf`) and Microsoft Word (`.docx`) report files in a single automated email dispatch.
- **🔐 User Authentication & Registered Email Delivery** - Integrated user login/signup with session scoping and automatic email pre-filling for registered users (`Send PDF & Document to user@email.com`).
- **⚡ Automatic Groq 429 Rate-Limit Fallback Chain** - Automatic fallback from `llama-3.3-70b-versatile` to `llama-3.1-8b-instant` and `qwen/qwen3.6-27b` when daily token limits are reached, ensuring 100% uptime.
- **🧹 Clean Reasoning Output** - Automatic stripping of internal reasoning `<think>...</think>` tags from final verdicts, debate turns, and generated reports.
- **📄 Glitch-Free Report Engine** - XML sanitization (`&`, `<`, `>`) and table auto-wrapping for ReportLab PDF and `python-docx` document exports.
- **📊 Agent Pipeline Visualization** - Interactive flow diagram showing real-time agent execution stages.
- **📈 Confidence Timeline** - Track confidence score evolution across all 7 agent stages.
- **📋 Analytics Dashboard** - Usage stats, agent performance metrics, session search, and history.
- **💎 Enterprise Landing Page & SMTP Config** - Complete user authentication, customizable SMTP credentials, and pricing tiers.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, React Router, Recharts, Lucide Icons
- **Backend**: Python 3.10+, FastAPI, LangGraph, Asyncio, Pydantic
- **LLM Infrastructure**: Groq API with automatic model fallback (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `qwen/qwen3.6-27b`)
- **Document Generators**: `ReportLab` (PDF generation), `python-docx` (Microsoft Word generation)
- **Persistence**: File-based JSON database (`backend/data/sessions.json` & `users.json`)
- **Web Search**: DuckDuckGo API for live claim verification
- **Email Delivery**: SMTP with TLS support and MIMEApplication dual file attachment handling

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python 3.10+](https://www.python.org/)
- A **free Groq API key** from [console.groq.com](https://console.groq.com)

### Step 1: Backend Setup
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` in `backend/`:
```env
GROQ_API_KEY=your_groq_api_key_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=b.balasrisabhari@gmail.com
SMTP_PASS=kwmrgglppgujjnlz
```

Start the backend server:
```bash
uvicorn main:app --port 8000 --reload
```

### Step 2: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Step 3: Open Browser
Navigate to `http://localhost:5173` and start querying!

---

## 🤖 The 7 Agents Pipeline

### Agent 1: Research Agent 🔬
- **Model**: Meta Llama 3.3 70B Versatile
- **Output**: Comprehensive domain research with facts, statistics, and expert consensus.

### Agent 2: Critic Agent ⚡
- **Model**: Meta Llama 3.1 8B Instant
- **Output**: Numbered critique identifying fallacies, unsupported claims, and edge cases.

### Agent 3: Fact Checker Agent 🔎
- **Model**: Meta Llama 3.3 70B Versatile + DuckDuckGo Web Search
- **Output**: VERIFIED/DISPUTED/UNVERIFIED labels for each claim with live web evidence.

### Agent 4: Bias Detector Agent 🧭
- **Model**: Qwen 3.6-27B
- **Output**: Bias audit detecting cognitive bias, framing, and severity ratings (Low/Medium/High).

### Agent 5: Synthesis Agent 👑
- **Model**: Meta Llama 3.3 70B Versatile
- **Output**: Authoritative final answer synthesized into clean, publication-ready Markdown.

### Agent 6: Report Formatter Agent 📋
- **Model**: Meta Llama 3.1 8B Instant
- **Output**: Structured JSON report format containing executive summary, key findings, and recommendations.

### Agent 7: Email Dispatch Agent 📧
- **Model**: Meta Llama 3.1 8B Instant
- **Output**: Automated generation and email dispatch of **BOTH** PDF (`.pdf`) and Word (`.docx`) report files to the user's email address.

---

## 📁 Project Structure

```
ai-jury/
├── backend/
│   ├── main.py              # FastAPI server entry point
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables
│   ├── app/
│   │   ├── agents/
│   │   │   ├── agent_orchestrator.py  # LangGraph 7-agent pipeline
│   │   │   ├── agent_email.py         # PDF & DOCX generation & SMTP dispatch
│   │   │   ├── agent_verification.py  # Web search for fact-checking
│   │   │   └── llm_client.py          # Groq API client, model fallback & think tag cleaning
│   │   ├── api/
│   │   │   └── routes.py    # REST API endpoints
│   │   ├── models/
│   │   │   └── schemas.py   # Pydantic data models
│   │   └── services/
│   │       └── state_manager.py  # Session persistence & metrics
│   └── data/
│       ├── sessions.json    # Persistent session storage
│       └── users.json       # Registered user accounts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx          # Navigation with session search
│   │   │   ├── EmailSettings.tsx     # SMTP configuration panel
│   │   │   ├── AgentFlowDiagram.tsx  # Pipeline visualization
│   │   │   ├── ConfidenceTimeline.tsx # Confidence score chart
│   │   │   └── Dashboard.tsx         # Analytics dashboard
│   │   ├── pages/
│   │   │   ├── Landing.tsx   # Premium landing page with pricing
│   │   │   ├── Chat.tsx      # Main chat interface with dual email dispatch
│   │   │   └── Login.tsx     # Authentication page
│   │   ├── App.tsx           # Router setup
│   │   └── index.css         # Styling
│   └── package.json
└── README.md
```

---

## 📄 License

Proprietary - All rights reserved. Built for commercial deployment.

---

Built with ❤️ using LangGraph, Groq, FastAPI, ReportLab, python-docx, and React.
