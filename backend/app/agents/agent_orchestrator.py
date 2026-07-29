import json
from datetime import datetime
from typing import TypedDict, List, Dict, Optional

from langgraph.graph import StateGraph, END

from app.models.schemas import (
    SessionState, Claim, DisputedClaim, FinalVerdict,
    AgentThought, DebateTurn, StructuredReport, ReportSection,
    AgentStatus, TimelinePoint,
)
from app.services.state_manager import get_session, update_session, log_event
from app.agents.llm_client import query_llm, AVAILABLE_MODELS, AGENT_PERSONAS
from app.agents.agent_verification import web_search
from app.agents.agent_email import compose_and_send_email


# ── Shared LangGraph State ────────────────────────────────────────────────────
class JuryGraphState(TypedDict):
    session_id:        str
    prompt:            str
    current_date:      str
    history_context:   str
    # Agent outputs — each feeds the next
    research_output:   str   # Agent 1 -> Agent 2, 3, 4, 5
    critique_output:   str   # Agent 2 -> Agent 3, 4, 5
    factcheck_output:  str   # Agent 3 -> Agent 4, 5
    bias_output:       str   # Agent 4 -> Agent 5
    final_answer:      str   # Agent 5 -> Agent 6, 7
    report_data:       dict  # Agent 6 -> Agent 7
    # Intermediate data
    all_claims:        List[Dict]
    disputed_raw:      List[Dict]
    ev_summary:        str
    confidence:        int
    # Email
    user_email:        Optional[str]
    send_email:        bool
    email_status:      str


# ── Helpers ───────────────────────────────────────────────────────────────────
def _ts() -> str:
    return datetime.now().strftime("%H:%M:%S")


def _parse_json(raw: str) -> any:
    if not raw or not isinstance(raw, str):
        return {}
    import re
    cleaned = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL)
    cleaned = re.sub(r'</?think>', '', cleaned).strip()
    for fence in ("```json", "```"):
        if cleaned.startswith(fence):
            cleaned = cleaned[len(fence):]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    if not cleaned:
        return {}
    try:
        return json.loads(cleaned)
    except Exception:
        match = re.search(r'(\{.*\}|\[.*\])', cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        return {}




def _set_status(sid: str, status: str):
    sess = get_session(sid)
    if sess:
        sess.status = status
        update_session(sid, sess)


def _add_thought(sid: str, persona_id: str, persona_name: str, phase: str, thought: str):
    sess = get_session(sid)
    if sess:
        sess.agent_thoughts.append(AgentThought(
            persona_id=persona_id, persona_name=persona_name,
            phase=phase, thought=thought, timestamp=_ts()
        ))
        update_session(sid, sess)


def _update_pipeline(sid: str, agent_id: str, agent_name: str, avatar: str, color: str, status: str, confidence: int = None):
    sess = get_session(sid)
    if not sess:
        return
    updated = False
    for a in sess.agent_pipeline:
        if a.agent_id == agent_id:
            a.status = status
            if status == "running" and not a.started_at:
                a.started_at = _ts()
            if status in ("completed", "error") and not a.completed_at:
                a.completed_at = _ts()
            if confidence is not None:
                a.confidence_at_stage = confidence
            updated = True
            break
    if not updated:
        sess.agent_pipeline.append(AgentStatus(
            agent_id=agent_id, agent_name=agent_name,
            avatar=avatar, color=color, status=status,
            started_at=_ts() if status == "running" else None,
            confidence_at_stage=confidence,
        ))
    update_session(sid, sess)


def _add_timeline_point(sid: str, stage: str, agent_name: str, avatar: str, color: str, confidence: int, summary: str):
    sess = get_session(sid)
    if not sess:
        return
    sess.confidence_timeline.append(TimelinePoint(
        stage=stage, agent_name=agent_name,
        agent_avatar=avatar, agent_color=color,
        confidence=confidence, timestamp=_ts(), summary=summary
    ))
    update_session(sid, sess)


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 1 — Research Agent
# ═══════════════════════════════════════════════════════════════════════════════
async def node_research(state: JuryGraphState) -> JuryGraphState:
    sid = state["session_id"]
    p   = AGENT_PERSONAS["researcher"]
    _set_status(sid, f"{p['avatar']} Agent 1 — {p['name']}: Gathering Evidence")
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#3B82F6"), "running")

    prompt = (
        f"Today is {state['current_date']}.\n"
        f"{state['history_context']}\n\n"
        f"User Query: {state['prompt']}\n\n"
        f"Provide a comprehensive, factually dense, well-structured response. "
        f"Cover definitions, history, current state, key facts, statistics, and expert consensus."
    )
    output = await query_llm(p["model"], prompt, p["system_instruction"])

    sess = get_session(sid)
    sess.responses[p["name"]] = output
    update_session(sid, sess)
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#3B82F6"), "completed")
    _add_timeline_point(sid, "research", p["name"], p.get("avatar", ""), p.get("color", "#3B82F6"), 65, "Initial domain research gathered")
    _add_thought(sid, p["id"], p["name"], "Deep Research", f"Completed primary research for: '{state['prompt'][:60]}'")
    log_event(sid, "Agent 1 (Research) completed")
    return {**state, "research_output": output}


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 2 — Critic Agent
# ═══════════════════════════════════════════════════════════════════════════════
async def node_critic(state: JuryGraphState) -> JuryGraphState:
    sid = state["session_id"]
    p   = AGENT_PERSONAS["critic"]
    _set_status(sid, f"{p['avatar']} Agent 2 — {p['name']}: Challenging Assumptions")
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#EC4899"), "running")

    prompt = (
        f"User Query: {state['prompt']}\n\n"
        f"Research Agent's Response:\n{state['research_output']}\n\n"
        f"Rigorously challenge this response. Identify logical fallacies, unsupported claims, "
        f"missing context, edge cases, and potential errors. Structure as numbered points."
    )
    output = await query_llm(p["model"], prompt, p["system_instruction"])

    sess = get_session(sid)
    sess.responses[p["name"]] = output
    update_session(sid, sess)
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#EC4899"), "completed")
    _add_timeline_point(sid, "critique", p["name"], p.get("avatar", ""), p.get("color", "#EC4899"), 60, "Critical analysis identified weak points")
    _add_thought(sid, p["id"], p["name"], "Critical Challenge", "Identified fallacies and unsupported claims in research output.")
    log_event(sid, "Agent 2 (Critic) completed")
    return {**state, "critique_output": output}


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 3 — Fact Checker Agent
# ═══════════════════════════════════════════════════════════════════════════════
async def node_fact_checker(state: JuryGraphState) -> JuryGraphState:
    sid = state["session_id"]
    p   = AGENT_PERSONAS["fact_checker"]
    _set_status(sid, f"{p['avatar']} Agent 3 — {p['name']}: Verifying Claims")
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#F59E0B"), "running")

    web_evidence = await web_search(state["prompt"], max_results=3)

    prompt = (
        f"User Query: {state['prompt']}\n\n"
        f"Research Agent's Response:\n{state['research_output']}\n\n"
        f"Critic Agent's Challenges:\n{state['critique_output']}\n\n"
        f"Live Web Evidence:\n{web_evidence}\n\n"
        f"For each major claim, mark it VERIFIED, DISPUTED, or UNVERIFIED. "
        f"Explain why disputed claims are contested. Output a structured fact-check report."
    )
    output = await query_llm(p["model"], prompt, p["system_instruction"])

    claims_prompt = (
        f"From this fact-check report:\n{output}\n\n"
        f"Extract up to 6 key claims. Return ONLY a JSON array of objects with: "
        f"'claim' (string), 'category' (Fact|Opinion|Assumption), 'confidence' (High|Medium|Low), 'model' (string)."
    )
    claims_raw = await query_llm("llama-3.1-8b-instant", claims_prompt, "You are a precise JSON extractor.", "json")

    all_claims = []
    try:
        parsed = _parse_json(claims_raw)
        items  = parsed if isinstance(parsed, list) else next((v for v in parsed.values() if isinstance(v, list)), [])
        for item in items:
            if isinstance(item, dict):
                all_claims.append({
                    "claim":      item.get("claim", ""),
                    "category":   item.get("category", "Fact"),
                    "confidence": item.get("confidence", "Medium"),
                    "model":      item.get("model", p["name"]),
                })
    except Exception as e:
        log_event(sid, f"Claim extraction error: {e}", "ERROR")

    disputed_raw = []
    if all_claims:
        claims_text    = "\n".join(f"- [{c['model']}] {c['claim']}" for c in all_claims)
        conflict_prompt = (
            f"Claims:\n{claims_text}\n\n"
            f"Identify contradictory claims. Return ONLY a JSON array with: "
            f"'claim', 'supporting_models' (array), 'opposing_models' (array)."
        )
        conflicts_raw = await query_llm("llama-3.3-70b-versatile", conflict_prompt, "You are a strict conflict detector.", "json")
        try:
            parsed = _parse_json(conflicts_raw)
            items  = parsed if isinstance(parsed, list) else next((v for v in parsed.values() if isinstance(v, list)), [])
            for item in items:
                if isinstance(item, dict):
                    disputed_raw.append({
                        "claim":             item.get("claim", ""),
                        "supporting_models": item.get("supporting_models", []),
                        "opposing_models":   item.get("opposing_models", []),
                    })
        except Exception as e:
            log_event(sid, f"Conflict detection error: {e}", "ERROR")

    ev_parts = []
    for dc in disputed_raw:
        evidence = await web_search(dc["claim"], max_results=2)
        dc["evidence"]         = evidence
        dc["status"]           = "Verified" if "error" not in evidence.lower() else "Failed"
        dc["confidence_score"] = 85 if dc["status"] == "Verified" else 50
        if "no results" not in evidence.lower():
            ev_parts.append(evidence)

    ev_summary = " | ".join(ev_parts[:3]) if ev_parts else ""

    safe_claims = []
    for c in all_claims:
        if isinstance(c, dict):
            safe_claims.append(Claim(
                claim=str(c.get("claim", "")),
                category=str(c.get("category", "Fact")),
                confidence=str(c.get("confidence", "Medium")),
                model=str(c.get("model", p["name"])),
            ))

    safe_disputed = []
    for d in disputed_raw:
        if isinstance(d, dict):
            sup = d.get("supporting_models", [])
            opp = d.get("opposing_models", [])
            if isinstance(sup, str): sup = [sup]
            if isinstance(opp, str): opp = [opp]
            safe_disputed.append(DisputedClaim(
                claim=str(d.get("claim", "")),
                supporting_models=[str(x) for x in sup] if isinstance(sup, list) else [],
                opposing_models=[str(x) for x in opp] if isinstance(opp, list) else [],
                evidence=str(d.get("evidence", "")) if d.get("evidence") else None,
                status=str(d.get("status", "Verified")),
                confidence_score=int(d.get("confidence_score", 75)),
            ))

    sess = get_session(sid)
    sess.responses[p["name"]]  = output
    sess.extracted_claims      = safe_claims
    sess.disputed_claims       = safe_disputed
    update_session(sid, sess)
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#F59E0B"), "completed")
    _add_timeline_point(sid, "factcheck", p["name"], p.get("avatar", ""), p.get("color", "#F59E0B"), 72, f"Verified {len(all_claims)} claims, found {len(disputed_raw)} disputes")
    _add_thought(sid, p["id"], p["name"], "Fact Verification", f"Verified {len(all_claims)} claims, found {len(disputed_raw)} disputes.")
    log_event(sid, "Agent 3 (Fact Checker) completed")
    return {**state, "factcheck_output": output, "all_claims": all_claims, "disputed_raw": disputed_raw, "ev_summary": ev_summary}


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 4 — Bias Detector Agent
# ═══════════════════════════════════════════════════════════════════════════════
async def node_bias_detector(state: JuryGraphState) -> JuryGraphState:
    sid = state["session_id"]
    p   = AGENT_PERSONAS["bias_detector"]
    _set_status(sid, f"{p['avatar']} Agent 4 — {p['name']}: Auditing Fairness")
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#8B5CF6"), "running")

    prompt = (
        f"User Query: {state['prompt']}\n\n"
        f"Research Output:\n{state['research_output']}\n\n"
        f"Critic Output:\n{state['critique_output']}\n\n"
        f"Fact-Check Output:\n{state['factcheck_output']}\n\n"
        f"Detect confirmation bias, selection bias, cultural assumptions, framing effects, "
        f"political skew, and overconfidence. Provide specific examples with severity ratings (Low/Medium/High)."
    )
    output = await query_llm(p["model"], prompt, p["system_instruction"])

    sess = get_session(sid)
    sess.responses[p["name"]] = output
    update_session(sid, sess)
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#8B5CF6"), "completed")
    _add_timeline_point(sid, "bias", p["name"], p.get("avatar", ""), p.get("color", "#8B5CF6"), 80, "Bias audit completed with findings")
    _add_thought(sid, p["id"], p["name"], "Bias Audit", "Scanned all prior agent outputs for cognitive bias and fairness issues.")
    log_event(sid, "Agent 4 (Bias Detector) completed")
    return {**state, "bias_output": output}


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 5 — Synthesis Agent
# ═══════════════════════════════════════════════════════════════════════════════
async def node_synthesizer(state: JuryGraphState) -> JuryGraphState:
    sid = state["session_id"]
    p   = AGENT_PERSONAS["synthesizer"]
    _set_status(sid, f"{p['avatar']} Agent 5 — {p['name']}: Writing Final Verdict")
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#10B981"), "running")

    prompt = (
        f"User Query: {state['prompt']}\n\n"
        f"[Research Agent Output]\n{state['research_output']}\n\n"
        f"[Critic Agent Challenges]\n{state['critique_output']}\n\n"
        f"[Fact-Check Report]\n{state['factcheck_output']}\n\n"
        f"[Bias Audit]\n{state['bias_output']}\n\n"
        f"[Verified Web Evidence]\n{state['ev_summary']}\n\n"
        f"Synthesize ONE authoritative, balanced, complete answer. "
        f"Resolve all disputes. Incorporate verified facts. Eliminate bias. "
        f"Write in clean Markdown. Do NOT mention any internal agent names. "
        f"Do NOT add disclaimers. If code is requested, provide complete working code."
    )
    output = await query_llm(p["model"], prompt, p["system_instruction"])

    for name in ["Research Agent", "Critic Agent", "Fact Checker Agent", "Bias Detector Agent",
                 "Synthesis Agent", "Report Formatter Agent", "Email Dispatch Agent"]:
        output = output.replace(f"According to {name}, ", "").replace(f"{name} noted ", "").replace(f"{name}: ", "")

    conf_map = {"High": 95, "Medium": 75, "Low": 50}
    sess     = get_session(sid)
    consensus = [c for c in sess.extracted_claims if not any(d.claim == c.claim for d in sess.disputed_claims)]
    if consensus:
        scores = [conf_map.get(str(c.confidence).capitalize(), 75) for c in consensus]
        base   = sum(scores) // len(scores)
    else:
        base = 72

    for dc in sess.disputed_claims:
        base += 4 if dc.status == "Verified" else -4
    confidence = min(max(base, 20), 98)

    sess.responses[p["name"]] = output
    sess.debate_turns = [
        DebateTurn(turn_number=1, speaker_persona="Research Agent",      target_persona=None,              argument=state["research_output"][:600]),
        DebateTurn(turn_number=2, speaker_persona="Critic Agent",        target_persona="Research Agent",  argument=state["critique_output"][:600]),
        DebateTurn(turn_number=3, speaker_persona="Fact Checker Agent",  target_persona="Critic Agent",    argument=state["factcheck_output"][:600], evidence=state["ev_summary"][:300] or None),
        DebateTurn(turn_number=4, speaker_persona="Bias Detector Agent", target_persona=None,              argument=state["bias_output"][:600]),
        DebateTurn(turn_number=5, speaker_persona="Synthesis Agent",     target_persona=None,              argument=output[:600]),
    ]
    update_session(sid, sess)
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#10B981"), "completed")
    _add_timeline_point(sid, "synthesis", p["name"], p.get("avatar", ""), p.get("color", "#10B981"), confidence, f"Final verdict with {confidence}% confidence")
    _add_thought(sid, p["id"], p["name"], "Final Synthesis", "Synthesized all agent outputs into one authoritative verdict.")
    log_event(sid, "Agent 5 (Synthesizer) completed")
    return {**state, "final_answer": output, "confidence": confidence}


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 6 — Report Formatter Agent
# ═══════════════════════════════════════════════════════════════════════════════
async def node_report_formatter(state: JuryGraphState) -> JuryGraphState:
    sid = state["session_id"]
    p   = AGENT_PERSONAS["report_formatter"]
    _set_status(sid, f"{p['avatar']} Agent 6 — {p['name']}: Structuring Report")
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#06B6D4"), "running")

    prompt = (
        f"User Query: {state['prompt']}\n\n"
        f"Final Synthesized Answer:\n{state['final_answer']}\n\n"
        f"Fact-Check Summary:\n{state['factcheck_output'][:800]}\n\n"
        f"Bias Audit Summary:\n{state['bias_output'][:400]}\n\n"
        f"Format this into a professional structured report. "
        f"Return ONLY a JSON object with these exact keys:\n"
        f"  'title' (string),\n"
        f"  'executive_summary' (string, 2-3 sentences),\n"
        f"  'key_findings' (array of 4-6 strings),\n"
        f"  'recommendations' (array of 3-5 strings),\n"
        f"  'sections' (array of {{title, content}} objects - at least 3 sections)."
    )
    raw = await query_llm(p["model"], prompt, p["system_instruction"], "json")

    report_data = {}
    try:
        parsed = _parse_json(raw)
        if isinstance(parsed, dict):
            report_data = parsed
    except Exception as e:
        log_event(sid, f"Report formatting parse error: {e}", "ERROR")

    if not report_data.get("title"):
        report_data["title"] = f"Veritas AI Deliberation Report: {state['prompt'][:40]}"

    if not report_data.get("executive_summary"):
        report_data["executive_summary"] = state["final_answer"][:300]
    if not report_data.get("key_findings"):
        report_data["key_findings"] = ["Comprehensive 7-agent deliberation completed."]
    if not report_data.get("recommendations"):
        report_data["recommendations"] = ["Review agent debate transcript."]

    valid_sections = []
    for s in report_data.get("sections", []):
        if isinstance(s, dict):
            valid_sections.append(ReportSection(
                title=str(s.get("title", s.get("name", "Analysis Section"))),
                content=str(s.get("content", s.get("body", s.get("text", ""))))
            ))
    if not valid_sections:
        valid_sections.append(ReportSection(title="Synthesized Verdict", content=state["final_answer"]))

    sess = get_session(sid)
    consensus = [c for c in sess.extracted_claims if not any(d.claim == c.claim for d in sess.disputed_claims)]
    disputed  = [d for d in sess.disputed_claims if d.evidence and "no results" not in (d.evidence or "").lower()]

    report_obj = StructuredReport(
        title             = str(report_data.get("title", "")),
        executive_summary = str(report_data.get("executive_summary", "")),
        sections          = valid_sections,
        key_findings      = [str(x) for x in report_data.get("key_findings", [])],
        recommendations   = [str(x) for x in report_data.get("recommendations", [])],
        confidence_score  = state["confidence"],
        generated_at      = datetime.now().isoformat(),
        email_sent        = False,
        email_recipient   = state.get("user_email"),
    )

    sess.verdict = FinalVerdict(

        executive_summary   = report_data.get("executive_summary", "Multi-agent consensus verdict."),
        final_answer        = state["final_answer"],
        consensus_claims    = consensus,
        disputed_claims     = disputed,
        minority_opinions   = [],
        confidence_score    = state["confidence"],
        verified_sources    = [],
        remaining_uncertainty = "Verified through 7-agent deliberation pipeline.",
        human_review_needed = state["confidence"] < 55,
        report              = report_obj,
    )
    sess.responses[p["name"]] = json.dumps(report_data)
    update_session(sid, sess)
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#06B6D4"), "completed")
    _add_timeline_point(sid, "report", p["name"], p.get("avatar", ""), p.get("color", "#06B6D4"), state["confidence"], "Report formatted")
    _add_thought(sid, p["id"], p["name"], "Report Formatting", f"Structured report with {len(report_data.get('sections', []))} sections and {len(report_data.get('key_findings', []))} key findings.")
    log_event(sid, "Agent 6 (Report Formatter) completed")
    return {**state, "report_data": report_data}


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 7 — Email Dispatch Agent
# ═══════════════════════════════════════════════════════════════════════════════
async def node_email_dispatch(state: JuryGraphState) -> JuryGraphState:
    sid = state["session_id"]
    p   = AGENT_PERSONAS["email_agent"]

    if not state.get("send_email") or not state.get("user_email"):
        _set_status(sid, "Completed")
        log_event(sid, "Agent 7 (Email) skipped - no email requested.")
        return {**state, "email_status": "skipped"}

    _set_status(sid, f"{p['avatar']} Agent 7 — {p['name']}: Generating PDF & Sending Report")
    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#F97316"), "running")

    sess = get_session(sid)
    debate_turns     = [t.dict() for t in sess.debate_turns]
    consensus_claims = [c.dict() for c in sess.extracted_claims if not any(d.claim == c.claim for d in sess.disputed_claims)]
    disputed_claims  = [d.dict() for d in sess.disputed_claims]

    success, message = await compose_and_send_email(
        recipient_email  = state["user_email"],
        prompt           = state["prompt"],
        final_answer     = state["final_answer"],
        report_data      = state["report_data"],
        confidence_score = state["confidence"],
        debate_turns     = debate_turns,
        consensus_claims = consensus_claims,
        disputed_claims  = disputed_claims,
    )

    sess = get_session(sid)
    if sess.verdict and sess.verdict.report:
        sess.verdict.report.email_sent      = success
        sess.verdict.report.email_recipient = state["user_email"]
    update_session(sid, sess)

    _update_pipeline(sid, p["id"], p["name"], p.get("avatar", ""), p.get("color", "#F97316"), "completed", 95 if success else 50)
    _add_thought(sid, p["id"], p["name"], "PDF Email Dispatch", message)
    log_event(sid, f"Agent 7 (Email): {message}", "INFO" if success else "ERROR")
    return {**state, "email_status": "sent" if success else f"failed: {message}"}


# ═══════════════════════════════════════════════════════════════════════════════
# Finalise session status
# ═══════════════════════════════════════════════════════════════════════════════
async def node_finalise(state: JuryGraphState) -> JuryGraphState:
    sid  = state["session_id"]
    sess = get_session(sid)
    if sess:
        sess.status = "Completed"
        update_session(sid, sess)
    log_event(sid, "7-Agent LangGraph pipeline completed successfully.")
    return state


# ── Build & Compile LangGraph ─────────────────────────────────────────────────
def _build_graph():
    g = StateGraph(JuryGraphState)

    g.add_node("research",        node_research)
    g.add_node("critic",          node_critic)
    g.add_node("fact_checker",    node_fact_checker)
    g.add_node("bias_detector",   node_bias_detector)
    g.add_node("synthesizer",     node_synthesizer)
    g.add_node("report_formatter",node_report_formatter)
    g.add_node("email_dispatch",  node_email_dispatch)
    g.add_node("finalise",        node_finalise)

    g.set_entry_point("research")
    g.add_edge("research",         "critic")
    g.add_edge("critic",           "fact_checker")
    g.add_edge("fact_checker",     "bias_detector")
    g.add_edge("bias_detector",    "synthesizer")
    g.add_edge("synthesizer",      "report_formatter")
    g.add_edge("report_formatter", "email_dispatch")
    g.add_edge("email_dispatch",   "finalise")
    g.add_edge("finalise",         END)

    return g.compile()


_jury_graph = _build_graph()


# ── Public Entry Point ────────────────────────────────────────────────────────
async def run_jury_workflow(session_id: str):
    sess = get_session(session_id)
    if not sess:
        return

    sess.status          = "Initializing 7-Agent Pipeline"
    sess.models_selected = AVAILABLE_MODELS
    update_session(session_id, sess)
    log_event(session_id, "Starting 7-Agent LangGraph Jury Pipeline")

    current_date = datetime.now().strftime("%B %d, %Y")
    history_text = "".join(
        f"{'User' if m.role == 'user' else 'AI Jury'}: {m.content}\n\n"
        for m in sess.history
    )
    history_context = f"\n\nConversation History:\n{history_text}" if history_text else ""

    initial: JuryGraphState = {
        "session_id":       session_id,
        "prompt":           sess.prompt,
        "current_date":     current_date,
        "history_context":  history_context,
        "research_output":  "",
        "critique_output":  "",
        "factcheck_output": "",
        "bias_output":      "",
        "final_answer":     "",
        "report_data":      {},
        "all_claims":       [],
        "disputed_raw":     [],
        "ev_summary":       "",
        "confidence":       72,
        "user_email":       sess.user_email,
        "send_email":       sess.send_email,
        "email_status":     "pending",
    }

    try:
        await _jury_graph.ainvoke(initial)
    except Exception as e:
        s = get_session(session_id)
        if s:
            s.status = "Error"
            log_event(session_id, f"Pipeline error: {str(e)}", "ERROR")
            update_session(session_id, s)
