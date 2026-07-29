import os
from dotenv import load_dotenv

load_dotenv()

gemini_key = os.getenv("GEMINI_API_KEY")
groq_key = os.getenv("GROQ_API_KEY")

if gemini_key:
    from google import genai
    client = genai.Client(api_key=gemini_key)
    for m in client.models.list():
        if "generateContent" in m.supported_actions:
            print(m.name)
elif groq_key:
    from groq import Groq
    client = Groq(api_key=groq_key)
    for m in client.models.list().data:
        print(m.id)
else:
    print("No API key found in .env")

