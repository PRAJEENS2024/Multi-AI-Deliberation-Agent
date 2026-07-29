import json
import os
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from typing import List

from app.models.schemas import (
    QueryRequest, QueryResponse, SessionState, Message,
    LoginRequest, SignupRequest, AuthResponse, SessionSummary,
    EmailSettingsRequest, ExportRequest, ExportResponse,
    SaveEmailConfigRequest, EmailConfig, AgentMetrics, SendReportRequest,
)
from app.services.state_manager import (
    create_session, get_session, update_session,
    get_all_sessions, register_user, authenticate_user, get_user_email,
    get_email_config, save_email_config, get_agent_metrics,
)
from app.agents.agent_orchestrator import run_jury_workflow

import base64

router = APIRouter()


# ── Query ─────────────────────────────────────────────────────────────────────
@router.post("/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest, background_tasks: BackgroundTasks):
    if request.session_id:
        state = get_session(request.session_id)
        if not state:
            raise HTTPException(status_code=404, detail="Session not found")

        if state.verdict:
            state.history.append(Message(role="user", content=state.prompt))
            state.history.append(Message(role="assistant", content=state.verdict.final_answer, verdict=state.verdict))

        state.prompt              = request.prompt
        state.status              = "Initializing"
        state.extracted_claims    = []
        state.disputed_claims     = []
        state.debates             = []
        state.debate_turns        = []
        state.agent_thoughts      = []
        state.agent_pipeline      = []
        state.confidence_timeline = []
        state.verdict             = None
        state.logs                = []
        state.total_duration_ms   = None
        state.user_email          = request.email or state.user_email
        state.send_email          = request.send_email

        update_session(request.session_id, state)
        session_id = request.session_id
    else:
        session_id = create_session(
            prompt     = request.prompt,
            user_email = request.email,
            send_email = request.send_email,
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
async def list_sessions():
    return get_all_sessions()


# ── Export Report ─────────────────────────────────────────────────────────────
@router.post("/export", response_model=ExportResponse)
async def export_report(request: ExportRequest):
    """Export a completed session report in PDF, JSON, or Markdown format."""
    state = get_session(request.session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    if state.status != "Completed" or not state.verdict:
        raise HTTPException(status_code=400, detail="Session is not completed yet.")

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

    if request.format == "json":
        from app.agents.agent_email import build_json_report
        content = build_json_report(
            prompt=state.prompt,
            final_answer=state.verdict.final_answer,
            report_data=report_data,
            confidence_score=state.verdict.confidence_score,
            debate_turns=[t.dict() for t in state.debate_turns],
            consensus_claims=[c.dict() for c in state.verdict.consensus_claims],
            disputed_claims=[d.dict() for d in state.verdict.disputed_claims],
        )
        return ExportResponse(success=True, content=content)

    elif request.format == "markdown":
        from app.agents.agent_email import build_markdown_report
        content = build_markdown_report(
            prompt=state.prompt,
            final_answer=state.verdict.final_answer,
            report_data=report_data,
            confidence_score=state.verdict.confidence_score,
            debate_turns=[t.dict() for t in state.debate_turns],
            consensus_claims=[c.dict() for c in state.verdict.consensus_claims],
            disputed_claims=[d.dict() for d in state.verdict.disputed_claims],
        )
        return ExportResponse(success=True, content=content)

    else:
        # PDF - return base64 encoded
        from app.agents.agent_email import _build_pdf
        import base64

        pdf_bytes = _build_pdf(
            prompt=state.prompt,
            final_answer=state.verdict.final_answer,
            report_data=report_data,
            confidence_score=state.verdict.confidence_score,
            debate_turns=[t.dict() for t in state.debate_turns],
            consensus_claims=[c.dict() for c in state.verdict.consensus_claims],
            disputed_claims=[d.dict() for d in state.verdict.disputed_claims],
        )
        b64_content = base64.b64encode(pdf_bytes).decode("utf-8")
        return ExportResponse(success=True, content=b64_content)


# ── Download Export File ──────────────────────────────────────────────────────
@router.post("/export/download")
async def download_export(request: ExportRequest):
    """Download exported report as a file."""
    state = get_session(request.session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    if state.status != "Completed" or not state.verdict:
        raise HTTPException(status_code=400, detail="Session is not completed yet.")

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

    if request.format == "json":
        from app.agents.agent_email import build_json_report
        content = build_json_report(
            prompt=state.prompt,
            final_answer=state.verdict.final_answer,
            report_data=report_data,
            confidence_score=state.verdict.confidence_score,
            debate_turns=[t.dict() for t in state.debate_turns],
            consensus_claims=[c.dict() for c in state.verdict.consensus_claims],
            disputed_claims=[d.dict() for d in state.verdict.disputed_claims],
        )
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=ai_jury_report_{state.session_id[:8]}.json"}
        )
    elif request.format == "markdown":
        from app.agents.agent_email import build_markdown_report
        content = build_markdown_report(
            prompt=state.prompt,
            final_answer=state.verdict.final_answer,
            report_data=report_data,
            confidence_score=state.verdict.confidence_score,
            debate_turns=[t.dict() for t in state.debate_turns],
            consensus_claims=[c.dict() for c in state.verdict.consensus_claims],
            disputed_claims=[d.dict() for d in state.verdict.disputed_claims],
        )
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=ai_jury_report_{state.session_id[:8]}.md"}
        )
    else:
        from app.agents.agent_email import _build_pdf
        pdf_bytes = _build_pdf(
            prompt=state.prompt,
            final_answer=state.verdict.final_answer,
            report_data=report_data,
            confidence_score=state.verdict.confidence_score,
            debate_turns=[t.dict() for t in state.debate_turns],
            consensus_claims=[c.dict() for c in state.verdict.consensus_claims],
            disputed_claims=[d.dict() for d in state.verdict.disputed_claims],
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=ai_jury_report_{state.session_id[:8]}.pdf"}
        )


# ── Export Report as DOCX ─────────────────────────────────────────────────────
@router.post("/export/download-docx")
async def download_export_docx(request: ExportRequest):
    """Download exported report as a DOCX file."""
    state = get_session(request.session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    if state.status != "Completed" or not state.verdict:
        raise HTTPException(status_code=400, detail="Session is not completed yet.")

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

    from app.agents.agent_email import build_docx_report
    docx_bytes = build_docx_report(
        prompt=state.prompt,
        final_answer=state.verdict.final_answer,
        report_data=report_data,
        confidence_score=state.verdict.confidence_score,
        debate_turns=[t.dict() for t in state.debate_turns],
        consensus_claims=[c.dict() for c in state.verdict.consensus_claims],
        disputed_claims=[d.dict() for d in state.verdict.disputed_claims],
    )
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=ai_jury_report_{state.session_id[:8]}.docx"}
    )


# ── Timeline Data ─────────────────────────────────────────────────────────────
@router.get("/session/{session_id}/timeline")
async def get_confidence_timeline(session_id: str):
    """Get the confidence score timeline for a session."""
    state = get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"timeline": [t.dict() for t in state.confidence_timeline]}


# ── Send Report on Demand ─────────────────────────────────────────────────────
@router.post("/send-report")
async def send_report(request: EmailSettingsRequest):
    """
    Trigger PDF generation and email dispatch for a completed session.
    Awaits composition and returns explicit status/error to the client.
    """
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

    if state.verdict.report:
        state.verdict.report.email_sent      = success
        state.verdict.report.email_recipient = request.email
        update_session(request.session_id, state)

    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return {"status": "sent", "message": f"PDF report successfully sent to {request.email}"}


# ── Send Report to Registered Email ───────────────────────────────────────────
@router.post("/send-report-email")
async def send_report_to_email(request: SendReportRequest):
    """
    Send the PDF report to the user's registered email address.
    """
    state = get_session(request.session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    if state.status != "Completed" or not state.verdict:
        raise HTTPException(status_code=400, detail="Session is not completed yet.")

    recipient_email = state.user_email
    if not recipient_email:
        raise HTTPException(status_code=400, detail="No email address found for this session.")

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

    success, msg = await compose_and_send_email(
        recipient_email  = recipient_email,
        prompt           = state.prompt,
        final_answer     = state.verdict.final_answer,
        report_data      = report_data,
        confidence_score = state.verdict.confidence_score,
        debate_turns     = [t.dict() for t in state.debate_turns],
        consensus_claims = [c.dict() for c in state.verdict.consensus_claims],
        disputed_claims  = [d.dict() for d in state.verdict.disputed_claims],
    )

    if state.verdict.report:
        state.verdict.report.email_sent      = success
        state.verdict.report.email_recipient = recipient_email
        update_session(request.session_id, state)

    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return {"status": "sent", "message": f"PDF report successfully sent to {recipient_email}"}



# ── Auth ──────────────────────────────────────────────────────────────────────
@router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    if not request.username.strip() or not request.password.strip():
        raise HTTPException(status_code=400, detail="Username and password are required")
    if not request.email or "@" not in request.email:
        raise HTTPException(status_code=400, detail="A valid email address is required")
    success, msg = register_user(request.username, request.password, request.email)
    if success:
        return AuthResponse(success=True, detail=msg, token=f"token-{request.username}")
    raise HTTPException(status_code=400, detail=msg)


@router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    if authenticate_user(request.username, request.password):
        user_email = get_user_email(request.username) or ""
        return AuthResponse(
            success=True,
            token=f"token-{request.username}",
            detail=json.dumps({"email": user_email}),
            email=user_email
        )
    raise HTTPException(status_code=401, detail="Invalid username or password")



# ── Email Configuration ───────────────────────────────────────────────────────
@router.get("/email-config")
async def get_email_config_endpoint():
    """Get current email/SMTP configuration."""
    config = get_email_config()
    return config.dict() if config else EmailConfig().dict()


@router.post("/email-config")
async def save_email_config_endpoint(config: SaveEmailConfigRequest):
    """Save email/SMTP configuration."""
    save_email_config(EmailConfig(
        smtp_host=config.smtp_host,
        smtp_port=config.smtp_port,
        smtp_user=config.smtp_user,
        smtp_pass=config.smtp_pass,
        sender_name=config.sender_name,
        use_tls=config.use_tls,
    ))
    return {"status": "saved", "message": "Email configuration saved successfully."}


@router.post("/email-config/test")
async def test_email_config(config: SaveEmailConfigRequest):
    """Test email configuration by sending a test email."""
    import smtplib
    from email.mime.text import MIMEText

    try:
        msg = MIMEText("This is a test email from AI Jury. Your SMTP configuration is working correctly!", "plain")
        msg["Subject"] = "AI Jury - SMTP Test Email"
        msg["From"] = f"{config.sender_name} <{config.smtp_user}>"
        msg["To"] = config.smtp_user

        with smtplib.SMTP(config.smtp_host, config.smtp_port) as server:
            server.ehlo()
            if config.use_tls:
                server.starttls()
            server.login(config.smtp_user, config.smtp_pass)
            server.sendmail(config.smtp_user, config.smtp_user, msg.as_string())

        return {"success": True, "message": f"Test email sent successfully to {config.smtp_user}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SMTP test failed: {str(e)}")


# ── Agent Metrics ─────────────────────────────────────────────────────────────
@router.get("/metrics", response_model=AgentMetrics)
async def get_metrics():
    """Get aggregate agent performance metrics."""
    return get_agent_metrics()
