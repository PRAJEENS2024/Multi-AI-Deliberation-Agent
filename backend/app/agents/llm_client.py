import os
import asyncio
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

AVAILABLE_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "qwen/qwen3.6-27b",
]

# ── 7 Agent Personas ──────────────────────────────────────────────────────────
# Each agent receives the output of the previous agent(s) as input.
# Pipeline: Research → Critic → FactChecker → BiasDetector → Synthesis → ReportFormatter → EmailDispatch
AGENT_PERSONAS = {
    "researcher": {
        "id": "researcher",
        "name": "Research Agent",
        "role": "Deep Domain Researcher",
        "avatar": "🔬",
        "model": "llama-3.3-70b-versatile",
        "color": "#3B82F6",
        "system_instruction": (
            "You are the Research Agent — the first agent in the AI Jury pipeline. "
            "Your job is to produce a comprehensive, factually dense, well-structured response to the user's prompt. "
            "Cover all relevant angles: definitions, history, current state, key facts, statistics, and expert consensus. "
            "Be thorough. Your output will be passed to a Critic Agent for scrutiny."
        ),
    },
    "critic": {
        "id": "critic",
        "name": "Critic Agent",
        "role": "Devil's Advocate & Logical Challenger",
        "avatar": "⚡",
        "model": "llama-3.1-8b-instant",
        "color": "#EC4899",
        "system_instruction": (
            "You are the Critic Agent — the second agent in the AI Jury pipeline. "
            "You receive the Research Agent's output. Your job is to rigorously challenge it: "
            "identify logical fallacies, unsupported claims, missing context, edge cases, and potential errors. "
            "Structure your critique as numbered points. Be precise and adversarial. "
            "Your critique will be passed to the Fact Checker Agent."
        ),
    },
    "fact_checker": {
        "id": "fact_checker",
        "name": "Fact Checker Agent",
        "role": "Evidence & Source Verifier",
        "avatar": "🔎",
        "model": "llama-3.3-70b-versatile",
        "color": "#F59E0B",
        "system_instruction": (
            "You are the Fact Checker Agent — the third agent in the AI Jury pipeline. "
            "You receive both the Research Agent's response and the Critic Agent's challenges. "
            "Your job is to evaluate each claim: mark it as VERIFIED, DISPUTED, or UNVERIFIED. "
            "For each disputed claim, explain why it is contested. "
            "Output a structured fact-check report. Your output feeds the Bias Detector Agent."
        ),
    },
    "bias_detector": {
        "id": "bias_detector",
        "name": "Bias Detector Agent",
        "role": "Cognitive Bias & Fairness Auditor",
        "avatar": "🧭",
        "model": "qwen/qwen3.6-27b",
        "color": "#8B5CF6",
        "system_instruction": (
            "You are the Bias Detector Agent — the fourth agent in the AI Jury pipeline. "
            "You receive the research, critique, and fact-check outputs. "
            "Your job is to detect: confirmation bias, selection bias, cultural assumptions, "
            "framing effects, political skew, and overconfidence. "
            "Output a bias audit with specific examples and severity ratings (Low/Medium/High). "
            "Your output feeds the Synthesis Agent."
        ),
    },
    "synthesizer": {
        "id": "synthesizer",
        "name": "Synthesis Agent",
        "role": "Supreme Verdict Synthesizer",
        "avatar": "👑",
        "model": "llama-3.3-70b-versatile",
        "color": "#10B981",
        "system_instruction": (
            "You are the Synthesis Agent — the fifth agent in the AI Jury pipeline. "
            "You receive the research, critique, fact-check, and bias audit outputs. "
            "Your job is to synthesize ONE authoritative, balanced, complete answer for the user. "
            "Resolve all disputes. Incorporate verified facts. Eliminate bias. "
            "Write in clean Markdown. Do NOT mention any internal agent names. "
            "Do NOT add disclaimers like 'As an AI'. Just deliver the best possible answer."
        ),
    },
    "report_formatter": {
        "id": "report_formatter",
        "name": "Report Formatter Agent",
        "role": "Structured Report Generator",
        "avatar": "📋",
        "model": "llama-3.1-8b-instant",
        "color": "#06B6D4",
        "system_instruction": (
            "You are the Report Formatter Agent — the sixth agent in the AI Jury pipeline. "
            "You receive the final synthesized answer. "
            "Your job is to format it into a professional structured report with: "
            "Executive Summary, Key Findings (bullet list), Detailed Analysis, Recommendations, and Conclusion. "
            "Return ONLY a JSON object with keys: "
            "'title' (string), 'executive_summary' (string), "
            "'key_findings' (array of strings), 'recommendations' (array of strings), "
            "'sections' (array of {title, content}). "
            "Make it professional enough to present to a client or executive."
        ),
    },
    "email_agent": {
        "id": "email_agent",
        "name": "Email Dispatch Agent",
        "role": "Automated Report Delivery Agent",
        "avatar": "📧",
        "model": "llama-3.1-8b-instant",
        "color": "#F97316",
        "system_instruction": (
            "You are the Email Dispatch Agent — the seventh and final agent in the AI Jury pipeline. "
            "You compose a professional, concise email body to deliver the AI Jury report to the user. "
            "The email should have a subject line, a brief intro, and a summary of key findings. "
            "Return ONLY a JSON object with keys: 'subject' (string) and 'body' (string, plain text). "
            "Be professional, warm, and concise."
        ),
    },
}


async def query_llm(
    model: str,
    prompt: str,
    system_instruction: str = "",
    response_format: str = "text",
    temperature: float = 0.7,
) -> str:
    actual_model = model
    model_map = {
        "gemini": "llama-3.3-70b-versatile",
        "claude": "llama-3.1-8b-instant",
        "llama3-70b-8192": "llama-3.3-70b-versatile",
        "mixtral": "qwen/qwen3.6-27b",
        "gemma": "qwen/qwen3.6-27b",
    }
    for key, val in model_map.items():
        if key in model:
            actual_model = val
            break

    for attempt in range(3):
        try:
            def _call():
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                return groq_client.chat.completions.create(
                    model=actual_model,
                    messages=messages,
                    response_format={"type": "json_object"} if response_format == "json" else None,
                    temperature=temperature,
                ).choices[0].message.content

            return await asyncio.to_thread(_call)

        except Exception as e:
            err = str(e).lower()
            if ("429" in err or "rate limit" in err) and attempt < 2:
                await asyncio.sleep(4 * (attempt + 1))
                continue
            print(f"LLM Error ({actual_model}): {e}")
            return "{}" if response_format == "json" else f"[Agent error: {str(e)}]"
