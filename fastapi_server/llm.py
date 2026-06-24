from openai import AsyncOpenAI
from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL

# Using AsyncOpenAI since FastAPI is async
client = AsyncOpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url=OPENROUTER_BASE_URL,
    default_headers={
        "HTTP-Referer": "http://localhost:5173", # Need to provide this to openrouter
        "X-Title": "Orbiq Support"
    }
)
