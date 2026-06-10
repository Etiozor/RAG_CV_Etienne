# Phase 1: Project Setup & Indexing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-10
**Phase:** 1-Project Setup & Indexing
**Areas discussed:** PDF parsing, Chunking approach

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| PDF parsing | pypdf (simple, fast) vs unstructured (handles tables, complex layouts) | ✓ |
| Chunking approach | RecursiveCharacterTextSplitter vs token-based vs section-aware | ✓ |
| Chunk metadata | What metadata to store with each chunk? | |
| Error handling | Fail fast on any error vs process what we can | |

**User's choice:** PDF parsing, Chunking approach
**Notes:** User chose to focus on the core parsing and chunking decisions, leaving metadata and error handling to Claude's discretion.

---

## PDF Parsing

### Question 1: PDF Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Simple text flow | Mostly paragraphs, bullets, and headers. Standard one-column or two-column layout. | ✓ |
| Tables/grids | Contains tables for skills, experience timeline grids, or structured data layouts. | |
| Complex design | Multi-column with sidebars, graphics, icons, or visual elements that carry meaning. | |

**User's choice:** Simple text flow
**Notes:** User confirmed the CV is a straightforward text-flow document.

### Question 2: PDF Library

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, pypdf (Recommended) | Good fit for simple layouts. If we hit issues, we can swap to unstructured later. | ✓ |
| Use unstructured anyway | More robust but heavier dependency. May be overkill for your needs. | |

**User's choice:** Yes, pypdf (Recommended)
**Notes:** None — straightforward confirmation.

---

## Chunking Approach

### Question 1: Chunking Method

| Option | Description | Selected |
|--------|-------------|----------|
| RecursiveCharacterTextSplitter (Recommended) | LangChain default. Splits on paragraphs first, then sentences, then words. Good for varied content. | ✓ |
| Token-based splitter | More precise token counts. Requires tiktoken. Better control but more complex. | |
| Let Claude decide | I'll pick the best approach based on LangChain best practices for RAG. | |

**User's choice:** RecursiveCharacterTextSplitter (Recommended)
**Notes:** None — user accepted the recommended approach.

### Question 2: Chunk Size

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, ~2000 chars (Recommended) | Roughly 500 tokens. Standard RAG chunk size. Good balance of context vs precision. | ✓ |
| Smaller (~1000 chars) | More precise retrieval but loses context. Better for very specific Q&A. | |
| Larger (~3000 chars) | More context per chunk but retrieval may be less precise. Better for narrative content. | |

**User's choice:** Yes, ~2000 chars (Recommended)
**Notes:** User accepted the standard RAG chunk size with 200 char overlap.

---

## Claude's Discretion

- Chunk metadata structure (source file, page number, etc.)
- Error handling approach in indexer.py
- Document loader ordering (PDF first vs Markdown first)

## Deferred Ideas

None — discussion stayed within phase scope.
