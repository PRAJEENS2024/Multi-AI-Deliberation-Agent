import os
import json
import asyncio
from typing import Dict, Any, List
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

AVAILABLE_MODELS = [
    "gemini-1.5-pro",
    "gpt-4o",
    "claude-3.5-sonnet"
]

def get_genai_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    return genai.Client(api_key=api_key)

async def query_llm(model: str, prompt: str, system_prompt: str = "", response_format: str = "text") -> str:
    """
    Live LLM client. We use Gemini to simulate the other models by passing
    a system prompt that tells it to act like the target model.
    """
    client = get_genai_client()
    
    # If no API key, fallback to mock (for safety if user forgets to add key)
    if not client:
        await asyncio.sleep(2)
        if response_format == "json":
            return json.dumps([{"claim": "Mocked claim due to missing API key.", "category": "Fact", "confidence": "High", "model": model}])
        return f"[MOCK - No API Key] This is a simulated response from {model} for: '{prompt[:30]}...'"
    
    # Base system prompt to enforce persona
    persona_prompt = f"You are acting as {model}. Provide an expert, detailed, and distinct perspective."
    if system_prompt:
        persona_prompt += f" {system_prompt}"
        
    config = types.GenerateContentConfig(
        system_instruction=persona_prompt,
        temperature=0.7
    )
    
    if response_format == "json":
        config.response_mime_type = "application/json"
    
    # Use gemini-3.5-flash for speed and reliability.
    target_engine = "gemini-3.5-flash"
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # We must wrap the sync call in to_thread because google-genai is sync
            def fetch():
                response = client.models.generate_content(
                    model=target_engine,
                    contents=prompt,
                    config=config
                )
                return response.text
                
            result = await asyncio.to_thread(fetch)
            return result
        except Exception as e:
            err_str = str(e)
            if "429" in err_str and attempt < max_retries - 1:
                print(f"Rate limited. Retrying in {4 * (attempt + 1)} seconds...")
                await asyncio.sleep(4 * (attempt + 1))
                continue
            
            print(f"LLM Error: {e}")
            if response_format == "json":
                return "[]"
            return f"Error communicating with model {model}."
