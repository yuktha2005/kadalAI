import os
from google import genai
from google.genai import types

class GeminiService:
    def __init__(self):
        # We need the API key from environment
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is missing")
        self.client = genai.Client(api_key=self.api_key)

    def embed_text(self, text: str) -> list[float]:
        response = self.client.models.embed_content(
            model='gemini-embedding-001',
            contents=text,
        )
        return response.embeddings[0].values

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        response = self.client.models.embed_content(
            model='gemini-embedding-001',
            contents=texts,
        )
        return [emb.values for emb in response.embeddings]

    def generate_response(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
