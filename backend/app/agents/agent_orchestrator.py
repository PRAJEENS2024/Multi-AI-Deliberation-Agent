import asyncio
import json
from typing import List, Dict, Any
from app.models.schemas import SessionState, Claim, DisputedClaim, FinalVerdict
from app.services.state_manager import get_session, update_session, log_event
from app.agents.llm_client import query_llm, AVAILABLE_MODELS
from app.agents.agent_verification import verify_claim

async def run_jury_workflow(session_id: str):
    state = get_session(session_id)
    if not state:
        return
        
    try:
        log_event(session_id, "Starting Cost Optimizer Agent")
        state.status = "Optimizing Cost & Selection"
        update_session(session_id, state)
        
        # Select all available models dynamically (Gemini, Groq Llama3, Claude)
        state.models_selected = AVAILABLE_MODELS[:3]
        log_event(session_id, f"Models selected: {', '.join(state.models_selected)}")
        
        state.status = "Querying Models in Parallel"
        update_session(session_id, state)
        
        # Phase 1: Parallel generation
        from datetime import datetime
        current_date = datetime.now().strftime("%B %d, %Y")
        
        # Compile history context
        history_text = ""
        for msg in state.history:
            role = "User" if msg.role == "user" else "AI Jury"
            history_text += f"{role}: {msg.content}\n\n"
        history_context = f"\n\nPrevious Conversation Context:\n{history_text}" if history_text else ""
        
        tasks = []
        for model in state.models_selected:
            system_prompt = f"Answer the user's prompt thoughtfully and accurately. Focus on your distinct {model} perspective. Today's date is {current_date}.{history_context}"
            tasks.append(query_llm(model, state.prompt, system_prompt, "text"))
            
        responses = await asyncio.gather(*tasks)
        state.responses = {model: res for model, res in zip(state.models_selected, responses)}
        log_event(session_id, "Responses collected from all models")
        
        state.status = "Extracting Claims"
        update_session(session_id, state)
        
        # Phase 2: Extract Claims
        all_claims = []
        for model, response_text in state.responses.items():
            extraction_prompt = (
                f"Given this text:\n{response_text}\n\n"
                f"Extract the 3 most important claims. Return ONLY a JSON array of objects, "
                f"each with 'claim' (string), 'category' (string like Fact/Opinion), "
                f"'confidence' (string like High/Medium/Low)."
            )
            claims_json = await query_llm(model, extraction_prompt, "You are a precise data extractor.", "json")
            try:
                # Clean markdown blocks if LLM adds them
                cleaned = claims_json.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:-3]
                elif cleaned.startswith("```"):
                    cleaned = cleaned[3:-3]
                
                claims_data = json.loads(cleaned.strip())
                for item in claims_data:
                    all_claims.append(Claim(
                        claim=item.get("claim", "Unknown claim"),
                        category=item.get("category", "Fact"),
                        confidence=item.get("confidence", "Medium"),
                        model=model
                    ))
            except Exception as e:
                log_event(session_id, f"Error parsing claims for {model}: {str(e)} - Raw: {claims_json[:50]}", "ERROR")
        
        state.extracted_claims = all_claims
        
        state.status = "Detecting Conflicts"
        update_session(session_id, state)
        
        # Phase 3: Conflict Detection
        # We ask a neutral model (gemini) to find conflicts
        claims_text = "\n".join([f"- [{c.model}] {c.claim}" for c in all_claims])
        conflict_prompt = (
            f"Here are claims from multiple models:\n{claims_text}\n\n"
            f"Identify any contradictory or disputed claims among them. "
            f"Return ONLY a JSON array of objects with 'claim' (the disputed fact), "
            f"'supporting_models' (array of strings), 'opposing_models' (array of strings)."
        )
        conflicts_json = await query_llm("gemini-1.5-pro", conflict_prompt, "You are a strict conflict detector.", "json")
        try:
            cleaned = conflicts_json.strip()
            if cleaned.startswith("```json"): cleaned = cleaned[7:-3]
            elif cleaned.startswith("```"): cleaned = cleaned[3:-3]
            
            conflict_data = json.loads(cleaned.strip())
            for item in conflict_data:
                state.disputed_claims.append(DisputedClaim(
                    claim=item.get("claim", "Unknown"),
                    supporting_models=item.get("supporting_models", []),
                    opposing_models=item.get("opposing_models", [])
                ))
        except:
            log_event(session_id, "No valid conflicts found or parse error.")
        
        state.status = "Verifying Sources"
        update_session(session_id, state)
        
        # Phase 4: Web Search Verification
        for dc in state.disputed_claims:
            log_event(session_id, f"Verifying claim: {dc.claim}")
            evidence = await verify_claim(dc.claim)
            dc.evidence = evidence
            dc.status = "Verified" if "error" not in evidence.lower() else "Failed"
            dc.confidence_score = 80 if dc.status == "Verified" else 50
            
        state.status = "Deliberating"
        update_session(session_id, state)
        
        # Phase 5: Debates
        for dc in state.disputed_claims:
            debate_round = {
                "round": 1,
                "claim": dc.claim,
                "arguments": []
            }
            # Ask opposing model to defend its stance given the evidence
            for opp_model in dc.opposing_models:
                defend_prompt = (
                    f"You previously opposed this claim: '{dc.claim}'.\n"
                    f"However, live web search found this evidence:\n{dc.evidence}\n\n"
                    f"Do you concede or defend your position? Answer in 1 short paragraph."
                )
                defense = await query_llm(opp_model, defend_prompt, "You are debating based on evidence.")
                debate_round["arguments"].append({"model": opp_model, "argument": defense})
            
            state.debates.append(debate_round)
            
        state.status = "Synthesizing Verdict"
        update_session(session_id, state)
        
        # Phase 6: Final Verdict
        synthesis_prompt = (
            f"User asked: {state.prompt}\n\n"
            f"{history_context}\n\n"
            f"Original Claims:\n{claims_text}\n\n"
            f"Disputed Claims & Evidence: {json.dumps([c.dict() for c in state.disputed_claims])}\n\n"
            f"Provide a comprehensive, final answer that resolves any disputes using the verified evidence."
        )
        final_answer = await query_llm("gemini-1.5-pro", synthesis_prompt, "You are the head jury member synthesizing the truth.")
        
        # Calculate dynamic confidence
        confidence_values = {"High": 95, "Medium": 75, "Low": 50}
        consensus_claims = [c for c in state.extracted_claims if not any(dc.claim == c.claim for dc in state.disputed_claims)]
        
        if consensus_claims:
            scores = [confidence_values.get(str(c.confidence).capitalize(), 75) for c in consensus_claims]
            base_confidence = sum(scores) // len(scores)
        else:
            base_confidence = 60
            
        if state.disputed_claims:
            base_confidence -= len(state.disputed_claims) * 5
            for dc in state.disputed_claims:
                if dc.status == "Verified":
                    base_confidence += 10
                elif dc.status == "Failed":
                    base_confidence -= 10
        
        confidence = min(max(base_confidence, 10), 99)
        
        state.verdict = FinalVerdict(
            executive_summary="The models have reached a final synthesized verdict after extracting claims and searching the web.",
            final_answer=final_answer,
            consensus_claims=[c for c in state.extracted_claims if not any(dc.claim == c.claim for dc in state.disputed_claims)],
            disputed_claims=state.disputed_claims,
            minority_opinions=[],
            confidence_score=confidence,
            verified_sources=[],
            remaining_uncertainty="Some uncertainty may remain depending on the available web evidence.",
            human_review_needed=False
        )
        
        state.status = "Completed"
        log_event(session_id, "Jury workflow completed successfully")
        update_session(session_id, state)
        
    except Exception as e:
        state.status = "Error"
        log_event(session_id, f"Workflow failed: {str(e)}", "ERROR")
        update_session(session_id, state)
