from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.models.schemas import (
    QueryRequest, QueryResponse, SessionState, Message,
    LoginRequest, SignupRequest, AuthResponse, SessionSummary,
    EmailSettingsRequest,
)
from app.services.state_manager import (
    create_session, get_session, update_session,
    get_all_sessions, get_user_sessions,
    register_user, authenticate_user,
    get_user_profile, update_user_profile,
)
from app.agents.agent_orchestrator import run_jury_workflow

router = APIRouter()


# ── Query ─────────────────────────────────────────────────────────────────────
@router.post("/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest, background_tasks: BackgroundTasks):
    user_id = getattr(request, "user_id", None) or ""
    if request.session_id:
        state = get_session(request.session_id)
        if not state:
            raise HTTPException(status_code=404, detail="Session not found")
        if state.verdict:
            state.history.append(Message(role="user", content=state.prompt))
            state.history.append(Message(role="assistant", content=state.verdict.final_answer, verdict=state.verdict))
        state.prompt           = request.prompt
        state.status           = "Initializing"
        state.extracted_claims = []
        state.disputed_claims  = []
        state.debates          = []
        state.debate_turns     = []
        state.agent_thoughts   = []
        state.verdict          = None
        state.logs             = []
        state.user_email       = request.email or state.user_email
        state.send_email       = request.send_email
        update_session(request.session_id, state)
        session_id = request.session_id
    else:
        session_id = create_session(
            prompt     = request.prompt,
            user_email = request.email,
            send_email = request.send_email,
            user_id    = user_id,
        )
    background_tasks.add_task(run_jury_workflow, session_id)
    return QueryResponse(session_id=session_id, status="Started")


# ── Session ───────────────────────────────────────────────────────────────────
@router.get("/session/{session_id}", response_model=SessionState)
async def get_session_state(session_id: str):
    state = get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state


@router.get("/sessions", response_model=List[SessionSummary])
async def list_sessions(user_id: Optional[str] = Query(None)):
    if user_id:
        return get_user_sessions(user_id)
    return get_all_sessions()


# ── Metrics ───────────────────────────────────────────────────────────────────
@router.get("/metrics")
async def get_metrics(user_id: Optional[str] = Query(None)):
    from app.services.state_manager import sessions
    all_s = list(sessions.values())
    if user_id:
        all_s = [s for s in all_s if getattr(s, "user_id", "") == user_id]

    completed  = [s for s in all_s if s.status == "Completed" and s.verdict]
    avg_conf   = round(sum(s.verdict.confidence_score for s in completed) / len(completed), 1) if completed else 0
    total_claims   = sum(len(s.extracted_claims) for s in all_s)
    total_disputes = sum(len(s.disputed_claims)  for s in all_s)

    agent_defs = [
        {"agent_id": "researcher",       "agent_name": "Research Agent",    "avatar": "🔬", "color": "#3B82F6"},
        {"agent_id": "critic",           "agent_name": "Critic Agent",      "avatar": "⚡", "color": "#EC4899"},
        {"agent_id": "fact_checker",     "agent_name": "Fact Checker",      "avatar": "🔎", "color": "#F59E0B"},
        {"agent_id": "bias_detector",    "agent_name": "Bias Auditor",      "avatar": "🧭", "color": "#8B5CF6"},
        {"agent_id": "synthesizer",      "agent_name": "Synthesis Agent",   "avatar": "👑", "color": "#10B981"},
        {"agent_id": "report_formatter", "agent_name": "Report Formatter",  "avatar": "📋", "color": "#06B6D4"},
        {"agent_id": "email_agent",      "agent_name": "Email Dispatch",    "avatar": "📧", "color": "#F97316"},
    ]
    agent_perf = []
    for a in agent_defs:
        runs = sum(1 for s in all_s if any(t.persona_id == a["agent_id"] for t in s.agent_thoughts))
        agent_perf.append({**a, "total_runs": runs, "completed_runs": runs, "avg_confidence": avg_conf})

    recent = []
    for s in list(reversed(all_s))[:10]:
        recent.append({
            "session_id":       s.session_id,
            "prompt":           s.prompt,
            "status":           s.status,
            "confidence_score": s.verdict.confidence_score if s.verdict else None,
            "created_at":       None,
        })

    return {
        "total_sessions":          len(all_s),
        "avg_confidence":          avg_conf,
        "total_claims_verified":   total_claims,
        "total_disputes_resolved": total_disputes,
        "agent_performance":       agent_perf,
        "recent_sessions":         recent,
    }


# ── Email Config ──────────────────────────────────────────────────────────────
class EmailConfigRequest(BaseModel):
    smtp_host:   str  = "smtp.gmail.com"
    smtp_port:   int  = 587
    smtp_user:   str  = ""
    smtp_pass:   str  = ""
    sender_name: str  = "AI Jury"
    use_tls:     bool = True

_email_config: Dict[str, Any] = {}

@router.get("/email-config")
async def get_email_config():
    import os
    return {
        "smtp_host":   _email_config.get("smtp_host",   os.getenv("SMTP_HOST", "smtp.gmail.com")),
        "smtp_port":   _email_config.get("smtp_port",   int(os.getenv("SMTP_PORT", "587"))),
        "smtp_user":   _email_config.get("smtp_user",   os.getenv("SMTP_USER", "")),
        "smtp_pass":   "",
        "sender_name": _email_config.get("sender_name", "AI Jury"),
        "use_tls":     _email_config.get("use_tls",     True),
    }

@router.post("/email-config")
async def save_email_config(req: EmailConfigRequest):
    import os
    _email_config.update(req.dict())
    os.environ["SMTP_HOST"] = req.smtp_host
    os.environ["SMTP_PORT"] = str(req.smtp_port)
    os.environ["SMTP_USER"] = req.smtp_user
    os.environ["SMTP_PASS"] = req.smtp_pass
    return {"status": "saved"}

@router.post("/email-config/test")
async def test_email_config(req: EmailConfigRequest):
    import smtplib
    try:
        with smtplib.SMTP(req.smtp_host, req.smtp_port, timeout=10) as s:
            s.ehlo()
            if req.use_tls:
                s.starttls()
            s.login(req.smtp_user, req.smtp_pass)
        return {"message": f"SMTP connection to {req.smtp_host}:{req.smtp_port} successful!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SMTP test failed: {str(e)}")


# ── Profile ───────────────────────────────────────────────────────────────────
class ProfileUpdateRequest(BaseModel):
    full_name:             Optional[str]  = None
    email:                 Optional[str]  = None
    groq_api_key:          Optional[str]  = None
    password:              Optional[str]  = None
    notifications_enabled: bool = True
    email_reports_enabled: bool = True

@router.get("/profile/{username}")
async def get_profile(username: str):
    profile = get_user_profile(username)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile

@router.put("/profile/{username}")
async def update_profile(username: str, req: ProfileUpdateRequest):
    updated = update_user_profile(username, req.dict(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


# ── Send Report on Demand ─────────────────────────────────────────────────────
@router.post("/send-report")
async def send_report(request: EmailSettingsRequest, background_tasks: BackgroundTasks):
    state = get_session(request.session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    if state.status != "Completed" or not state.verdict:
        raise HTTPException(status_code=400, detail="Session is not completed yet.")

    from app.agents.agent_email import compose_and_send_email
    report_data = {}
    if state.verdict.report:
        r = state.verdict.report
        report_data = {
            "title":             r.title,
            "executive_summary": r.executive_summary,
            "key_findings":      r.key_findings,
            "recommendations":   r.recommendations,
            "sections":          [s.dict() for s in r.sections],
        }

    async def _dispatch():
        success, msg = await compose_and_send_email(
            recipient_email  = request.email,
            prompt           = state.prompt,
            final_answer     = state.verdict.final_answer,
            report_data      = report_data,
            confidence_score = state.verdict.confidence_score,
            debate_turns     = [t.dict() for t in state.debate_turns],
            consensus_claims = [c.dict() for c in state.verdict.consensus_claims],
            disputed_claims  = [d.dict() for d in state.verdict.disputed_claims],
        )
        s = get_session(request.session_id)
        if s and s.verdict and s.verdict.report:
            s.verdict.report.email_sent      = success
            s.verdict.report.email_recipient = request.email
            update_session(request.session_id, s)

    background_tasks.add_task(_dispatch)
    return {"status": "dispatching", "message": f"PDF report is being generated and sent to {request.email}"}


# ── Auth ──────────────────────────────────────────────────────────────────────
@router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    if not request.username.strip() or not request.password.strip():
        raise HTTPException(status_code=400, detail="Username and password are required")
    success, msg = register_user(
        request.username, request.password,
        email=getattr(request, "email", None)
    )
    if success:
        return AuthResponse(
            success=True,
            detail=msg,
            token=f"token-{request.username}",
            user_id=request.username,
            username=request.username,
            email=request.email,
        )
    raise HTTPException(status_code=400, detail=msg)


@router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    if authenticate_user(request.username, request.password):
        profile = get_user_profile(request.username) or {}
        return AuthResponse(
            success=True,
            token=f"token-{request.username}",
            user_id=request.username,
            username=request.username,
            email=profile.get("email", ""),
            detail="Login successful",
        )
    raise HTTPException(status_code=401, detail="Invalid username or password")
