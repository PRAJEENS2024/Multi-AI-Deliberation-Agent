import asyncio
from duckduckgo_search import DDGS

async def verify_claim(claim_text: str) -> str:
    """
    Agent 6: Source Verification Agent
    Searches the live internet to verify a disputed claim.
    """
    def search_sync():
        try:
            results = DDGS().text(claim_text, max_results=2)
            if not results:
                return "No definitive information found on the internet."
            
            snippets = [f"- {r['title']}: {r['body']}" for r in results]
            return "\n".join(snippets)
        except Exception as e:
            return f"Search error: {str(e)}"

    snippets = await asyncio.to_thread(search_sync)
    return snippets
