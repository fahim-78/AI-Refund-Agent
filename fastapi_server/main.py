from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
import uuid

from config import CLIENT_ORIGIN
from agent.agent_loop import run_agent_turn
from utils.session_store import create_session, get_session, append_message, list_sessions, delete_session
from agent.policy_engine import customers as all_customers, orders as all_orders

from auth import get_current_user, get_admin_user, create_access_token, verify_password, get_user
from init_db import init_db

init_db()  # Initialize the database on startup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    sessionId: str
    message: str

class LoginRequest(BaseModel):
    email: str
    password: str

class MockGoogleLoginRequest(BaseModel):
    email: str

@app.post("/api/auth/admin/login")
async def admin_login(req: LoginRequest):
    user = get_user(req.email)
    if not user or user["role"] != "admin" or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    token = create_access_token({"sub": user["email"], "role": user["role"]})
    return {"token": token, "user": {"email": user["email"], "role": user["role"]}}

@app.post("/api/auth/mock-google")
async def mock_google_login(req: MockGoogleLoginRequest):
    # Mocking Google login. In a real scenario, you'd verify a token from Google.
    token = create_access_token({"sub": req.email, "role": "customer"})
    return {"token": token, "user": {"email": req.email, "role": "customer"}}

@app.get("/api/customers")
async def get_customers():
    return [
        {
            "customer_id": c["customer_id"],
            "name": c["name"],
            "email": c["email"],
            "tier": c["tier"],
        }
        for c in all_customers
    ]

@app.post("/api/session")
async def post_session():
    session_id = str(uuid.uuid4())
    create_session(session_id)
    return {"sessionId": session_id}

@app.get("/api/session/{session_id}")
async def get_single_session(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest, user: dict = Depends(get_current_user)):
    session_id = req.sessionId
    user_message = req.message

    session = create_session(session_id)
    
    result = await run_agent_turn(
        session_id=session_id,
        history=session["messages"],
        user_message=user_message
    )
    
    session["messages"] = result["messages"]

    return {
        "reply": result["finalText"],
        "sessionId": session_id
    }

@app.get("/api/sessions")
async def get_all_sessions_legacy():
    return list_sessions()

@app.delete("/api/session/{session_id}")
async def delete_single_session(session_id: str):
    delete_session(session_id)
    return {"success": True}

# Admin endpoints
@app.get("/api/admin/sessions")
async def get_admin_sessions(admin: dict = Depends(get_admin_user)):
    return list_sessions()

@app.get("/api/admin/sessions/{session_id}")
async def get_admin_session(session_id: str, admin: dict = Depends(get_admin_user)):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.get("/api/admin/crm")
async def get_admin_crm(admin: dict = Depends(get_admin_user)):
    return {
        "customers": all_customers,
        "orders": all_orders
    }

# Simple SSE endpoint for admin dashboard updates
from fastapi.responses import StreamingResponse
from utils.logger import add_log_listener

@app.get("/api/stream-logs")
async def stream_logs():
    async def event_generator():
        queue = asyncio.Queue()
        
        def listener(event, data):
            queue.put_nowait(data)
            
        add_log_listener(listener)
        
        try:
            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")

