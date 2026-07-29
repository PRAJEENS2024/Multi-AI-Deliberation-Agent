import os
import json
import uuid
from typing import Dict, Tuple, Optional, List
from datetime import datetime
from app.models.schemas import SessionState, EmailConfig, AgentMetrics, SessionSummary, UserProfile

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

SESSIONS_FILE = os.path.join(DATA_DIR, "sessions.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
PROFILES_FILE = os.path.join(DATA_DIR, "profiles.json")
EMAIL_CONFIG_FILE = os.path.join(DATA_DIR, "email_config.json")

sessions: Dict[str, SessionState] = {}
users: Dict[str, dict] = {}  # username -> {"password": str, "email": str, "user_id": str}
profiles: Dict[str, dict] = {}  # user_id or username -> UserProfile dict
email_config: Optional[EmailConfig] = None

def _load_data_from_disk():
    global sessions, users, profiles, email_config
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                raw_users = json.load(f)
            users = {}
            for uname, val in raw_users.items():
                if isinstance(val, str):
                    users[uname] = {"password": val, "email": "", "user_id": uname}
                else:
                    if "user_id" not in val:
                        val["user_id"] = uname
                    users[uname] = val
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
                raw_sessions = json.load(f)
                for sid, sdata in raw_sessions.items():
                    # Auto-migrate/backfill user_id from user_email if user_id is missing or None
                    if not sdata.get("user_id") and sdata.get("user_email"):
                        em = sdata.get("user_email").lower().strip()
                        for uname, udata in users.items():
                            if isinstance(udata, dict) and udata.get("email") and udata.get("email").lower().strip() == em:
                                sdata["user_id"] = uname
                                break
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

        with open(PROFILES_FILE, "w", encoding="utf-8") as f:
            json.dump(profiles, f, indent=2)

        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            serialized_sessions = {sid: sstate.model_dump() for sid, sstate in sessions.items()}
            json.dump(serialized_sessions, f, indent=2)
    except Exception as e:
        print(f"Error saving data to disk: {e}")

def _save_email_config():
    if email_config:
        try:
            with open(EMAIL_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(email_config.model_dump(), f, indent=2)
        except Exception as e:
            print(f"Error saving email config: {e}")

# Load initial data on server start
_load_data_from_disk()

def register_user(username: str, password: str, email: str = "") -> Tuple[bool, str, Optional[str]]:
    if username in users:
        return False, "Username already exists", None
    user_id = str(uuid.uuid4())
    users[username] = {"password": password, "email": email, "user_id": user_id}
    profiles[username] = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "full_name": username.capitalize(),
        "avatar_url": "",
        "theme_preference": "dark",
        "groq_api_key": "",
        "notifications_enabled": True,
        "email_reports_enabled": True,
    }
    _save_data_to_disk()
    return True, "User registered successfully", user_id

def authenticate_user(username: str, password: str) -> Tuple[bool, Optional[str], Optional[str]]:
    user = users.get(username)
    if isinstance(user, dict):
        if user.get("password") == password:
            return True, user.get("email"), user.get("user_id", username)
        return False, None, None
    if isinstance(user, str) and user == password:
        return True, "", username
    return False, None, None

def get_user_profile(username_or_id: str) -> UserProfile:
    # Try by username or user_id
    prof = profiles.get(username_or_id)
    if not prof:
        for u_key, u_val in users.items():
            if u_val.get("user_id") == username_or_id or u_key == username_or_id:
                prof = profiles.get(u_key)
                break
    if not prof:
        user_info = users.get(username_or_id, {})
        prof = {
            "user_id": user_info.get("user_id", username_or_id),
            "username": username_or_id,
            "email": user_info.get("email", ""),
            "full_name": username_or_id.capitalize(),
            "avatar_url": "",
            "theme_preference": "dark",
            "groq_api_key": "",
            "notifications_enabled": True,
            "email_reports_enabled": True,
        }
    return UserProfile(**prof)

def update_user_profile(username_or_id: str, updates: dict) -> UserProfile:
    current = get_user_profile(username_or_id)
    cur_dict = current.model_dump()
    for k, v in updates.items():
        if v is not None and k in cur_dict:
            cur_dict[k] = v
    profiles[current.username] = cur_dict
    if "email" in updates and updates["email"]:
        if current.username in users and isinstance(users[current.username], dict):
            users[current.username]["email"] = updates["email"]
    _save_data_to_disk()
    return UserProfile(**cur_dict)

def get_user_email(username_or_id: str) -> Optional[str]:
    user = users.get(username_or_id)
    if isinstance(user, dict):
        return user.get("email")
    for u_key, u_val in users.items():
        if isinstance(u_val, dict):
            if u_val.get("user_id") == username_or_id or u_key == username_or_id:
                return u_val.get("email")
            if u_val.get("email") and u_val.get("email").lower().strip() == str(username_or_id).lower().strip():
                return u_val.get("email")
    return None


def create_session(prompt: str, user_email: str = None, send_email: bool = False, user_id: str = None) -> str:
    session_id = str(uuid.uuid4())
    sessions[session_id] = SessionState(
        session_id=session_id,
        prompt=prompt,
        user_id=user_id,
        user_email=user_email,
        send_email=send_email,
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

def get_all_sessions(user_id: Optional[str] = None) -> list:
    """Returns 100% user-isolated list of sessions for sidebar and search."""
    if not user_id or not str(user_id).strip():
        return []

    target_uid = str(user_id).strip()
    target_email = get_user_email(target_uid)

    session_list = []
    for sid, state in reversed(sessions.items()):
        is_owner = (state.user_id == target_uid)
        if not is_owner and state.user_email and target_email:
            if state.user_email.lower().strip() == target_email.lower().strip():
                is_owner = True
                state.user_id = target_uid

        if not is_owner:
            continue

        session_list.append({
            "session_id": state.session_id,
            "prompt": state.prompt,
            "status": state.status,
            "user_id": state.user_id,
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
def get_agent_metrics(user_id: Optional[str] = None) -> AgentMetrics:
    """Calculate aggregate metrics scoped strictly to specific user for isolated dashboard."""
    if not user_id or not str(user_id).strip():
        return AgentMetrics(
            total_sessions=0,
            avg_confidence=0.0,
            total_claims_verified=0,
            total_disputes_resolved=0,
            agent_performance=[],
            recent_sessions=[],
        )

    target_uid = str(user_id).strip()
    target_email = get_user_email(target_uid)

    target_sessions = []
    for s in sessions.values():
        is_owner = (s.user_id == target_uid)
        if not is_owner and s.user_email and target_email:
            if s.user_email.lower().strip() == target_email.lower().strip():
                is_owner = True
        if is_owner:
            target_sessions.append(s)



    total_sessions = len(target_sessions)
    completed_sessions = [s for s in target_sessions if s.verdict is not None]

    if completed_sessions:
        avg_confidence = sum(s.verdict.confidence_score for s in completed_sessions) / len(completed_sessions)
    else:
        avg_confidence = 0.0

    total_claims = sum(len(s.extracted_claims) for s in target_sessions)
    total_disputes = sum(len(s.disputed_claims) for s in target_sessions)

    agent_stats = {}
    for s in target_sessions:
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
    for s in list(reversed(target_sessions))[:10]:
        recent.append({
            "session_id": s.session_id,
            "prompt": s.prompt,
            "status": s.status,
            "user_id": s.user_id,
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

