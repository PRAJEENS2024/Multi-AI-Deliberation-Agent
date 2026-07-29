import asyncio
import traceback
from app.services.state_manager import create_session, get_session
from app.agents.agent_orchestrator import _jury_graph

async def main():
    sid = create_session("What are the main advantages of solar energy?", "abhinavkumaran2006@gmail.com")
    s = get_session(sid)
    initial = {
        "session_id": sid,
        "prompt": s.prompt,
        "current_date": "July 29, 2026",
        "history_context": "",
        "research_output": "",
        "critique_output": "",
        "factcheck_output": "",
        "bias_output": "",
        "final_answer": "",
        "report_data": {},
        "all_claims": [],
        "disputed_raw": [],
        "ev_summary": "",
        "confidence": 72,
        "user_email": "abhinavkumaran2006@gmail.com",
        "send_email": True,
        "email_status": "pending",
    }
    try:
        res = await _jury_graph.ainvoke(initial)
        print("PIPELINE EXECUTED SUCCESSFULLY!", res)
    except Exception as e:
        print("EXACT TRACEBACK:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
