from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class QueryRequest(BaseModel):
    prompt: str = Field(..., description="The user's question or prompt.")
    
class QueryResponse(BaseModel):
    session_id: str
    status: str

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

class SessionState(BaseModel):
    session_id: str
    prompt: str
    status: str = "Initializing"
    models_selected: List[str] = []
    responses: Dict[str, str] = {}
    extracted_claims: List[Claim] = []
    disputed_claims: List[DisputedClaim] = []
    debates: List[Dict[str, Any]] = []
    verdict: Optional[FinalVerdict] = None
    logs: List[Dict[str, str]] = []
