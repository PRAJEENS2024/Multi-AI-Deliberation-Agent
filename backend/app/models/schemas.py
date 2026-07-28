from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Optional, Any
from datetime import datetime

# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    detail: Optional[str] = None

# ── Query ─────────────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    prompt: str = Field(..., description="The user's question or prompt.")
    session_id: Optional[str] = None
    email: Optional[str] = Field(None, description="Email to send the final report to.")
    send_email: bool = Field(False, description="Whether to email the final report.")

class QueryResponse(BaseModel):
    session_id: str
    status: str

# ── Agent Pipeline ────────────────────────────────────────────────────────────
class AgentStatus(BaseModel):
    agent_id: str
    agent_name: str
    avatar: str
    color: str
    status: str = "pending"          # pending | running | completed | error
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: Optional[int] = None
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    confidence_at_stage: Optional[int] = None  # confidence after this agent

class AgentThought(BaseModel):
    persona_id: str
    persona_name: str
    phase: str
    thought: str
    timestamp: str

class DebateTurn(BaseModel):
    turn_number: int
    speaker_persona: str
    target_persona: Optional[str] = None
    argument: str
    evidence: Optional[str] = None

# ── Claims & Conflicts ────────────────────────────────────────────────────────
class Claim(BaseModel):
    claim: str
    category: str       # Fact | Opinion | Assumption | Recommendation
    confidence: str     # High | Medium | Low
    model: str

class DisputedClaim(BaseModel):
    claim: str
    supporting_models: List[str] = []
    opposing_models: List[str] = []
    status: str = "Unresolved"       # Unresolved | Verified | Contradicted
    evidence: Optional[str] = None
    confidence_score: Optional[int] = None

# ── Report ────────────────────────────────────────────────────────────────────
class ReportSection(BaseModel):
    title: str
    content: str

class StructuredReport(BaseModel):
    title: str
    executive_summary: str
    sections: List[ReportSection] = []
    key_findings: List[str] = []
    recommendations: List[str] = []
    confidence_score: int
    generated_at: str
    email_sent: bool = False
    email_recipient: Optional[str] = None

# ── Verdict ───────────────────────────────────────────────────────────────────
class FinalVerdict(BaseModel):
    executive_summary: str
    final_answer: str
    consensus_claims: List[Claim] = []
    disputed_claims: List[DisputedClaim] = []
    minority_opinions: List[str] = []
    confidence_score: int
    verified_sources: List[str] = []
    remaining_uncertainty: str
    human_review_needed: bool
    report: Optional[StructuredReport] = None

# ── Message ───────────────────────────────────────────────────────────────────
class Message(BaseModel):
    role: str
    content: str
    verdict: Optional[FinalVerdict] = None

# ── Agent Timeline Point ──────────────────────────────────────────────────────
class TimelinePoint(BaseModel):
    stage: str
    agent_name: str
    agent_avatar: str
    agent_color: str
    confidence: int
    timestamp: str
    summary: str

# ── Session ───────────────────────────────────────────────────────────────────
class SessionState(BaseModel):
    session_id: str
    prompt: str
    status: str = "Initializing"
    user_email: Optional[str] = None
    send_email: bool = False
    models_selected: List[str] = []
    responses: Dict[str, str] = {}
    extracted_claims: List[Claim] = []
    disputed_claims: List[DisputedClaim] = []
    debates: List[Dict[str, Any]] = []
    debate_turns: List[DebateTurn] = []
    agent_thoughts: List[AgentThought] = []
    agent_pipeline: List[AgentStatus] = []
    confidence_timeline: List[TimelinePoint] = []
    verdict: Optional[FinalVerdict] = None
    logs: List[Dict[str, str]] = []
    history: List[Message] = []
    total_duration_ms: Optional[int] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class SessionSummary(BaseModel):
    session_id: str
    prompt: str
    status: str
    confidence_score: Optional[int] = None
    created_at: Optional[str] = None

# ── Email Settings ────────────────────────────────────────────────────────────
class EmailSettingsRequest(BaseModel):
    session_id: str
    email: str

class EmailConfig(BaseModel):
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    sender_name: str = "AI Jury"
    use_tls: bool = True

class SaveEmailConfigRequest(BaseModel):
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    sender_name: str = "AI Jury"
    use_tls: bool = True

# ── Export ────────────────────────────────────────────────────────────────────
class ExportRequest(BaseModel):
    session_id: str
    format: str = "pdf"  # pdf | json | markdown

class ExportResponse(BaseModel):
    success: bool
    download_url: Optional[str] = None
    content: Optional[str] = None
    error: Optional[str] = None

# ── Agent Metrics ─────────────────────────────────────────────────────────────
class AgentMetrics(BaseModel):
    total_sessions: int
    avg_confidence: float
    total_claims_verified: int
    total_disputes_resolved: int
    agent_performance: List[Dict[str, Any]] = []
    recent_sessions: List[SessionSummary] = []
