# Architecture Research

**Domain:** RAG Chatbot / CV Assistant
**Researched:** 2026-06-10
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     INDEXING PIPELINE (one-shot)            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────────┐    ┌──────────────┐        │
│  │  /docs  │ →  │  Chunking   │ →  │  Embeddings  │        │
│  │ (source)│    │  (split)    │    │  (OpenAI)    │        │
│  └─────────┘    └─────────────┘    └──────┬───────┘        │
│                                           ↓                 │
│                                    ┌──────────────┐        │
│                                    │  ChromaDB    │        │
│                                    │  (persist)   │        │
│                                    └──────────────┘        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     QUERY PIPELINE (runtime)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────────┐    ┌──────────────┐        │
│  │ Recruiter│ →  │  Chainlit   │ →  │  RAG Pipeline│        │
│  │ Question│    │  (UI)       │    │  (rag.py)    │        │
│  └─────────┘    └─────────────┘    └──────┬───────┘        │
│                                           ↓                 │
│       ┌───────────────────────────────────┴────────────┐   │
│       ↓                                                ↓   │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────┐      │
│  │ ChromaDB │ →  │  Build      │ →  │ Claude Haiku │      │
│  │ (retrieve)│    │  Prompt     │    │ (generate)   │      │
│  └──────────┘    └─────────────┘    └──────┬───────┘      │
│                                            ↓               │
│                                    ┌──────────────┐        │
│                                    │  Streaming   │        │
│                                    │  Response    │        │
│                                    └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| /docs | Source documents | CV PDF, mandats.md, competences.md |
| indexer.py | One-shot indexing | Load → chunk → embed → persist |
| chroma_db/ | Vector storage | Persisted ChromaDB collection |
| rag.py | RAG pipeline | retrieve() + build_prompt() |
| app.py | Chainlit application | UI + Claude API calls |
| .env | Secrets | ANTHROPIC_API_KEY, OPENAI_API_KEY |

## Recommended Project Structure

```
cv-chatbot/
├── docs/                    # Source documents (committed)
│   ├── cv.pdf              # Formal CV
│   ├── mandats.md          # Project experiences
│   └── competences.md      # Skills and competencies
├── chroma_db/              # Vector index (gitignore locally, deploy to HF)
│   └── [chromadb files]
├── indexer.py              # One-shot indexing script
├── rag.py                  # RAG pipeline module
│   ├── retrieve()          # Query ChromaDB for relevant chunks
│   └── build_prompt()      # Construct prompt with context
├── app.py                  # Chainlit main application
├── requirements.txt        # Pinned dependencies
├── .env                    # Local API keys (gitignore)
├── .gitignore              # Ignore .env, chroma_db/ locally
└── README.md               # Setup and deployment instructions
```

### Structure Rationale

- **docs/:** Separate from code, easy to update content without touching logic
- **chroma_db/:** Generated artifact, gitignore locally but must deploy to HF Spaces
- **rag.py separate from app.py:** Testable retrieval logic, clean separation
- **Flat structure:** Simple project, no need for src/ or nested packages

## Architectural Patterns

### Pattern 1: Retrieval-Augmented Generation (RAG)

**What:** Query → Retrieve relevant chunks → Inject into prompt → Generate
**When to use:** Always for this project - it's the core pattern
**Trade-offs:**
- Pro: Grounded responses from real documents
- Con: Quality depends on chunking and retrieval

**Example:**
```python
def answer_question(question: str) -> str:
    chunks = retrieve(question, k=5)
    prompt = build_prompt(question, chunks)
    response = llm.generate(prompt)
    return response
```

### Pattern 2: Streaming Response

**What:** Send tokens as they're generated, not wait for complete response
**When to use:** All user-facing chat interactions
**Trade-offs:**
- Pro: Feels much faster, better UX
- Con: Slightly more complex error handling

**Example:**
```python
async def on_message(message):
    async for chunk in llm.stream(prompt):
        await cl.Message(content=chunk).send()
```

### Pattern 3: System Prompt Injection

**What:** Fixed system prompt + dynamic context + user question
**When to use:** Every LLM call
**Trade-offs:**
- Pro: Consistent behavior, grounding
- Con: Uses tokens on every call

## Data Flow

### Indexing Flow (one-shot)

```
[PDF/MD Files]
    ↓ (load)
[Raw Text]
    ↓ (chunk - 500 tokens, 50 overlap)
[Text Chunks]
    ↓ (embed - OpenAI text-embedding-3-small)
[Vectors + Metadata]
    ↓ (persist)
[ChromaDB Collection]
```

### Query Flow (runtime)

```
[Recruiter Question]
    ↓ (embed question)
[Question Vector]
    ↓ (similarity search)
[Top-k Chunks]
    ↓ (build prompt)
[System Prompt + Context + Question]
    ↓ (Claude Haiku API)
[Streaming Response]
    ↓ (Chainlit render)
[Chat Message to Recruiter]
```

### Key Data Flows

1. **Indexing:** Documents → Chunks → Embeddings → ChromaDB
2. **Retrieval:** Question → Embedding → Similarity Search → Relevant Chunks
3. **Generation:** Chunks + Question → Prompt → Claude → Streaming Response

## Build Order (Phase Dependencies)

```
Phase 1: indexer.py
    ├── Load documents from /docs
    ├── Implement chunking
    ├── Generate embeddings (OpenAI)
    └── Persist to ChromaDB
         ↓
Phase 2: rag.py
    ├── retrieve(question, k) function
    └── build_prompt(question, chunks) function
         ↓
Phase 3: app.py
    ├── Chainlit setup
    ├── System prompt
    ├── Claude Haiku streaming
    └── Starter questions
         ↓
Phase 4: Deployment
    ├── Test locally
    ├── HuggingFace Spaces config
    └── QR code generation
```

**Critical path:** indexer.py must complete before rag.py can be tested. rag.py must work before app.py makes sense.

## Anti-Patterns

### Anti-Pattern 1: Embedding at Query Time

**What people do:** Embed documents when user asks a question
**Why it's wrong:** Slow, expensive, pointless - documents don't change
**Do this instead:** Index once at deploy time, query against persisted index

### Anti-Pattern 2: Giant Chunks

**What people do:** Use 2000+ token chunks to "preserve context"
**Why it's wrong:** Retrieval becomes imprecise, irrelevant content pollutes prompt
**Do this instead:** 500 tokens with 50 overlap, semantic chunking if possible

### Anti-Pattern 3: No System Prompt Grounding

**What people do:** Just pass user question + context, no behavioral instructions
**Why it's wrong:** LLM may hallucinate, adopt wrong tone, or answer in wrong language
**Do this instead:** Strong system prompt with explicit rules

### Anti-Pattern 4: Blocking LLM Calls

**What people do:** `response = llm.generate()` then send full response
**Why it's wrong:** User waits 5+ seconds seeing nothing
**Do this instead:** Stream tokens as they're generated

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI API | REST via langchain-openai | Embeddings only, rate limit aware |
| Anthropic API | REST via langchain-anthropic | Claude Haiku, streaming enabled |
| HuggingFace Spaces | Git push deployment | Secrets via HF UI |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| indexer.py → chroma_db/ | File system persistence | One-shot, no runtime coupling |
| rag.py ↔ chroma_db/ | ChromaDB Python client | Query at runtime |
| app.py ↔ rag.py | Python function calls | Direct import |
| app.py ↔ Anthropic | HTTP streaming | langchain-anthropic handles |

## Sources

- LangChain RAG documentation
- ChromaDB persistence guide
- Chainlit streaming examples
- Anthropic streaming API docs

---
*Architecture research for: RAG Chatbot / CV Assistant*
*Researched: 2026-06-10*
