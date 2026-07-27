import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import QueryRequest, QueryResponse, SessionState, Message
from app.services.state_manager import create_session, get_session, update_session
from app.agents.agent_orchestrator import run_jury_workflow

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest, background_tasks: BackgroundTasks):
    if request.session_id:
        state = get_session(request.session_id)
        if not state:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Archive the previous turn into history
        if state.verdict:
            state.history.append(Message(role="user", content=state.prompt))
            state.history.append(Message(role="assistant", content=state.verdict.final_answer, verdict=state.verdict))
            
        # Reset state for new query
        state.prompt = request.prompt
        state.status = "Initializing"
        state.extracted_claims = []
        state.disputed_claims = []
        state.debates = []
        state.verdict = None
        state.logs = []
        
        update_session(request.session_id, state)
        session_id = request.session_id
    else:
        session_id = create_session(request.prompt)
    
    # We will trigger the orchestrator workflow in the background
    background_tasks.add_task(run_jury_workflow, session_id)
    
    return QueryResponse(session_id=session_id, status="Started")

@router.get("/session/{session_id}", response_model=SessionState)
async def get_session_state(session_id: str):
    state = get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state

from app.models.schemas import LoginRequest, SignupRequest, AuthResponse, SessionSummary
from app.services.state_manager import get_all_sessions, register_user, authenticate_user
from typing import List
import os

@router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    if not request.username.strip() or not request.password.strip():
        raise HTTPException(status_code=400, detail="Username and password are required")
        
    success, msg = register_user(request.username, request.password)
    if success:
        return AuthResponse(success=True, detail=msg, token=f"fake-jwt-token-{request.username}")
    else:
        raise HTTPException(status_code=400, detail=msg)

@router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    if authenticate_user(request.username, request.password):
        return AuthResponse(success=True, token=f"fake-jwt-token-{request.username}")
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")

@router.get("/sessions", response_model=List[SessionSummary])
async def list_sessions():
    return get_all_sessions()
