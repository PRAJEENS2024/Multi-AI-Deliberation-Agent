import os
import json
import uuid
from typing import Dict, Tuple, Optional
from app.models.schemas import SessionState

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

SESSIONS_FILE = os.path.join(DATA_DIR, "sessions.json")
USERS_FILE    = os.path.join(DATA_DIR, "users.json")
PROFILES_FILE = os.path.join(DATA_DIR, "profiles.json")

sessions: Dict[str, SessionState] = {}
users:    Dict[str, str]           = {}   # username -> password
profiles: Dict[str, dict]          = {}   # username -> profile dict


def _load_data_from_disk():
    global sessions, users, profiles

    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                users = json.load(f)
        except Exception as e:
            print(f"Error loading users.json: {e}")

    if os.path.exists(PROFILES_FILE):
        try:
            with open(PROFILES_FILE, "r", encoding="utf-8") as f:
                profiles = json.load(f)
        except Exception as e:
            print(f"Error loading profiles.json: {e}")

    if os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                raw = json.load(f)
                for sid, sdata in raw.items():
                    try:
                        sessions[sid] = SessionState(**sdata)
                    except Exception:
                        pass
        except Exception as e:
            print(f"Error loading sessions.json: {e}")


def _save_data_to_disk():
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
        with open(PROFILES_FILE, "w", encoding="utf-8") as f:
            json.dump(profiles, f, indent=2)
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            serialized = {sid: s.dict() for sid, s in sessions.items()}
            json.dump(serialized, f, indent=2)
    except Exception as e:
        print(f"Error saving data: {e}")


_load_data_from_disk()


# ── Auth ──────────────────────────────────────────────────────────────────────
def register_user(username: str, password: str, email: str = None) -> Tuple[bool, str]:
    if username in users:
        return False, "Username already exists"
    users[username] = password
    profiles[username] = {
        "user_id":               username,
        "username":              username,
        "email":                 email or "",
        "full_name":             username.capitalize(),
        "groq_api_key":          "",
        "notifications_enabled": True,
        "email_reports_enabled": True,
    }
    _save_data_to_disk()
    return True, "User registered successfully"


def authenticate_user(username: str, password: str) -> bool:
    return users.get(username) == password


# ── Profile ───────────────────────────────────────────────────────────────────
def get_user_profile(username: str) -> Optional[dict]:
    return profiles.get(username)


def update_user_profile(username: str, data: dict) -> Optional[dict]:
    if username not in users:
        return None
    if username not in profiles:
        profiles[username] = {"user_id": username, "username": username}
    if "password" in data and data["password"]:
        users[username] = data.pop("password")
    profiles[username].update({k: v for k, v in data.items() if v is not None})
    _save_data_to_disk()
    return profiles[username]


# ── Sessions ──────────────────────────────────────────────────────────────────
def create_session(
    prompt:     str,
    user_email: str  = None,
    send_email: bool = False,
    user_id:    str  = "",
) -> str:
    session_id = str(uuid.uuid4())
    sessions[session_id] = SessionState(
        session_id = session_id,
        prompt     = prompt,
        user_email = user_email,
        send_email = send_email,
        user_id    = user_id,
    )
    _save_data_to_disk()
    return session_id


def get_session(session_id: str) -> Optional[SessionState]:
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
    return [
        {
            "session_id":       s.session_id,
            "prompt":           s.prompt,
            "status":           s.status,
            "user_id":          getattr(s, "user_id", None),
            "confidence_score": s.verdict.confidence_score if s.verdict else None,
            "created_at":       getattr(s, "created_at", None),
        }
        for s in reversed(list(sessions.values()))
    ]


def get_user_sessions(user_id: str) -> list:
    return [
        {
            "session_id":       s.session_id,
            "prompt":           s.prompt,
            "status":           s.status,
            "user_id":          getattr(s, "user_id", None),
            "confidence_score": s.verdict.confidence_score if s.verdict else None,
            "created_at":       getattr(s, "created_at", None),
        }
        for s in reversed(list(sessions.values()))
        if getattr(s, "user_id", "") == user_id
    ]
