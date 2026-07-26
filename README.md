# AI Jury

> "Where AI Models Debate Before Answering."

AI Jury is an Agentic AI system that orchestrates multiple LLMs (like GPT-4o, Claude 3.5 Sonnet, and Gemini) to collaboratively answer a prompt. Instead of relying on a single model's potentially hallucinated answer, AI Jury extracts claims, detects conflicts, verifies facts against external sources, and runs a structured debate among the models to reach a consensus.

## Architecture

The system utilizes 9 specialized agents orchestrated via an asynchronous Python/FastAPI engine:

1. **User Agent**: Receives and validates the user prompt.
2. **Cost & Latency Optimizer Agent**: Dynamically selects the number and type of models based on query complexity.
3. **Orchestrator Agent**: Manages parallel execution and state machine.
4. **Claim Extraction Agent**: Parses raw text responses into structured claims (Facts, Assumptions).
5. **Conflict Detection Agent**: Groups claims and identifies disagreements.
6. **Source Verification Agent**: Fact-checks disputed claims using external APIs.
7. **Evidence Evaluation Agent**: Re-scores claims based on verified external evidence.
8. **Deliberation Agent**: Conducts multi-round debates, asking models to defend or revise their opinions based on evidence.
9. **Verdict Synthesis Agent**: Generates the final, explainable answer with a calculated confidence score.

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide-React
- **Backend**: FastAPI, Python 3.12, asyncio
- **Agents**: Custom asynchronous orchestrator pattern using litellm/google-genai.

## Running Locally

### Backend
```bash
cd backend
python -m venv venv
# On Windows
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser to experience AI Jury.

## Hackathon Differentiators
- True Agentic behavior (Agents reasoning, debating, and updating state independently).
- Elegant React UI featuring real-time state streaming, glassmorphism, and micro-animations.
- Demonstrates advanced consensus-building which goes far beyond basic RAG or Chatbot wrappers.
