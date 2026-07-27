import uuid
from typing import Dict, Tuple
from app.models.schemas import SessionState

# In-memory store for Hackathon simplicity.
# In production, use Redis or Postgres.
sessions: Dict[str, SessionState] = {}
users: Dict[str, str] = {} # username -> password

def register_user(username: str, password: str) -> Tuple[bool, str]:
    if username in users:
        return False, "Username already exists"
    users[username] = password
    return True, "User registered successfully"

def authenticate_user(username: str, password: str) -> bool:
    if username in users and users[username] == password:
        return True
    return False

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

def get_all_sessions() -> list:
    """Returns a simplified list of all sessions for the sidebar"""
    # Sort by creation (which is dict insertion order in Python 3.7+, or we can just reverse it)
    session_list = []
    for sid, state in reversed(sessions.items()):
        session_list.append({
            "session_id": state.session_id,
            "prompt": state.prompt,
            "status": state.status
        })
    return session_list
