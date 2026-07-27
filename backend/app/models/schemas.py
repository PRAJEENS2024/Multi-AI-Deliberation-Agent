from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class QueryRequest(BaseModel):
    prompt: str = Field(..., description="The user's question or prompt.")
    session_id: Optional[str] = Field(None, description="Optional session ID to continue a conversation.")
    
class QueryResponse(BaseModel):
    session_id: str
    status: str

class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    detail: Optional[str] = None
    
class SessionSummary(BaseModel):
    session_id: str
    prompt: str
    status: str

class AgentPersona(BaseModel):
    id: str
    name: str
    role: str
    avatar: str
    model: str
    color: str

class AgentThought(BaseModel):
    persona_id: str
    persona_name: str
    phase: str # Drafting, Cross-Exam, Rebuttal, Verdict
    thought: str
    timestamp: str

class DebateTurn(BaseModel):
    turn_number: int
    speaker_persona: str
    target_persona: Optional[str] = None
    argument: str
    evidence: Optional[str] = None

class Claim(BaseModel):
    claim: str
    category: str # Fact, Recommendation, Assumption, Reasoning
    confidence: str # High, Medium, Low
    model: str
    
class DisputedClaim(BaseModel):
    claim: str
    supporting_models: List[str]
    opposing_models: List[str]
    status: str = "Unresolved" # Unresolved, Verified, Contradicted, Cannot Verify
    evidence: Optional[str] = None
    confidence_score: Optional[int] = None

class FinalVerdict(BaseModel):
    executive_summary: str
    final_answer: str
    consensus_claims: List[Claim]
    disputed_claims: List[DisputedClaim]
    minority_opinions: List[str]
    confidence_score: int
    verified_sources: List[str]
    remaining_uncertainty: str
    human_review_needed: bool

class Message(BaseModel):
    role: str # "user" or "assistant"
    content: str
    verdict: Optional[FinalVerdict] = None

class SessionState(BaseModel):
    session_id: str
    prompt: str
    status: str = "Initializing"
    models_selected: List[str] = []
    responses: Dict[str, str] = {}
    extracted_claims: List[Claim] = []
    disputed_claims: List[DisputedClaim] = []
    debates: List[Dict[str, Any]] = []
    debate_turns: List[DebateTurn] = []
    agent_thoughts: List[AgentThought] = []
    verdict: Optional[FinalVerdict] = None
    logs: List[Dict[str, str]] = []
    history: List[Message] = []
