# Phase 1: Project Setup & Indexing - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the document indexing pipeline that processes CV documents (PDF and Markdown) into a searchable ChromaDB vector store. This includes project setup (requirements.txt, .env, .gitignore) and the indexer.py script that loads, chunks, embeds, and persists documents.

</domain>

<decisions>
## Implementation Decisions

### PDF Parsing
- **D-01:** Use **pypdf** for PDF parsing — simple, fast, sufficient for the text-flow CV layout
- **D-02:** If pypdf encounters issues with complex layouts, consider swapping to unstructured later

### Chunking Strategy
- **D-03:** Use **RecursiveCharacterTextSplitter** (LangChain default) — adapts to document structure by splitting on paragraphs first, then sentences, then words
- **D-04:** Chunk size: **~2000 characters** (approximately 500 tokens)
- **D-05:** Overlap: **200 characters** for context continuity between chunks

### Claude's Discretion
- Chunk metadata structure (source file, page number, etc.) — Claude can decide based on LangChain best practices
- Error handling approach in indexer.py — Claude can decide based on typical Python RAG patterns
- Document loader ordering (PDF first vs Markdown first) — implementation detail

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/REQUIREMENTS.md` — Full v1 requirements with traceability (IDX-01 through IDX-06, SETUP-01 through SETUP-03)
- `.planning/PROJECT.md` §Constraints — Locked technology choices (ChromaDB, OpenAI embeddings, Python 3.11+)
- `.planning/PROJECT.md` §Architecture — File structure and expected output

### Stack Reference
- `.planning/research/STACK.md` — Technology stack with version compatibility notes (ChromaDB 0.4.24, LangChain 0.2.x)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project

### Established Patterns
- None yet — this is the first phase

### Integration Points
- `docs/` directory will contain source documents (cv.pdf, mandats.md, competences.md)
- `chroma_db/` directory will be created for vector store persistence
- Output must be consumable by Phase 2's RAG pipeline

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard LangChain RAG patterns for document indexing.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 1-Project Setup & Indexing*
*Context gathered: 2026-06-10*
