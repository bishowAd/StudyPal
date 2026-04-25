import os
import json
import google.generativeai as genai

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
_model = genai.GenerativeModel('gemini-2.5-flash')


def ask_ai(prompt: str) -> str:
    response = _model.generate_content(prompt)
    return response.text


def ask_ai_json(prompt: str) -> dict:
    full_prompt = prompt + "\n\nRespond with valid JSON only, no markdown fences."
    response = _model.generate_content(full_prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def ask_ai_stream(prompt: str):
    response = _model.generate_content(prompt, stream=True)
    for chunk in response:
        if chunk.text:
            yield chunk.text
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

