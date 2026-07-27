import os
import json
import uuid
from typing import Dict, Tuple
from app.models.schemas import SessionState

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

SESSIONS_FILE = os.path.join(DATA_DIR, "sessions.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")

sessions: Dict[str, SessionState] = {}
users: Dict[str, str] = {} # username -> password

def _load_data_from_disk():
    global sessions, users
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                users = json.load(f)
        except Exception as e:
            print(f"Error loading users.json: {e}")
            
    if os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                raw_sessions = json.load(f)
                for sid, sdata in raw_sessions.items():
                    sessions[sid] = SessionState(**sdata)
        except Exception as e:
            print(f"Error loading sessions.json: {e}")

def _save_data_to_disk():
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
            
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            serialized_sessions = {sid: sstate.dict() for sid, sstate in sessions.items()}
            json.dump(serialized_sessions, f, indent=2)
    except Exception as e:
        print(f"Error saving data to disk: {e}")

# Load initial data on server start
_load_data_from_disk()

def register_user(username: str, password: str) -> Tuple[bool, str]:
    if username in users:
        return False, "Username already exists"
    users[username] = password
    _save_data_to_disk()
    return True, "User registered successfully"

def authenticate_user(username: str, password: str) -> bool:
    return users.get(username) == password

def create_session(prompt: str) -> str:
    session_id = str(uuid.uuid4())
    sessions[session_id] = SessionState(session_id=session_id, prompt=prompt)
    _save_data_to_disk()
    return session_id

def get_session(session_id: str) -> SessionState:
    return sessions.get(session_id)

def update_session(session_id: str, state: SessionState):
    sessions[session_id] = state
    _save_data_to_disk()

def log_event(session_id: str, message: str, level: str = "INFO"):
    state = get_session(session_id)
    if state:
        state.logs.append({"level": level, "message": message})
        update_session(session_id, state)

def get_all_sessions() -> list:
    """Returns a simplified list of all sessions for the sidebar"""
    session_list = []
    for sid, state in reversed(sessions.items()):
        session_list.append({
            "session_id": state.session_id,
            "prompt": state.prompt,
            "status": state.status
        })
    return session_list
