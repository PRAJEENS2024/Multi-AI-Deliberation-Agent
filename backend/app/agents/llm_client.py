import os
import json
import asyncio
from typing import Dict, Any, List
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Use completely free open source models hosted on Groq to avoid any quota/billing issues
AVAILABLE_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "qwen/qwen3.6-27b"
]

AGENT_PERSONAS = {
    "specialist": {
        "id": "specialist",
        "name": "Dr. Vance",
        "role": "Domain Specialist Agent",
        "avatar": "🔍",
        "model": "llama-3.3-70b-versatile",
        "color": "#3B82F6", # blue
        "system_instruction": "You are Dr. Vance, a Domain Specialist Agent. Your primary role is to provide deep, rigorous, technically accurate facts and primary evidence for the prompt."
    },
    "skeptic": {
        "id": "skeptic",
        "name": "Cipher",
        "role": "Devil's Advocate & Skeptic Agent",
        "avatar": "⚡",
        "model": "llama-3.1-8b-instant",
        "color": "#EC4899", # pink
        "system_instruction": "You are Cipher, a Devil's Advocate & Skeptic Agent. Your primary role is to challenge assumptions, point out logical fallacies, edge cases, and potential flaws in statements made by other AI agents."
    },
    "analyst": {
        "id": "analyst",
        "name": "Aura",
        "role": "Data & Logic Auditor Agent",
        "avatar": "⚖️",
        "model": "qwen/qwen3.6-27b",
        "color": "#8B5CF6", # purple
        "system_instruction": "You are Aura, a Data & Logic Auditor Agent. Your primary role is to analyze numerical claims, statistical metrics, definitions, and categorizations to ensure strict consistency."
    },
    "judge": {
        "id": "judge",
        "name": "Veritas Chief",
        "role": "Supreme Court Synthesizer Agent",
        "avatar": "👑",
        "model": "llama-3.3-70b-versatile",
        "color": "#10B981", # green
        "system_instruction": "You are Veritas Chief, the Supreme Court Synthesizer Agent. You evaluate arguments across all debate rounds, weigh web search evidence, resolve disputes, and issue the final authoritative verdict."
    }
}

async def query_llm(model: str, prompt: str, system_instruction: str = "", response_format: str = "text") -> str:
    """
    Queries the specified LLM via Groq with a prompt.
    """
    max_retries = 3
    
    # Map the model if the orchestrator still passes old names
    actual_model = model
    if "gemini" in model:
        actual_model = "llama-3.3-70b-versatile"
    elif "claude" in model:
        actual_model = "llama-3.1-8b-instant"
    elif "llama3-70b-8192" in model:
        actual_model = "llama-3.3-70b-versatile"
    elif "mixtral" in model or "gemma" in model:
        actual_model = "qwen/qwen3.6-27b"
    
    for attempt in range(max_retries):
        try:
            def fetch_groq():
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                response = groq_client.chat.completions.create(
                    model=actual_model,
                    messages=messages,
                    response_format={"type": "json_object"} if response_format == "json" else None,
                    temperature=0.7
                )
                return response.choices[0].message.content
            
            return await asyncio.to_thread(fetch_groq)
            
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "rate limit" in err_str:
                if attempt < max_retries - 1:
                    print(f"Rate limited on {actual_model}. Retrying in {4 * (attempt + 1)} seconds...")
                    await asyncio.sleep(4 * (attempt + 1))
                    continue
            
            print(f"LLM Error ({actual_model}): {e}")
            
            # HACKATHON FALLBACK
            if response_format == "json":
                return "[]"
            
            return f"[{actual_model.upper()} FALLBACK RESPONSE]: The model encountered a network error or quota exhaustion and could not generate a response for this query."
