from google import genai
from google.genai import types
import os

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))


def ask_ai(prompt: str, system: str = None) -> str:
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    response = client.models.generate_content(
        model    = 'gemini-2.5-flash',
        contents = full_prompt,
    )
    return response.text


def ask_ai_json(prompt: str, system: str = None) -> str:
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    response = client.models.generate_content(
        model    = 'gemini-2.5-flash',
        contents = full_prompt,
        config   = types.GenerateContentConfig(
            response_mime_type = 'application/json',
            temperature        = 0.1,
        ),
    )
    text = response.text.strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[-1]
        text = text.rsplit('```', 1)[0].strip()
    return text