# Phase 3: Chainlit Application - Research

**Researched:** 2026-06-10
**Domain:** Chat UI / LangChain Integration / Streaming LLM Responses
**Confidence:** HIGH

## Summary

Phase 3 implements a Chainlit-based chat interface that integrates with the existing RAG pipeline (rag.py) and generates streaming responses using Claude Haiku via langchain-anthropic. The research confirms that Chainlit 2.x provides native support for LangChain streaming through `astream()` and `stream_token()`, with built-in starter questions via `@cl.set_starters` decorator.

The primary technical challenge is correctly wiring the existing `rag.py` functions (retrieve, build_prompt) with ChatAnthropic's streaming capabilities while maintaining session state via `cl.user_session`. The recommended Claude model is `claude-3-5-haiku-20241022` (Claude 3.5 Haiku) as Claude 3 Haiku (20240307) will be deprecated in April 2026.

**Primary recommendation:** Use Chainlit 2.x with `@cl.on_chat_start` for initialization and `@cl.on_message` with `astream()` + `stream_token()` for real-time streaming responses.

## User Constraints (from CONTEXT.md)

### Locked Decisions
*(No locked decisions specified in CONTEXT.md)*

### Claude's Discretion
*(Full discretion on implementation details)*

### Deferred Ideas (OUT OF SCOPE)
*(No deferred items specified)*

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Chainlit app.py displays welcome message on load | `@cl.on_chat_start` decorator with `cl.Message().send()` [VERIFIED: Chainlit docs] |
| UI-02 | Starter questions via cl.Starter for quick engagement | `@cl.set_starters` decorator returns list of `cl.Starter` objects [VERIFIED: Chainlit docs] |
| UI-03 | User questions trigger RAG retrieval and Claude Haiku generation | Integration pattern: retrieve() -> build_prompt() -> ChatAnthropic.astream() [VERIFIED: LangChain + Chainlit docs] |
| UI-04 | Responses stream to user in real-time | `msg.stream_token(chunk)` within async for loop [VERIFIED: Chainlit streaming docs] |
| UI-05 | Chat maintains professional but accessible tone | SYSTEM_PROMPT already configured in rag.py (D-03, D-04, D-06) |
| LANG-01 | Bot responds in French by default | SYSTEM_PROMPT rule 6: "Reponds dans la meme langue que la question" |
| LANG-02 | Bot switches to English if recruiter writes in English | Same SYSTEM_PROMPT rule handles language detection |
| LANG-03 | System prompt instructs language detection and matching | Already implemented in rag.py SYSTEM_PROMPT |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Chat UI rendering | Browser/Client (Chainlit) | - | Chainlit serves React UI, handles message display |
| Session state | Backend (Chainlit server) | - | `cl.user_session` persists per-session data server-side |
| RAG retrieval | Backend (app.py) | - | ChromaDB queries run server-side in retrieve() |
| LLM generation | External API (Anthropic) | - | Claude Haiku API call, streaming response |
| Message streaming | Backend -> Client | - | WebSocket pushes tokens from backend to browser |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chainlit | >=2.0.0 | Chat UI framework | Purpose-built for LLM apps, native streaming, starters feature [VERIFIED: PyPI] |
| langchain-anthropic | >=0.1.23 | Claude integration | Official LangChain adapter for Anthropic API [VERIFIED: PyPI - installed 0.1.23] |
| anthropic | >=0.25.0 | Anthropic API client | Required by langchain-anthropic [VERIFIED: PyPI - installed 0.109.1] |

### Supporting (already in requirements.txt)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| langchain | 0.2.16 | Chain orchestration | Already installed, LCEL patterns |
| langchain-openai | 0.1.25 | Embeddings | Already used by rag.py |
| python-dotenv | 1.0.1 | Environment variables | API key loading |

### Claude Model Selection
| Model ID | Status | Use Case |
|----------|--------|----------|
| `claude-3-5-haiku-20241022` | **Recommended** | Fast, economical, excellent multilingual [CITED: Anthropic models overview] |
| `claude-3-haiku-20240307` | Deprecated April 2026 | Legacy, avoid for new projects [CITED: Anthropic deprecation notice] |
| `claude-haiku-4-5-20251001` | Newest | Claude Haiku 4.5, recommended long-term [CITED: Anthropic news] |

**Note:** The project constraints specify "Claude Haiku" without version. Use `claude-3-5-haiku-20241022` for stability, or `claude-haiku-4-5-20251001` for the latest capabilities.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Chainlit | Gradio | Simpler but no native chat features, starters |
| Chainlit | Streamlit | General dashboards, not chat-focused |
| stream_token() | Full completion | No streaming UX, worse recruiter experience |

**Installation:**
```bash
pip install chainlit>=2.0.0
```

**Version verification:** Chainlit 2.11.1 is latest (verified 2026-06-10 via `pip index versions chainlit`).

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| chainlit | PyPI | 3+ years | High | github.com/Chainlit/chainlit | [OK] | Approved |
| langchain-anthropic | PyPI | 2+ years | High | github.com/langchain-ai/langchain | [OK] | Approved (already installed) |
| anthropic | PyPI | 2+ years | Very High | github.com/anthropics/anthropic-sdk-python | [OK] | Approved (already installed) |

**Packages removed due to [SLOP] verdict:** None
**Packages flagged as suspicious [SUS]:** None

## Architecture Patterns

### System Architecture Diagram

```
[Recruiter Browser]
       |
       | WebSocket (chat messages)
       v
[Chainlit Server (app.py)]
       |
       +---> @cl.on_chat_start
       |         |
       |         +---> Initialize ChatAnthropic
       |         +---> Send welcome message
       |         +---> Display starter questions
       |
       +---> @cl.on_message
                 |
                 +---> rag.retrieve(question)
                 |         |
                 |         v
                 |     [ChromaDB]
                 |         |
                 |         v
                 |     Retrieved chunks
                 |
                 +---> rag.build_prompt(question, chunks)
                 |         |
                 |         v
                 |     Formatted prompt with context
                 |
                 +---> ChatAnthropic.astream(prompt)
                 |         |
                 |         v
                 |     [Anthropic API] (Claude Haiku)
                 |         |
                 |         | (streaming tokens)
                 |         v
                 +---> msg.stream_token(chunk)
                           |
                           v
                       [Browser renders token-by-token]
```

### Recommended Project Structure
```
.
├── app.py               # Chainlit application (Phase 3 deliverable)
├── rag.py               # RAG retrieval (Phase 2, exists)
├── indexer.py           # Document indexing (Phase 1, exists)
├── chainlit.md          # Welcome screen content
├── .chainlit/
│   └── config.toml      # UI configuration (auto-generated)
├── chroma_db/           # Vector store (exists)
├── docs/                # Source documents (exists)
├── requirements.txt     # Dependencies
└── .env                 # API keys (ANTHROPIC_API_KEY required)
```

### Pattern 1: Chainlit App Initialization
**What:** Set up LLM and session state on chat start
**When to use:** Every Chainlit app that uses LangChain
**Example:**
```python
# Source: https://docs.chainlit.io/integrations/langchain
import chainlit as cl
from langchain_anthropic import ChatAnthropic

@cl.on_chat_start
async def on_chat_start():
    llm = ChatAnthropic(
        model="claude-3-5-haiku-20241022",
        temperature=0.7,
        max_tokens=1024,
    )
    cl.user_session.set("llm", llm)

    await cl.Message(
        content="Bonjour! Je suis l'assistant virtuel d'Etienne Lepironnec..."
    ).send()
```

### Pattern 2: Streaming Response with RAG
**What:** Retrieve context, build prompt, stream LLM response
**When to use:** Every message handler with RAG
**Example:**
```python
# Source: https://docs.chainlit.io/advanced-features/streaming
from langchain.schema import HumanMessage, SystemMessage

@cl.on_message
async def on_message(message: cl.Message):
    llm = cl.user_session.get("llm")

    # RAG retrieval
    chunks = retrieve(message.content)
    prompt = build_prompt(message.content, chunks)

    # Stream response
    msg = cl.Message(content="")

    async for chunk in llm.astream([HumanMessage(content=prompt)]):
        if chunk.content:
            await msg.stream_token(chunk.content)

    await msg.send()
```

### Pattern 3: Starter Questions
**What:** Pre-defined clickable questions for user engagement
**When to use:** Welcome screen to guide users
**Example:**
```python
# Source: https://docs.chainlit.io/concepts/starters
@cl.set_starters
async def set_starters():
    return [
        cl.Starter(
            label="Experience professionnelle",
            message="Quelle est l'experience professionnelle d'Etienne?",
            icon="/public/briefcase.svg",
        ),
        cl.Starter(
            label="Competences techniques",
            message="Quelles sont les competences techniques d'Etienne?",
            icon="/public/code.svg",
        ),
    ]
```

### Anti-Patterns to Avoid
- **Blocking LLM calls:** Never use synchronous `llm.invoke()` in Chainlit - always use `astream()` for streaming UX
- **Global state for session data:** Never use global variables - use `cl.user_session` for per-user isolation
- **Creating LLM in on_message:** Initialize LLM once in `on_chat_start`, not per-message (wastes connection overhead)
- **Forgetting await:** Chainlit methods are async - missing `await` on `.send()` or `.stream_token()` will silently fail

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chat UI | Custom Flask/FastAPI WebSocket | Chainlit | Handles WebSockets, sessions, UI rendering |
| Streaming display | Manual token buffering | `msg.stream_token()` | Chainlit handles browser push |
| Session state | In-memory dict with user ID | `cl.user_session` | Thread-safe, per-session isolation |
| Starter questions | Custom welcome buttons | `@cl.set_starters` | Built-in UI, click-to-send |

**Key insight:** Chainlit exists specifically to solve chat UI complexity - hand-rolling WebSocket streaming, session management, and UI state is error-prone and slower.

## Common Pitfalls

### Pitfall 1: Missing ANTHROPIC_API_KEY
**What goes wrong:** ChatAnthropic fails silently or throws cryptic error
**Why it happens:** .env file missing or key not set in HuggingFace Spaces secrets
**How to avoid:** Check key at startup, fail fast with clear message
**Warning signs:** Empty responses, 401 errors in logs
```python
import os
if not os.getenv("ANTHROPIC_API_KEY"):
    raise ValueError("ANTHROPIC_API_KEY not found. Add to .env or HF Spaces secrets.")
```

### Pitfall 2: Streaming Not Working
**What goes wrong:** Response appears all at once instead of token-by-token
**Why it happens:** Using `invoke()` instead of `astream()`, or missing `stream_token()`
**How to avoid:** Always use async pattern: `async for chunk in llm.astream(...)`
**Warning signs:** Response delays then dumps full text

### Pitfall 3: Wrong Prompt Structure
**What goes wrong:** Claude ignores context or responds incorrectly
**Why it happens:** Passing build_prompt output as System message instead of Human message
**How to avoid:** The SYSTEM_PROMPT in rag.py includes both system instructions AND context - pass entire string as user content
**Warning signs:** Responses ignore retrieved context

### Pitfall 4: HuggingFace Spaces Port Mismatch
**What goes wrong:** App deploys but shows blank page or timeout
**Why it happens:** Chainlit defaults to port 8000, HF Spaces expects 7860
**How to avoid:** Run with `chainlit run app.py --port 7860 --host 0.0.0.0`
**Warning signs:** "Application error" on HF Spaces

### Pitfall 5: Session State Lost Between Messages
**What goes wrong:** LLM instance is None, causing AttributeError
**Why it happens:** Using global variable instead of `cl.user_session`, or key typo
**How to avoid:** Use exact key names: `cl.user_session.set("llm", llm)` / `.get("llm")`
**Warning signs:** NoneType errors on second message

## Code Examples

### Complete app.py Template
```python
# Source: Research synthesis from Chainlit + LangChain docs
import os
from dotenv import load_dotenv
import chainlit as cl
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage

from rag import retrieve, build_prompt

load_dotenv()

# Validate API keys at import time
if not os.getenv("ANTHROPIC_API_KEY"):
    raise ValueError("ANTHROPIC_API_KEY not found in environment")

MODEL = "claude-3-5-haiku-20241022"


@cl.set_starters
async def set_starters():
    return [
        cl.Starter(
            label="Experience professionnelle",
            message="Quelle est l'experience professionnelle d'Etienne?",
        ),
        cl.Starter(
            label="Competences techniques",
            message="Quelles sont les competences techniques d'Etienne?",
        ),
        cl.Starter(
            label="Missions recentes",
            message="Quelles sont les missions recentes d'Etienne?",
        ),
        cl.Starter(
            label="Formation",
            message="Quelle est la formation d'Etienne?",
        ),
        cl.Starter(
            label="Contact",
            message="Comment contacter Etienne?",
        ),
    ]


@cl.on_chat_start
async def on_chat_start():
    llm = ChatAnthropic(
        model=MODEL,
        temperature=0.7,
        max_tokens=1024,
    )
    cl.user_session.set("llm", llm)

    await cl.Message(
        content="Bonjour! Je suis l'assistant virtuel d'Etienne Lepironnec. "
                "Posez-moi vos questions sur son parcours professionnel, "
                "ses competences ou ses experiences."
    ).send()


@cl.on_message
async def on_message(message: cl.Message):
    llm = cl.user_session.get("llm")

    # RAG retrieval
    chunks = retrieve(message.content)
    prompt = build_prompt(message.content, chunks)

    # Stream response
    msg = cl.Message(content="")

    async for chunk in llm.astream([HumanMessage(content=prompt)]):
        if chunk.content:
            await msg.stream_token(chunk.content)

    await msg.send()
```

### chainlit.md Welcome Screen
```markdown
# Assistant CV - Etienne Lepironnec

Bienvenue! Cet assistant peut repondre a vos questions sur le profil professionnel d'Etienne.

**Exemples de questions:**
- Quelle est son experience en data engineering?
- Quelles technologies maitrise-t-il?
- Quels projets a-t-il realises recemment?

*Cliquez sur une question suggeree ou posez directement votre question.*
```

### Dockerfile for HuggingFace Spaces
```dockerfile
# Source: https://huggingface.co/spaces/XThomasBU/chainlit-example/blob/main/Dockerfile
FROM python:3.11

RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

COPY --chown=user . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["chainlit", "run", "app.py", "--port", "7860", "--host", "0.0.0.0", "-h"]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chainlit 1.x | Chainlit 2.x | Jan 2024 | `@cl.set_starters` decorator, improved streaming |
| claude-3-haiku-20240307 | claude-3-5-haiku-20241022 | Oct 2024 | Better performance, use newer model |
| LangchainCallbackHandler | Direct astream() | LangChain 0.2.x | Simpler code, direct streaming preferred |

**Deprecated/outdated:**
- `langchain_community.chat_models.anthropic.ChatAnthropic` - deprecated since 0.0.28, use `langchain_anthropic.ChatAnthropic`
- Chainlit 1.x patterns - many decorators changed in 2.x

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Claude 3.5 Haiku is the best economic choice for French support | Standard Stack | Could use Claude Haiku 4.5 for better performance at similar cost |
| A2 | Default starters in French are appropriate | Code Examples | Recruiters might expect English UI |
| A3 | Welcome message tone is professional enough | Code Examples | May need adjustment after user testing |

## Open Questions

1. **Starter question icons**
   - What we know: `cl.Starter` supports `icon` parameter for SVG icons
   - What's unclear: Whether to include icons or use text-only starters
   - Recommendation: Start without icons, add later if needed (simpler deployment)

2. **Message history / conversation memory**
   - What we know: Current SYSTEM_PROMPT doesn't include chat history
   - What's unclear: Whether recruiters need multi-turn conversations
   - Recommendation: Single-turn is sufficient for CV questions, can add memory later

3. **Error handling UI**
   - What we know: Chainlit displays errors but may not be user-friendly
   - What's unclear: How to gracefully handle API failures
   - Recommendation: Wrap LLM calls in try/except, show French error message

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python | Chainlit runtime | Yes | 3.12.5 | - |
| chromadb | RAG retrieval | Yes | 1.x | - |
| langchain-anthropic | Claude integration | Yes | 0.1.23 | - |
| anthropic | API client | Yes | 0.109.1 | - |
| chainlit | Chat UI | No (not installed) | - | pip install chainlit>=2.0.0 |

**Missing dependencies with no fallback:**
- `chainlit` - must be installed before app.py can run

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 8.x |
| Config file | pytest.ini (not present, uses defaults) |
| Quick run command | `pytest tests/ -x` |
| Full suite command | `pytest tests/ -v` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Welcome message displays | integration | Manual / Chainlit test mode | Wave 0 |
| UI-02 | Starter questions appear | integration | Manual / Chainlit test mode | Wave 0 |
| UI-03 | RAG + Claude generation | integration | `pytest tests/test_app.py::test_on_message` | Wave 0 |
| UI-04 | Streaming works | integration | Manual (observe UI) | Manual only |
| UI-05 | Tone appropriate | manual | Human review | Manual only |
| LANG-01 | French default | unit | `pytest tests/test_rag.py` (existing) | Exists |
| LANG-02 | English switch | unit | Extend test_rag.py | Wave 0 |
| LANG-03 | Language detection | unit | Covered by SYSTEM_PROMPT | Exists |

### Sampling Rate
- **Per task commit:** `pytest tests/ -x`
- **Per wave merge:** `pytest tests/ -v`
- **Phase gate:** Full suite green + manual Chainlit UI test

### Wave 0 Gaps
- [ ] `tests/test_app.py` - covers UI-03 (message handling unit test without full Chainlit)
- [ ] Manual testing checklist for UI-01, UI-02, UI-04, UI-05

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A for Phase 3 (public chatbot) |
| V3 Session Management | Partial | `cl.user_session` handles isolation |
| V4 Access Control | No | N/A (public access) |
| V5 Input Validation | Yes | User input goes to LLM, grounding via SYSTEM_PROMPT |
| V6 Cryptography | No | N/A (API keys handled by Anthropic SDK) |

### Known Threat Patterns for Chat Applications

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection | Tampering | SYSTEM_PROMPT grounding rules (already implemented) |
| API key exposure | Information Disclosure | .env + HF Spaces secrets, .gitignore excludes .env |
| Session hijacking | Spoofing | Chainlit handles session IDs internally |
| Rate limiting bypass | Denial of Service | Anthropic API has built-in rate limits |

## Sources

### Primary (HIGH confidence)
- [Chainlit Starters Documentation](https://docs.chainlit.io/concepts/starters) - `@cl.set_starters`, `cl.Starter` class
- [Chainlit Streaming Documentation](https://docs.chainlit.io/advanced-features/streaming) - `stream_token()` pattern
- [Chainlit LangChain Integration](https://docs.chainlit.io/integrations/langchain) - `astream()` + callback pattern
- [Chainlit User Session](https://docs.chainlit.io/concepts/user-session) - `cl.user_session` API
- [ChatAnthropic Reference](https://reference.langchain.com/python/langchain-anthropic/chat_models/ChatAnthropic) - LangChain Anthropic integration

### Secondary (MEDIUM confidence)
- [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) - Model selection guidance
- [HuggingFace Spaces Chainlit Examples](https://huggingface.co/spaces/XThomasBU/chainlit-example) - Deployment patterns

### Tertiary (LOW confidence)
- DataCamp tutorial, Medium articles - General guidance, patterns verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified via PyPI, official docs confirm integration patterns
- Architecture: HIGH - Chainlit + LangChain integration is well-documented standard pattern
- Pitfalls: HIGH - Based on official docs warnings and GitHub issues

**Research date:** 2026-06-10
**Valid until:** 2026-07-10 (30 days - stable ecosystem)
