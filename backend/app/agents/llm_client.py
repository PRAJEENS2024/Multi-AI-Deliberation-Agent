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
