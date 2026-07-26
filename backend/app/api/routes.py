import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import QueryRequest, QueryResponse, SessionState
from app.services.state_manager import create_session, get_session
from app.agents.agent_orchestrator import run_jury_workflow

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest, background_tasks: BackgroundTasks):
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
