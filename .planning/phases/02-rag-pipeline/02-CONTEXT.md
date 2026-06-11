# Phase 2: RAG Pipeline - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning
**Source:** Direct from ROADMAP.md and Phase 1 artifacts

## Phase Boundary

Build the retrieval and prompt construction module that can be tested independently via CLI before UI integration.

**Inputs from Phase 1:**
- `chroma_db/` — ChromaDB collection `cv_documents` with 19 indexed chunks
- `indexer.py` — Reference for how documents were loaded and embedded
- OpenAI `text-embedding-3-small` embeddings

**Outputs:**
- `rag.py` — Module with `retrieve()` and `build_prompt()` functions
- System prompt text with grounding rules
- CLI test capability

## Implementation Decisions

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

## Canonical References

**Downstream agents MUST read these before planning or implementing:**

- `.planning/PROJECT.md` — Project constraints (Claude Haiku, OpenAI embeddings)
- `.planning/research/STACK.md` — Technology versions and patterns
- `.planning/phases/01-project-setup-indexing/01-02-SUMMARY.md` — How ChromaDB was set up
- `indexer.py` — ChromaDB collection name and embedding model used

## Phase Requirements

| ID | Description | Priority |
|----|-------------|----------|
| RAG-01 | rag.py provides retrieve(question, k=5) returning top-k chunks | Must |
| RAG-02 | rag.py provides build_prompt(question, chunks) constructing final prompt | Must |
| RAG-03 | System prompt presents bot as assistant about the candidate | Must |
| RAG-04 | System prompt enforces "I don't know" for missing information | Must |

## Success Criteria

From ROADMAP.md:
1. `retrieve("What are Étienne's skills?", k=5)` returns relevant chunks
2. `build_prompt(question, chunks)` constructs a well-formatted prompt with system instructions
3. System prompt enforces "I don't know" behavior for missing information
4. Can test RAG quality via CLI before UI integration

## Technical Notes

- ChromaDB collection name: `cv_documents`
- ChromaDB persist directory: `./chroma_db`
- Embedding model: `text-embedding-3-small` (must match indexer)
- LLM for generation: Claude Haiku via `langchain-anthropic`

## Assumptions

1. User has ANTHROPIC_API_KEY in addition to OPENAI_API_KEY
2. ChromaDB collection exists and is populated (Phase 1 complete)
3. Claude Haiku supports French natively without special configuration

---
*Context gathered: 2026-06-10*
