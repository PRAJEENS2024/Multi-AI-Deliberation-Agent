# AI Jury: Multi-Agent Deliberation Platform ⚖️🚀

> "Where 7 Specialized AI Agents Debate, Cross-Examine Evidence, and Synthesize Verified Truth"

**AI Jury** is a premium enterprise-grade multi-agent deliberation platform that orchestrates **7 autonomous AI agents** in a structured pipeline to research, critique, fact-check, detect bias, synthesize, format, and deliver verified answers. Instead of relying on a single AI model's potentially biased or hallucinated answer, AI Jury transforms multi-model querying into a structured consensus workflow.

---

## 🔥 Key Features

### 7 Chained Agent Pipeline
Each agent's output feeds the next in a linear deliberation chain:

1. **🔬 Research Agent** (Llama 3.3 70B) - Deep domain research & evidence gathering
2. **⚡ Critic Agent** (Llama 3.1 8B) - Devil's advocate, challenges assumptions & fallacies
3. **🔎 Fact Checker Agent** (Llama 3.3 70B) - Web-verifies claims, detects conflicts
4. **🧭 Bias Detector Agent** (Qwen 3.6-27B) - Audits for cognitive bias, framing, cultural skew
5. **👑 Synthesis Agent** (Llama 3.3 70B) - Writes final authoritative verdict
6. **📋 Report Formatter Agent** (Llama 3.1 8B) - Structures professional PDF-ready reports
7. **📧 Email Dispatch Agent** (Llama 3.1 8B) - Generates PDF & emails to user

### 🆕 Premium Features (v2.0)
- **📊 Agent Pipeline Visualization** - Interactive flow diagram showing real-time agent execution
- **📈 Confidence Timeline** - Track confidence score evolution across all 7 agent stages
- **📥 Multi-Format Export** - Download reports as PDF, JSON, or Markdown
- **📧 Email Dispatch** - Automated PDF report delivery via SMTP with configurable settings
- **⚙️ Email Settings Panel** - SMTP configuration with test capability in sidebar
- **📋 Analytics Dashboard** - Usage stats, agent performance metrics, session history
- **🔍 Session Search** - Search through past sessions
- **💎 Premium Landing Page** - With pricing tiers (Free / Pro $49/mo / Enterprise $199/mo)
- **📄 Professional PDF Reports** - Cover page, structured sections, claim analysis, debate transcript

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS 4, Framer Motion, React Router, Recharts, Lucide Icons
- **Backend**: Python 3.10+, FastAPI, LangGraph, Asyncio, Pydantic
- **LLM Infrastructure**: Groq API (Free open-weight models: Llama 3.3 70B, Llama 3.1 8B, Qwen 3.6-27B)
- **Persistence**: File-based JSON database (`backend/data/sessions.json` & `users.json`)
- **PDF Generation**: ReportLab with professional styling
- **Web Search**: DuckDuckGo API for live claim verification

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
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Start the backend:
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

## 💰 Monetization Model

AI Jury is designed for commercial sale with these pricing tiers:

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 5 queries/day, basic export, 7-day history |
| **Pro** | $49/mo | Unlimited queries, all exports, email dispatch, analytics, SMTP config |
| **Enterprise** | $199/mo | Everything in Pro + custom models, white-label, API access, team support |

**Target Market Value: $5,000+** for custom enterprise deployments with:
- Custom model integration
- White-label PDF branding
- Dedicated infrastructure
- SLA guarantees
- Team collaboration features

---

## 🤖 The 7 Agents

### Agent 1: Research Agent 🔬
- **Model**: Meta Llama 3.3 70B Versatile
- **Input**: User prompt + conversation history
- **Output**: Comprehensive domain research with facts, statistics, and expert consensus

### Agent 2: Critic Agent ⚡
- **Model**: Meta Llama 3.1 8B Instant
- **Input**: Research output
- **Output**: Numbered critique identifying fallacies, unsupported claims, and edge cases

### Agent 3: Fact Checker Agent 🔎
- **Model**: Meta Llama 3.3 70B Versatile
- **Input**: Research + critique + live web search
- **Output**: VERIFIED/DISPUTED/UNVERIFIED labels for each claim

### Agent 4: Bias Detector Agent 🧭
- **Model**: Qwen 3.6-27B
- **Input**: Research + critique + fact-check
- **Output**: Bias audit with severity ratings (Low/Medium/High)

### Agent 5: Synthesis Agent 👑
- **Model**: Meta Llama 3.3 70B Versatile
- **Input**: All prior agent outputs
- **Output**: Authoritative final answer in clean Markdown

### Agent 6: Report Formatter Agent 📋
- **Model**: Meta Llama 3.1 8B Instant
- **Input**: Final answer + fact-check + bias audit
- **Output**: Structured JSON report with executive summary, findings, recommendations

### Agent 7: Email Dispatch Agent 📧
- **Model**: Meta Llama 3.1 8B Instant
- **Input**: Report data + user email
- **Output**: Professional PDF generated & emailed to user

---

## 🌟 Why AI Jury is Worth $5,000+

1. **Full Automation**: 7 agents work autonomously - no manual intervention needed
2. **Explainable AI**: Every answer includes confidence scores, disputed claims, and reasoning
3. **Hallucination Prevention**: Multi-agent cross-examination + web verification
4. **Professional Output**: PDF reports with cover pages, branding, and structured sections
5. **Enterprise Ready**: Email dispatch, SMTP config, analytics dashboard, export tools
6. **Zero Inference Cost**: Uses free Groq API with open-weight models
7. **Scalable Architecture**: LangGraph pipeline with persistent state management

---

## 📁 Project Structure

```
ai-jury/
├── backend/
│   ├── main.py              # FastAPI server entry point
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables (create this)
│   ├── app/
│   │   ├── agents/
│   │   │   ├── agent_orchestrator.py  # LangGraph 7-agent pipeline
│   │   │   ├── agent_email.py         # PDF generation & email dispatch
│   │   │   ├── agent_verification.py  # Web search for fact-checking
│   │   │   └── llm_client.py          # Groq API client & agent personas
│   │   ├── api/
│   │   │   └── routes.py    # REST API endpoints
│   │   ├── models/
│   │   │   └── schemas.py   # Pydantic data models
│   │   └── services/
│   │       └── state_manager.py  # Session persistence & metrics
│   └── data/
│       ├── sessions.json    # Persistent session storage
│       └── users.json       # User authentication
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx          # Navigation with session search
│   │   │   ├── EmailSettings.tsx     # SMTP configuration panel
│   │   │   ├── ExportReport.tsx      # PDF/JSON/Markdown export
│   │   │   ├── AgentFlowDiagram.tsx  # Pipeline visualization
│   │   │   ├── ConfidenceTimeline.tsx # Confidence score chart
│   │   │   └── Dashboard.tsx         # Analytics dashboard
│   │   ├── pages/
│   │   │   ├── Landing.tsx   # Premium landing with pricing
│   │   │   ├── Chat.tsx      # Main chat interface
│   │   │   └── Login.tsx     # Authentication
│   │   ├── App.tsx           # Router setup
│   │   └── index.css         # Tailwind styles
│   └── package.json
└── TODO.md
```

---

## 📄 License

Proprietary - All rights reserved. Built for commercial deployment.

---

Built with ❤️ using LangGraph, Groq, FastAPI, and React.
