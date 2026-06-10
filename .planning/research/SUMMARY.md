# Research Summary

**Project:** CV Chatbot
**Researched:** 2026-06-10
**Confidence:** HIGH

## Executive Summary

Building a RAG-powered CV chatbot is a well-understood pattern with mature tooling. The chosen stack (LangChain + ChromaDB + Chainlit + Claude Haiku) is appropriate and production-ready. Key risks are around chunking strategy, ChromaDB persistence on HuggingFace Spaces, and RAG quality tuning.

## Stack Recommendation

| Component | Choice | Confidence |
|-----------|--------|------------|
| Runtime | Python 3.11+ | HIGH |
| RAG Framework | LangChain 0.2.x | HIGH |
| Vector Store | ChromaDB 0.4.24 | HIGH |
| Embeddings | OpenAI text-embedding-3-small | HIGH |
| LLM | Claude Haiku (Anthropic) | HIGH |
| UI | Chainlit 1.1.x | HIGH |
| Deployment | HuggingFace Spaces | HIGH |

**Key version pins:**
- `chromadb>=0.4.24,<0.5.0` — avoid 0.5.x breaking changes
- `langchain>=0.2.0,<0.3.0` — use new split packages
- `chainlit>=1.1.0` — native starters feature

## Feature Priorities

### Must Have (P1)

1. **Document indexing** — PDF + Markdown loading, chunking, embedding
2. **RAG retrieval** — Query ChromaDB, return top-k chunks
3. **Claude Haiku streaming** — Fast, responsive chat UX
4. **Chainlit UI** — Clean chat interface with welcome message
5. **Starter questions** — One-click engagement for recruiters
6. **Bilingual support** — French default, English if recruiter prefers
7. **Honest unknowns** — Say "I don't know" rather than hallucinate
8. **HF Spaces deployment** — Public URL for QR code

### Explicitly Excluded

- Multi-candidate support
- User authentication/tracking
- Analytics
- Real-time document updates
- Voice input
- Chat history persistence

## Architecture

```
/docs → indexer.py → /chroma_db → rag.py → app.py → Recruiter
        (one-shot)   (persist)    (retrieve) (Chainlit + Claude)
```

**Build order:**
1. indexer.py (can test independently)
2. rag.py (can test with CLI)
3. app.py (integrate with Chainlit)
4. Deploy to HF Spaces

## Critical Pitfalls to Avoid

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| ChromaDB persistence fails on HF Spaces | Deployment broken | Use `PersistentClient`, include chroma_db/ in deploy |
| Fixed-token chunking destroys CV structure | Poor retrieval quality | Semantic chunking by CV section |
| OpenAI rate limiting during indexing | Indexing fails | Batch requests, exponential backoff |
| PDF parsing loses tables/lists | Skills matrix unreadable | Use `unstructured` or prefer Markdown |
| LLM hallucination | False claims about candidate | Strong system prompt grounding |

## Roadmap Implications

**Phase 1: Indexing Pipeline**
- Set up project structure
- Implement document loading (PDF + Markdown)
- Chunking strategy (semantic, CV-aware)
- Embeddings generation with rate limit handling
- ChromaDB persistence with correct configuration

**Phase 2: RAG Pipeline**
- retrieve() function with configurable k
- build_prompt() with system prompt
- CLI testing before UI integration

**Phase 3: Chainlit Application**
- Basic chat flow with Claude Haiku
- Streaming responses
- Starter questions configuration
- Welcome message

**Phase 4: Deployment**
- Local testing complete
- HuggingFace Spaces configuration
- Secrets management (API keys)
- QR code generation

## Open Questions

1. **Optimal chunk size for CV documents** — Start with semantic (one chunk per job/section), validate with test queries
2. **Number of chunks to retrieve (k)** — Start with k=5, adjust based on response quality
3. **System prompt refinement** — Initial version in brief, expect iteration

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack choices | HIGH | Well-documented, proven combinations |
| Architecture | HIGH | Standard RAG pattern |
| Feature scope | HIGH | Clear boundaries from brief |
| Deployment | MEDIUM | HF Spaces persistence needs testing |
| RAG quality | MEDIUM | Depends on document structure |

## Next Steps

1. Define requirements from feature research
2. Create roadmap with 4 phases
3. Start with Phase 1: Indexing Pipeline

---
*Research synthesis for: CV Chatbot*
*Completed: 2026-06-10*
