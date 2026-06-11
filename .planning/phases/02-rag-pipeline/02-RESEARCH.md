# Phase 2: RAG Pipeline - Research

**Researched:** 2026-06-10
**Domain:** LangChain RAG retrieval, Claude Haiku integration, system prompt engineering
**Confidence:** HIGH

## Summary

This phase builds the retrieval and prompt construction module (`rag.py`) that bridges the indexed ChromaDB collection from Phase 1 to Claude Haiku generation. The module provides two core functions: `retrieve(question, k=5)` for similarity search and `build_prompt(question, chunks)` for constructing grounded prompts.

The key technical challenge is **hallucination prevention** — ensuring the bot responds "I don't know" when information is not in the context rather than fabricating answers. This requires explicit grounding rules in the system prompt and careful prompt structure.

**Primary recommendation:** Use LangChain's Chroma `as_retriever()` pattern with a strict grounding system prompt that explicitly forbids supplementing from training knowledge. Include source metadata in prompts for traceability.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01**: Use LangChain's Chroma integration for retrieval (consistency with Phase 1)
- **D-02**: Default k=5 for similarity search (per RAG-01, configurable)
- **D-03**: System prompt must present the bot as an assistant speaking ABOUT the candidate, not AS the candidate
- **D-04**: System prompt must enforce "I don't know" responses when information is not in the context
- **D-05**: Use Claude Haiku via Anthropic API for generation (per PROJECT.md constraints)
- **D-06**: Support French and English responses based on query language (LANG-01, LANG-02)

### Claude's Discretion

- Prompt template structure (how to format retrieved chunks in the prompt)
- Whether to include source metadata in prompts (document name, page number)
- Error handling approach for empty retrieval results
- CLI test interface design (interactive REPL vs script with arguments)

### Deferred to Phase 3

- Streaming responses (UI-04)
- Chainlit integration (UI-01 through UI-05)
- Starter questions (UI-02)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RAG-01 | rag.py provides retrieve(question, k=5) returning top-k chunks | Chroma `as_retriever()` pattern with `search_kwargs={"k": 5}` |
| RAG-02 | rag.py provides build_prompt(question, chunks) constructing final prompt | ChatPromptTemplate with system + context + question structure |
| RAG-03 | System prompt presents bot as assistant about the candidate | Third-person framing: "Etienne has..." not "I have..." |
| RAG-04 | System prompt enforces "I don't know" for missing information | Strict grounding rules with explicit refusal instruction |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Vector similarity search | Database/Storage (ChromaDB) | — | ChromaDB owns embedding storage and similarity computation |
| Prompt construction | API/Backend (`rag.py`) | — | Business logic layer formats context for LLM |
| LLM generation | External Service (Anthropic API) | — | Claude Haiku processes prompt and returns response |
| Language detection | API/Backend (`rag.py`) | — | System prompt instructs LLM to match query language |

## Standard Stack

### Core (Phase 2 additions)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| langchain-anthropic | 0.3.x | Claude integration | Official LangChain partner package, required for ChatAnthropic [VERIFIED: pip index] |
| anthropic | >=0.25.0 | Anthropic SDK | Underlying client for langchain-anthropic [VERIFIED: pip index] |

### Already Installed (from Phase 1)

| Library | Version | Purpose |
|---------|---------|---------|
| langchain | 0.2.16 | RAG orchestration |
| langchain-community | 0.2.16 | ChromaDB integration |
| langchain-openai | 0.1.25 | OpenAI embeddings |
| chromadb | 1.5.9 | Vector store |

### Version Compatibility Note

The project uses `langchain==0.2.x`. The `langchain-anthropic` package has version 1.x available, but we should use `0.3.x` for compatibility with `langchain-core==0.2.x`. [CITED: pip compatibility checks]

**Installation:**
```bash
pip install langchain-anthropic>=0.3.0,<0.4.0 anthropic>=0.25.0
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| langchain-anthropic | PyPI | 2+ yrs | High | github.com/langchain-ai/langchain | [OK] | Approved |
| anthropic | PyPI | 2+ yrs | High | github.com/anthropics/anthropic-sdk-python | [OK] | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        rag.py Module                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Question ─────┐                                           │
│                     │                                           │
│                     ▼                                           │
│  ┌──────────────────────────────┐                               │
│  │     retrieve(question, k)    │                               │
│  │  ┌─────────────────────────┐ │                               │
│  │  │ OpenAI Embeddings       │ │◄── text-embedding-3-small     │
│  │  │ (query embedding)       │ │                               │
│  │  └──────────┬──────────────┘ │                               │
│  │             │                │                               │
│  │             ▼                │                               │
│  │  ┌─────────────────────────┐ │                               │
│  │  │ ChromaDB                │ │◄── chroma_db/cv_documents     │
│  │  │ (similarity_search)     │ │                               │
│  │  └──────────┬──────────────┘ │                               │
│  └─────────────┼────────────────┘                               │
│                │                                                │
│                ▼                                                │
│        List[Document] (top-k chunks with metadata)              │
│                │                                                │
│                ▼                                                │
│  ┌──────────────────────────────┐                               │
│  │ build_prompt(question,chunks)│                               │
│  │  ┌─────────────────────────┐ │                               │
│  │  │ Format chunks           │ │                               │
│  │  │ + source metadata       │ │                               │
│  │  └──────────┬──────────────┘ │                               │
│  │             │                │                               │
│  │             ▼                │                               │
│  │  ┌─────────────────────────┐ │                               │
│  │  │ System Prompt           │ │◄── Grounding rules            │
│  │  │ + Context + Question    │ │    Third-person framing       │
│  │  └──────────┬──────────────┘ │                               │
│  └─────────────┼────────────────┘                               │
│                │                                                │
│                ▼                                                │
│         Formatted Prompt (ready for LLM)                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼ (Phase 3: passed to Claude Haiku)
```

### Recommended Project Structure

```
src/
├── rag.py              # Main RAG module (this phase)
├── prompts.py          # System prompt constants (optional, can be in rag.py)
├── indexer.py          # Document indexer (Phase 1, exists)
└── app.py              # Chainlit app (Phase 3)
```

### Pattern 1: ChromaDB Retriever Initialization

**What:** Connect to existing ChromaDB collection with same embeddings model
**When to use:** At module load or first retrieval call

```python
# Source: LangChain Chroma documentation
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

def get_retriever(persist_directory: str = "./chroma_db",
                  collection_name: str = "cv_documents",
                  k: int = 5):
    """Initialize retriever from existing ChromaDB collection."""
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    vectorstore = Chroma(
        persist_directory=persist_directory,
        collection_name=collection_name,
        embedding_function=embeddings  # MUST match indexer
    )

    return vectorstore.as_retriever(search_kwargs={"k": k})
```

[CITED: https://docs.langchain.com/oss/python/integrations/vectorstores/chroma]

### Pattern 2: Strict Grounding System Prompt

**What:** System prompt that prevents hallucination and enforces "I don't know"
**When to use:** Always for RAG-based Q&A where accuracy is critical

```python
# Source: AI Amastery RAG prompting lesson, adapted for CV assistant
SYSTEM_PROMPT = """Tu es un assistant virtuel qui repond aux questions des recruteurs a propos d'Etienne Lepironnec.

REGLES STRICTES:
1. Reponds UNIQUEMENT en utilisant les informations du CONTEXTE ci-dessous
2. Parle d'Etienne a la troisieme personne ("Etienne a travaille...", "Il possede...")
3. Ne te fais JAMAIS passer pour Etienne - tu es un assistant qui parle DE lui
4. Si le CONTEXTE ne contient pas l'information demandee, reponds: "Je n'ai pas cette information dans les documents disponibles."
5. N'utilise JAMAIS tes connaissances generales pour completer le CONTEXTE
6. Reponds dans la meme langue que la question (francais ou anglais)

CONTEXTE:
{context}

QUESTION: {question}

REPONSE:"""
```

[CITED: https://aiamastery.substack.com/p/lesson-25-advanced-prompting-for]

### Pattern 3: Retrieve Function Implementation

**What:** Top-k retrieval returning document chunks with metadata
**When to use:** Called for every user question

```python
# Source: LangChain patterns
from langchain.schema import Document

def retrieve(question: str, k: int = 5) -> list[Document]:
    """Retrieve top-k relevant chunks for a question.

    Args:
        question: User's question in French or English
        k: Number of chunks to retrieve (default: 5)

    Returns:
        List of Document objects with page_content and metadata
    """
    retriever = get_retriever(k=k)
    return retriever.invoke(question)
```

### Pattern 4: Build Prompt with Source Metadata

**What:** Format retrieved chunks into prompt with source attribution
**When to use:** After retrieval, before LLM call

```python
# Source: Best practices from RAG implementations
def build_prompt(question: str, chunks: list[Document]) -> str:
    """Build formatted prompt with context and question.

    Args:
        question: User's question
        chunks: Retrieved document chunks

    Returns:
        Formatted prompt string ready for LLM
    """
    if not chunks:
        context = "Aucun document pertinent trouve."
    else:
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            source = chunk.metadata.get("source", "Unknown")
            content = chunk.page_content.strip()
            context_parts.append(f"[Source {i}: {source}]\n{content}")
        context = "\n\n".join(context_parts)

    return SYSTEM_PROMPT.format(context=context, question=question)
```

### Anti-Patterns to Avoid

- **Using `similarity_search()` directly instead of `as_retriever()`:** Harder to test and swap search strategies
- **Omitting embedding model specification:** MUST use same model as indexer or similarity scores are meaningless
- **Weak "I don't know" instruction:** Simple "say I don't know if unsure" fails — must explicitly forbid using training knowledge
- **First-person system prompt:** "I am Etienne" creates weird uncanny-valley effect; third-person is more professional

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vector similarity search | Custom cosine similarity | `Chroma.as_retriever()` | Handles embeddings, batching, edge cases |
| Prompt templating | f-strings with manual escaping | LangChain `ChatPromptTemplate` (optional) or format() | Safer, more maintainable |
| Language detection | langdetect/fasttext | Prompt instruction | Claude handles multilingual natively; detection on short text is unreliable |
| Embedding generation | OpenAI SDK directly | `OpenAIEmbeddings` | Consistent with indexer, automatic retry |

**Key insight:** For this simple RAG module, direct function calls (`retrieve()` and `build_prompt()`) are cleaner than over-engineering with LangChain's LCEL chains. The module is a building block, not a full pipeline.

## Common Pitfalls

### Pitfall 1: Embedding Model Mismatch

**What goes wrong:** Retrieval returns irrelevant chunks or fails silently
**Why it happens:** Using different embedding model than indexer (e.g., `text-embedding-ada-002` vs `text-embedding-3-small`)
**How to avoid:** Explicitly specify `model="text-embedding-3-small"` in both indexer and retriever
**Warning signs:** Chunks returned don't match query semantically; similarity scores unexpectedly low

### Pitfall 2: Weak Hallucination Prevention

**What goes wrong:** Bot fabricates information not in documents
**Why it happens:** Simple "I don't know" prompts don't override LLM's tendency to be helpful
**How to avoid:** Use STRICT grounding rules with explicit prohibition: "N'utilise JAMAIS tes connaissances generales"
**Warning signs:** Bot answers questions about topics not in indexed documents

### Pitfall 3: Empty Retrieval Handling

**What goes wrong:** Error or nonsensical response when no relevant chunks found
**Why it happens:** Not checking for empty results before building prompt
**How to avoid:** Default context text: "Aucun document pertinent trouve." and handle gracefully
**Warning signs:** Exceptions or blank responses for edge-case questions

### Pitfall 4: Language Switching Mid-Response

**What goes wrong:** Bot starts in French, switches to English mid-sentence
**Why it happens:** Context documents in one language, question in another
**How to avoid:** Explicit instruction: "Reponds dans la meme langue que la question"
**Warning signs:** Mixed-language responses, especially on technical terms

### Pitfall 5: ChromaDB Collection Not Found

**What goes wrong:** Empty results or error when connecting to vectorstore
**Why it happens:** Wrong `persist_directory` or `collection_name`, or Phase 1 not run
**How to avoid:** Verify collection exists at startup; clear error message if missing
**Warning signs:** `retrieve()` always returns empty list

## Code Examples

### Complete rag.py Implementation

```python
"""RAG module for CV Chatbot.

Provides retrieval and prompt construction for recruiter questions.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document

# Load environment variables
load_dotenv()

# Configuration
CHROMA_DIR = "./chroma_db"
COLLECTION_NAME = "cv_documents"
EMBEDDING_MODEL = "text-embedding-3-small"
DEFAULT_K = 5

# System prompt with strict grounding rules
SYSTEM_PROMPT = """Tu es un assistant virtuel qui repond aux questions des recruteurs a propos d'Etienne Lepironnec.

REGLES STRICTES:
1. Reponds UNIQUEMENT en utilisant les informations du CONTEXTE ci-dessous
2. Parle d'Etienne a la troisieme personne ("Etienne a travaille...", "Il possede...")
3. Ne te fais JAMAIS passer pour Etienne - tu es un assistant qui parle DE lui
4. Si le CONTEXTE ne contient pas l'information demandee, reponds: "Je n'ai pas cette information dans les documents disponibles."
5. N'utilise JAMAIS tes connaissances generales pour completer le CONTEXTE
6. Reponds dans la meme langue que la question (francais ou anglais)

CONTEXTE:
{context}

QUESTION: {question}

REPONSE:"""


def _get_vectorstore() -> Chroma:
    """Initialize ChromaDB vectorstore with embeddings."""
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY not found. Set it in .env file.")

    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)

    # Check if ChromaDB directory exists
    if not Path(CHROMA_DIR).exists():
        raise FileNotFoundError(
            f"ChromaDB directory not found at {CHROMA_DIR}. "
            "Run indexer.py first to create the index."
        )

    return Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings
    )


def retrieve(question: str, k: int = DEFAULT_K) -> list[Document]:
    """Retrieve top-k relevant chunks for a question.

    Args:
        question: User's question in French or English
        k: Number of chunks to retrieve (default: 5)

    Returns:
        List of Document objects with page_content and metadata

    Raises:
        ValueError: If OPENAI_API_KEY not set
        FileNotFoundError: If ChromaDB not initialized
    """
    vectorstore = _get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    return retriever.invoke(question)


def build_prompt(question: str, chunks: list[Document]) -> str:
    """Build formatted prompt with context and question.

    Formats retrieved chunks with source metadata and combines
    with system prompt for grounded LLM generation.

    Args:
        question: User's question
        chunks: Retrieved document chunks from retrieve()

    Returns:
        Formatted prompt string ready for LLM
    """
    if not chunks:
        context = "Aucun document pertinent trouve."
    else:
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            source = Path(chunk.metadata.get("source", "Unknown")).name
            content = chunk.page_content.strip()
            context_parts.append(f"[Source {i}: {source}]\n{content}")
        context = "\n\n".join(context_parts)

    return SYSTEM_PROMPT.format(context=context, question=question)


# CLI testing support
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python rag.py 'Your question here'")
        print("Example: python rag.py 'Quelles sont les competences d'Etienne?'")
        sys.exit(1)

    question = " ".join(sys.argv[1:])
    print(f"\nQuestion: {question}")
    print("-" * 50)

    try:
        chunks = retrieve(question)
        print(f"Retrieved {len(chunks)} chunks:")
        for i, chunk in enumerate(chunks, 1):
            source = Path(chunk.metadata.get("source", "Unknown")).name
            preview = chunk.page_content[:100].replace("\n", " ")
            print(f"  {i}. [{source}] {preview}...")

        print("\n" + "=" * 50)
        print("PROMPT:")
        print("=" * 50)
        prompt = build_prompt(question, chunks)
        print(prompt)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
```

[CITED: LangChain documentation, adapted for project requirements]

### ChatAnthropic Usage (for Phase 3 reference)

```python
# Source: LangChain Anthropic documentation
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

# Initialize Claude Haiku
llm = ChatAnthropic(
    model="claude-3-haiku-20240307",  # Cost-effective model
    temperature=0,  # Deterministic for factual Q&A
    max_tokens=1024
)

# Use with messages
messages = [
    SystemMessage(content=SYSTEM_PROMPT.format(context=context, question="")),
    HumanMessage(content=question)
]
response = llm.invoke(messages)
print(response.content)
```

[CITED: https://docs.langchain.com/oss/python/integrations/chat/anthropic]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| langchain (monolith) | langchain + langchain-* packages | 2024 | Must install langchain-anthropic separately |
| `text-embedding-ada-002` | `text-embedding-3-small` | 2024 | Better performance, lower cost, same dimension |
| `claude-instant-1.2` | `claude-3-haiku-20240307` | 2024 | Haiku is faster and cheaper than instant |
| ChromaDB 0.4.x | ChromaDB 1.x | 2025 | Breaking changes in API; project uses 1.x |

**Deprecated/outdated:**
- `langchain_community.chat_models.anthropic`: Use `langchain_anthropic.ChatAnthropic` instead
- `ChatAnthropic(model_name=...)`: Use `model=` parameter

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | langchain-anthropic 0.3.x compatible with langchain-core 0.2.x | Standard Stack | Version conflict at install; may need to upgrade langchain stack |
| A2 | Claude Haiku model string `claude-3-haiku-20240307` is current | Code Examples | API error; update model string |
| A3 | Claude natively handles French/English without explicit detection | Patterns | May need langdetect fallback if language switching issues occur |

## Open Questions

1. **ChromaDB version compatibility**
   - What we know: Project uses chromadb 1.5.9 due to Windows/Python 3.12 build issues
   - What's unclear: Whether langchain-community 0.2.16 fully supports chromadb 1.x API
   - Recommendation: Test retrieval early in implementation; fall back to similarity_search() if as_retriever() fails

2. **Optimal k value**
   - What we know: Requirement specifies k=5 default, configurable
   - What's unclear: Whether 5 chunks provides enough context without exceeding token limits
   - Recommendation: Start with k=5; tune based on actual document lengths and Haiku's context window (200k tokens)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| OPENAI_API_KEY | Embeddings | Expected | — | Required, no fallback |
| ANTHROPIC_API_KEY | Generation (Phase 3) | Expected | — | Required, no fallback |
| ChromaDB index | Retrieval | Expected | ./chroma_db | Run indexer.py first |
| langchain-anthropic | Phase 3 generation | Not installed | — | pip install at Phase 2 start |

**Missing dependencies with no fallback:**
- API keys must be configured in .env

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 9.0.3 |
| Config file | None (uses pytest defaults) |
| Quick run command | `pytest tests/test_rag.py -x -v` |
| Full suite command | `pytest tests/ -v` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RAG-01 | retrieve() returns k chunks | unit | `pytest tests/test_rag.py::test_retrieve_returns_documents -x` | Wave 0 |
| RAG-02 | build_prompt() formats correctly | unit | `pytest tests/test_rag.py::test_build_prompt_formats_context -x` | Wave 0 |
| RAG-03 | System prompt third-person | unit | `pytest tests/test_rag.py::test_system_prompt_third_person -x` | Wave 0 |
| RAG-04 | "I don't know" instruction present | unit | `pytest tests/test_rag.py::test_system_prompt_grounding -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `pytest tests/test_rag.py -x -v`
- **Per wave merge:** `pytest tests/ -v`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/test_rag.py` — covers RAG-01, RAG-02, RAG-03, RAG-04
- [ ] Fixture for mock ChromaDB or test with real index

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | User questions passed to LLM; prompt injection risk |
| V6 Cryptography | no | — |

### Known Threat Patterns for RAG

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection | Tampering | Clear context/question separation in prompt structure |
| API key exposure | Information Disclosure | .env file, never hardcode, .gitignore |
| Excessive token usage | Denial of Service | max_tokens limit on LLM call |

**Note:** This phase does not make LLM API calls (that's Phase 3). Prompt injection risk exists but is low for this recruiter Q&A use case.

## Sources

### Primary (HIGH confidence)
- [LangChain Chroma Documentation](https://docs.langchain.com/oss/python/integrations/vectorstores/chroma) — retriever patterns, similarity_search
- [LangChain Anthropic Integration](https://docs.langchain.com/oss/python/integrations/chat/anthropic) — ChatAnthropic usage

### Secondary (MEDIUM confidence)
- [AI Amastery - RAG Prompting](https://aiamastery.substack.com/p/lesson-25-advanced-prompting-for) — strict grounding templates
- [pip index versions] — package version verification

### Tertiary (LOW confidence)
- Training knowledge for bilingual prompt patterns — marked for validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages verified on PyPI, LangChain docs current
- Architecture: HIGH — simple module, patterns well-documented
- Pitfalls: HIGH — common issues from multiple sources
- System prompt: MEDIUM — based on best practices, needs testing for Etienne's specific documents

**Research date:** 2026-06-10
**Valid until:** 2026-07-10 (30 days — stable domain)
