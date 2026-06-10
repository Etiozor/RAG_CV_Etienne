<!-- GSD:project-start source:PROJECT.md -->

## Project

**CV Chatbot**

A RAG-powered chatbot accessible via QR code (on paper CV or PDF) that allows recruiters to ask questions about Étienne's professional profile. The bot responds in natural language based on real source documents (mandates, CV, skills) through a RAG pipeline. Deployed on HuggingFace Spaces for free, stable public URL.

**Core Value:** Recruiters can instantly get accurate, contextual answers about the candidate's experience and skills — without the candidate being present.

### Constraints

- **LLM**: Claude Haiku via Anthropic API — economic, excellent French support
- **Embeddings**: OpenAI `text-embedding-3-small` — economic, performant, multilingual
- **Vector Store**: ChromaDB — local, no server to manage, must be included in HF Spaces deployment
- **UI**: Chainlit — turnkey chatbot UI, clean, deployable
- **Deployment**: HuggingFace Spaces — free, stable public URL for QR code
- **Language**: Python 3.11+
- **API Keys**: Must be stored in `.env`, never hardcoded; configured as secrets on HF Spaces

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Python | 3.11+ | Runtime | Stable, full library support, required for Chainlit |
| LangChain | 0.2.x | RAG orchestration | Industry standard, excellent documentation, modular design |
| ChromaDB | 0.4.24 | Vector store | Local, serverless, simple API, HF Spaces compatible |
| Chainlit | 1.1.x | Chat UI | Purpose-built for LLM apps, starters feature, streaming native |
| OpenAI API | latest | Embeddings | text-embedding-3-small is cost-effective and multilingual |
| Anthropic API | latest | LLM generation | Claude Haiku is economical, excellent French support |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| langchain-openai | 0.1.x | OpenAI embeddings integration | Always - required for text-embedding-3-small |
| langchain-anthropic | 0.1.x | Claude integration | Always - required for Claude Haiku |
| langchain-community | 0.2.x | ChromaDB + document loaders | Always - bridges LangChain to ChromaDB |
| pypdf | 4.x | PDF parsing | For cv.pdf extraction |
| python-dotenv | 1.0.x | Environment variables | Always - API key management |
| unstructured | 0.14.x | Advanced document parsing | If PDF structure is complex (tables, lists) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pip / pip-tools | Dependency management | Pin versions in requirements.txt |
| python-dotenv | Local env loading | .env file for API keys |

## Installation

# Core

# Vector store

# UI

# Document processing

# Optional: better PDF parsing

## requirements.txt

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| ChromaDB | Pinecone | Need managed cloud vector DB, higher scale |
| ChromaDB | FAISS | Pure in-memory, no persistence needed |
| Claude Haiku | GPT-4o-mini | Already using OpenAI for everything |
| Chainlit | Gradio | Simpler UI needs, no chat-specific features |
| Chainlit | Streamlit | General dashboards, not chat-focused |
| LangChain | LlamaIndex | More opinionated RAG framework |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| ChromaDB 0.5.x | Breaking changes, HF Spaces issues reported | ChromaDB 0.4.24 |
| langchain (old monolith) | Deprecated, split into sub-packages | langchain + langchain-* packages |
| PyPDF2 | Deprecated, replaced by pypdf | pypdf |
| Direct OpenAI client for embeddings | Harder to swap providers | langchain-openai |

## Stack Patterns by Variant

- Use `PersistentClient` for ChromaDB with absolute paths
- Include `chroma_db/` directory in deployment
- Store API keys in HF Spaces secrets, not .env
- Add `unstructured` library for better parsing
- Consider converting to Markdown for cleaner chunking

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| chromadb==0.4.24 | langchain-community>=0.2.0 | Stable combination |
| chainlit>=1.1.0 | anthropic>=0.25.0 | Streaming works correctly |
| langchain-openai | openai>=1.0.0 | Required for new OpenAI API |

## Sources

- LangChain documentation (2026)
- ChromaDB GitHub issues (persistence on HF Spaces)
- Chainlit documentation
- OpenAI/Anthropic API documentation

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
