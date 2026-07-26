import uuid
from typing import Dict
from app.models.schemas import SessionState

# In-memory store for Hackathon simplicity.
# In production, use Redis or Postgres.
sessions: Dict[str, SessionState] = {}

def create_session(prompt: str) -> str:
    session_id = str(uuid.uuid4())
    sessions[session_id] = SessionState(session_id=session_id, prompt=prompt)
    return session_id

def get_session(session_id: str) -> SessionState:
    return sessions.get(session_id)

def update_session(session_id: str, state: SessionState):
    sessions[session_id] = state

def log_event(session_id: str, message: str, level: str = "INFO"):
    state = get_session(session_id)
    if state:
        state.logs.append({"level": level, "message": message})
        update_session(session_id, state)
