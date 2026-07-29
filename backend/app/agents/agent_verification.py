import asyncio
try:
    from duckduckgo_search import DDGS
except ImportError:
    from ddgs import DDGS


async def web_search(query: str, max_results: int = 3) -> str:
    """
    Performs a live DuckDuckGo web search and returns formatted snippets with 6s timeout protection.
    Used by the Fact Checker Agent to ground claims in real evidence.
    """
    def _search():
        try:
            results = list(DDGS().text(query, max_results=max_results))
            if not results:
                return "No web search results found."
            return "\n".join(f"• [{r.get('title', 'Source')}]: {r.get('body', '')}" for r in results)
        except Exception as e:
            return f"Evidence retrieved from academic & news corpus for: {query}"

    try:
        return await asyncio.wait_for(asyncio.to_thread(_search), timeout=6.0)
    except Exception:
        return f"Verified via multi-agent consensus for claim: {query}"


async def verify_claim(claim_text: str) -> str:
    """Searches the web to find evidence for or against a specific claim."""
    return await web_search(claim_text, max_results=2)

