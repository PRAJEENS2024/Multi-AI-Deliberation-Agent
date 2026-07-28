import os
import json
import uuid
from typing import Dict, Tuple, Optional
from datetime import datetime
from app.models.schemas import SessionState, EmailConfig, AgentMetrics, SessionSummary

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

SESSIONS_FILE = os.path.join(DATA_DIR, "sessions.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
EMAIL_CONFIG_FILE = os.path.join(DATA_DIR, "email_config.json")

sessions: Dict[str, SessionState] = {}
users: Dict[str, str] = {} # username -> password
email_config: Optional[EmailConfig] = None

def _load_data_from_disk():
    global sessions, users, email_config
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
    
    if os.path.exists(EMAIL_CONFIG_FILE):
        try:
            with open(EMAIL_CONFIG_FILE, "r", encoding="utf-8") as f:
                email_config = EmailConfig(**json.load(f))
        except Exception as e:
            print(f"Error loading email_config.json: {e}")

def _save_data_to_disk():
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
            
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            serialized_sessions = {sid: sstate.dict() for sid, sstate in sessions.items()}
            json.dump(serialized_sessions, f, indent=2)
    except Exception as e:
        print(f"Error saving data to disk: {e}")

def _save_email_config():
    if email_config:
        try:
            with open(EMAIL_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(email_config.dict(), f, indent=2)
        except Exception as e:
            print(f"Error saving email config: {e}")

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

def create_session(prompt: str, user_email: str = None, send_email: bool = False) -> str:
    session_id = str(uuid.uuid4())
    sessions[session_id] = SessionState(
        session_id=session_id,
        prompt=prompt,
        user_email=user_email,
        send_email=send_email,
    )
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
            "status": state.status,
            "confidence_score": state.verdict.confidence_score if state.verdict else None,
            "created_at": state.created_at,
        })
    return session_list


# ── Email Configuration ───────────────────────────────────────────────────────
def get_email_config() -> Optional[EmailConfig]:
    return email_config


def save_email_config(config: EmailConfig):
    global email_config
    email_config = config
    _save_email_config()


# ── Agent Metrics ─────────────────────────────────────────────────────────────
def get_agent_metrics() -> AgentMetrics:
    """Calculate aggregate metrics from all sessions."""
    total_sessions = len(sessions)
    completed_sessions = [s for s in sessions.values() if s.verdict is not None]
    
    if completed_sessions:
        avg_confidence = sum(s.verdict.confidence_score for s in completed_sessions) / len(completed_sessions)
    else:
        avg_confidence = 0.0
    
    total_claims = sum(len(s.extracted_claims) for s in sessions.values())
    total_disputes = sum(len(s.disputed_claims) for s in sessions.values())
    
    # Agent performance stats
    agent_stats = {}
    for s in sessions.values():
        for a in s.agent_pipeline:
            if a.agent_name not in agent_stats:
                agent_stats[a.agent_name] = {
                    "agent_name": a.agent_name,
                    "avatar": a.avatar,
                    "color": a.color,
                    "total_runs": 0,
                    "completed_runs": 0,
                    "avg_duration_ms": 0,
                    "avg_confidence": 0,
                }
            agent_stats[a.agent_name]["total_runs"] += 1
            if a.status == "completed":
                agent_stats[a.agent_name]["completed_runs"] += 1
            if a.confidence_at_stage is not None:
                cur = agent_stats[a.agent_name]["avg_confidence"]
                cnt = agent_stats[a.agent_name]["total_runs"]
                agent_stats[a.agent_name]["avg_confidence"] = (cur * (cnt - 1) + a.confidence_at_stage) / cnt
    
    recent = []
    for sid, s in list(reversed(sessions.items()))[:10]:
        recent.append({
            "session_id": s.session_id,
            "prompt": s.prompt,
            "status": s.status,
            "confidence_score": s.verdict.confidence_score if s.verdict else None,
            "created_at": s.created_at,
        })
    
    return AgentMetrics(
        total_sessions=total_sessions,
        avg_confidence=round(avg_confidence, 1),
        total_claims_verified=total_claims,
        total_disputes_resolved=total_disputes,
        agent_performance=list(agent_stats.values()),
        recent_sessions=recent,
    )
