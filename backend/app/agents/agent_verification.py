import asyncio
from duckduckgo_search import DDGS


async def web_search(query: str, max_results: int = 3) -> str:
    """
    Performs a live DuckDuckGo web search and returns formatted snippets.
    Used by the Fact Checker Agent to ground claims in real evidence.
    """
    def _search():
        try:
            results = DDGS().text(query, max_results=max_results)
            if not results:
                return "No results found."
            return "\n".join(f"• [{r['title']}]: {r['body']}" for r in results)
        except Exception as e:
            return f"Search error: {str(e)}"

    return await asyncio.to_thread(_search)


async def verify_claim(claim_text: str) -> str:
    """Searches the web to find evidence for or against a specific claim."""
    return await web_search(claim_text, max_results=2)
