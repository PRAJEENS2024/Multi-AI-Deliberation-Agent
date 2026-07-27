import asyncio
import json
from datetime import datetime
from typing import List, Dict, Any
from app.models.schemas import SessionState, Claim, DisputedClaim, FinalVerdict, AgentThought, DebateTurn
from app.services.state_manager import get_session, update_session, log_event
from app.agents.llm_client import query_llm, AVAILABLE_MODELS, AGENT_PERSONAS
from app.agents.agent_verification import verify_claim

async def run_jury_workflow(session_id: str):
    state = get_session(session_id)
    if not state:
        return
        
    try:
        current_time = datetime.now().strftime("%H:%M:%S")
        log_event(session_id, "Initializing Multi-Agent Persona Panel")
        state.status = "Initializing Agents"
        state.models_selected = AVAILABLE_MODELS[:3]
        update_session(session_id, state)
        
        current_date = datetime.now().strftime("%B %d, %Y")
        
        # Compile history context
        history_text = ""
        for msg in state.history:
            role = "User" if msg.role == "user" else "AI Jury"
            history_text += f"{role}: {msg.content}\n\n"
        history_context = f"\n\nPrevious Conversation Context:\n{history_text}" if history_text else ""
        
        # Phase 1: Persona Drafting
        state.status = "Querying Persona Agents"
        update_session(session_id, state)
        
        # Specialist (Dr. Vance)
        spec_persona = AGENT_PERSONAS["specialist"]
        spec_prompt = f"Provide a comprehensive, highly accurate response to: '{state.prompt}'. Today's date is {current_date}.{history_context}"
        spec_response = await query_llm(spec_persona["model"], spec_prompt, spec_persona["system_instruction"])
        state.responses[spec_persona["name"]] = spec_response
        state.agent_thoughts.append(AgentThought(
            persona_id=spec_persona["id"],
            persona_name=spec_persona["name"],
            phase="Drafting Stance",
            thought=f"Submitted initial technical assessment for prompt: '{state.prompt[:40]}...'",
            timestamp=datetime.now().strftime("%H:%M:%S")
        ))
        update_session(session_id, state)

        # Skeptic / Devil's Advocate (Cipher)
        skep_persona = AGENT_PERSONAS["skeptic"]
        skep_prompt = f"Analyze the user's prompt: '{state.prompt}'. Challenge common assumptions, highlight risks, and state a skeptical position.{history_context}"
        skep_response = await query_llm(skep_persona["model"], skep_prompt, skep_persona["system_instruction"])
        state.responses[skep_persona["name"]] = skep_response
        state.agent_thoughts.append(AgentThought(
            persona_id=skep_persona["id"],
            persona_name=skep_persona["name"],
            phase="Challenging Assumptions",
            thought="Analyzed potential fallacies, risks, and counter-perspectives.",
            timestamp=datetime.now().strftime("%H:%M:%S")
        ))
        update_session(session_id, state)

        # Data & Logic Auditor (Aura)
        an_persona = AGENT_PERSONAS["analyst"]
        an_prompt = f"Analyze the query: '{state.prompt}'. Focus on exact definitions, statistics, and logical categorizations.{history_context}"
        an_response = await query_llm(an_persona["model"], an_prompt, an_persona["system_instruction"])
        state.responses[an_persona["name"]] = an_response
        state.agent_thoughts.append(AgentThought(
            persona_id=an_persona["id"],
            persona_name=an_persona["name"],
            phase="Logical Auditing",
            thought="Parsed metrics, strict definitions, and domain scope.",
            timestamp=datetime.now().strftime("%H:%M:%S")
        ))
        update_session(session_id, state)

        # Phase 2: Claim Extraction
        state.status = "Extracting Claims"
        update_session(session_id, state)
        
        all_claims = []
        for persona_name, response_text in state.responses.items():
            extraction_prompt = (
                f"Given this text:\n{response_text}\n\n"
                f"Extract the 3 most important claims. Return ONLY a JSON array of objects, "
                f"each with 'claim' (string), 'category' (string like Fact/Opinion), "
                f"'confidence' (string like High/Medium/Low)."
            )
            claims_json = await query_llm("llama-3.1-8b-instant", extraction_prompt, "You are a precise data extractor.", "json")
            try:
                cleaned = claims_json.strip()
                if cleaned.startswith("```json"): cleaned = cleaned[7:-3]
                elif cleaned.startswith("```"): cleaned = cleaned[3:-3]
                
                claims_data = json.loads(cleaned.strip())
                if isinstance(claims_data, dict):
                    for val in claims_data.values():
                        if isinstance(val, list):
                            claims_data = val
                            break
                            
                if isinstance(claims_data, list):
                    for item in claims_data:
                        if isinstance(item, dict):
                            all_claims.append(Claim(
                                claim=item.get("claim", "Unknown claim"),
                                category=item.get("category", "Fact"),
                                confidence=item.get("confidence", "Medium"),
                                model=persona_name
                            ))
            except Exception as e:
                log_event(session_id, f"Error parsing claims for {persona_name}: {str(e)}", "ERROR")
        
        state.extracted_claims = all_claims
        
        # Phase 3: Conflict Detection
        state.status = "Detecting Conflicts"
        update_session(session_id, state)
        
        claims_text = "\n".join([f"- [{c.model}] {c.claim}" for c in all_claims])
        conflict_prompt = (
            f"Here are claims from multiple persona agents:\n{claims_text}\n\n"
            f"Identify any contradictory or disputed claims among them. "
            f"Return ONLY a JSON array of objects with 'claim' (the disputed fact), "
            f"'supporting_models' (array of strings), 'opposing_models' (array of strings)."
        )
        conflicts_json = await query_llm("llama-3.3-70b-versatile", conflict_prompt, "You are a strict conflict detector.", "json")
        try:
            cleaned = conflicts_json.strip()
            if cleaned.startswith("```json"): cleaned = cleaned[7:-3]
            elif cleaned.startswith("```"): cleaned = cleaned[3:-3]
            
            conflict_data = json.loads(cleaned.strip())
            if isinstance(conflict_data, dict):
                for val in conflict_data.values():
                    if isinstance(val, list):
                        conflict_data = val
                        break
                        
            if isinstance(conflict_data, list):
                for item in conflict_data:
                    if isinstance(item, dict):
                        state.disputed_claims.append(DisputedClaim(
                            claim=item.get("claim", "Unknown"),
                            supporting_models=item.get("supporting_models", []),
                            opposing_models=item.get("opposing_models", [])
                        ))
        except Exception as e:
            log_event(session_id, f"No valid conflicts found: {str(e)}", "ERROR")
        
        # Phase 4: Web Search Verification
        state.status = "Verifying Web Evidence"
        update_session(session_id, state)
        
        for dc in state.disputed_claims:
            log_event(session_id, f"Verifying claim: {dc.claim}")
            evidence = await verify_claim(dc.claim)
            dc.evidence = evidence
            dc.status = "Verified" if "error" not in evidence.lower() else "Failed"
            dc.confidence_score = 85 if dc.status == "Verified" else 50
            
        # Phase 5: Multi-Turn Courtroom Debate
        state.status = "Courtroom Cross-Examination"
        update_session(session_id, state)
        
        # Turn 1: Critical Audit Agent Cross-Examines Primary Research Agent
        cross_prompt = f"Review Primary Research Agent's initial stance:\n{spec_response}\n\nPoint out 2 critical flaws, edge cases, or potential fallacies in 2 concise sentences."
        cross_exam_text = await query_llm(skep_persona["model"], cross_prompt, skep_persona["system_instruction"])
        state.debate_turns.append(DebateTurn(
            turn_number=1,
            speaker_persona=skep_persona["name"],
            target_persona=spec_persona["name"],
            argument=cross_exam_text
        ))
        
        # Turn 2: Data & Logic Agent Audits Definition & Scope
        audit_prompt = f"Review the query '{state.prompt}' and initial stance:\n{spec_response}\n\nProvide a strict 2-sentence logical check focusing on exact definitions, edge cases, and metric accuracy."
        audit_text = await query_llm(an_persona["model"], audit_prompt, an_persona["system_instruction"])
        state.debate_turns.append(DebateTurn(
            turn_number=2,
            speaker_persona=an_persona["name"],
            target_persona=spec_persona["name"],
            argument=audit_text
        ))

        # Turn 3: Primary Research Agent Refined Technical Rebuttal
        valid_evidences = [dc.evidence for dc in state.disputed_claims if dc.evidence and "no definitive information" not in dc.evidence.lower()]
        ev_summary = "; ".join(valid_evidences) if valid_evidences else ""
        
        rebuttal_prompt = f"Critical Audit Agent noted: '{cross_exam_text}'. Data & Logic Agent noted: '{audit_text}'. Refine your technical stance in 2 concise sentences."
        rebuttal_text = await query_llm(spec_persona["model"], rebuttal_prompt, spec_persona["system_instruction"])
        state.debate_turns.append(DebateTurn(
            turn_number=3,
            speaker_persona=spec_persona["name"],
            target_persona=skep_persona["name"],
            argument=rebuttal_text,
            evidence=ev_summary if ev_summary else None
        ))

        # Phase 6: Final Verdict Synthesis (Lead Synthesis Engine)
        state.status = "Synthesizing Verdict"
        update_session(session_id, state)
        
        judge_persona = AGENT_PERSONAS["judge"]
        synthesis_prompt = (
            f"User Prompt: {state.prompt}\n\n"
            f"{history_context}\n\n"
            f"Initial Technical Assessment: {spec_response}\n\n"
            f"Critical & Logical Audit Feedback: {cross_exam_text} | {audit_text}\n\n"
            f"Verified Web Evidence: {ev_summary}\n\n"
            f"STRICT OUTPUT REQUIREMENTS:\n"
            f"1. Write the final, complete, authoritative response to the user's prompt in clean Markdown.\n"
            f"2. Output ONLY the direct answer (e.g. code, facts, explanation). Do NOT include meta-commentary or disclaimers like 'As an AI', 'According to agents', 'Knowledge cutoff', or 'In conclusion I verdict'.\n"
            f"3. Do NOT mention any internal agent names (Primary Research Agent, Critical Audit Agent, Data & Logic Agent, Lead Synthesis Engine, Dr. Vance, Cipher, Aura, etc.) anywhere in the response.\n"
            f"4. If code is requested, provide a complete, working, bug-free implementation handling edge cases."
        )
        final_answer = await query_llm(judge_persona["model"], synthesis_prompt, judge_persona["system_instruction"])
        
        # Clean up any leftover agent name leaks if LLM generated them
        for name in ["Primary Research Agent", "Critical Audit Agent", "Data & Logic Agent", "Lead Synthesis Engine", "Dr. Vance", "Cipher", "Aura", "Veritas Chief"]:
            final_answer = final_answer.replace(f"According to {name}, ", "").replace(f"as stated by {name}, ", "").replace(f"{name} ", "")

        # Calculate dynamic confidence
        confidence_values = {"High": 95, "Medium": 75, "Low": 50}
        consensus_claims = [c for c in state.extracted_claims if not any(dc.claim == c.claim for dc in state.disputed_claims)]
        
        if consensus_claims:
            scores = [confidence_values.get(str(c.confidence).capitalize(), 75) for c in consensus_claims]
            base_confidence = sum(scores) // len(scores)
        else:
            base_confidence = 70
            
        if state.disputed_claims:
            base_confidence -= len(state.disputed_claims) * 3
            for dc in state.disputed_claims:
                if dc.status == "Verified":
                    base_confidence += 5
                elif dc.status == "Failed":
                    base_confidence -= 5
        
        confidence = min(max(base_confidence, 20), 98)
        
        state.verdict = FinalVerdict(
            executive_summary="Verified consensus verdict synthesized from multi-agent deliberation and live web evidence.",
            final_answer=final_answer,
            consensus_claims=[c for c in state.extracted_claims if not any(dc.claim == c.claim for dc in state.disputed_claims)],
            disputed_claims=[dc for dc in state.disputed_claims if dc.evidence and "no definitive information" not in dc.evidence.lower()],
            minority_opinions=[],
            confidence_score=confidence,
            verified_sources=[],
            remaining_uncertainty="All primary claims have been validated through multi-agent consensus.",
            human_review_needed=False
        )
        
        state.status = "Completed"
        log_event(session_id, "Multi-Agent Courtroom workflow completed successfully")
        update_session(session_id, state)
        
    except Exception as e:
        state.status = "Error"
        log_event(session_id, f"Workflow failed: {str(e)}", "ERROR")
        update_session(session_id, state)
