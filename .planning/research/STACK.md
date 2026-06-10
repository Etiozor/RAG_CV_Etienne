# Stack Research

**Domain:** RAG Chatbot / CV Assistant
**Researched:** 2026-06-10
**Confidence:** HIGH

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

```bash
# Core
pip install langchain langchain-openai langchain-anthropic langchain-community

# Vector store
pip install chromadb

# UI
pip install chainlit

# Document processing
pip install pypdf python-dotenv

# Optional: better PDF parsing
pip install unstructured
```

## requirements.txt

```
langchain>=0.2.0,<0.3.0
langchain-community>=0.2.0,<0.3.0
langchain-openai>=0.1.0,<0.2.0
langchain-anthropic>=0.1.0,<0.2.0
chromadb>=0.4.24,<0.5.0
chainlit>=1.1.0,<2.0.0
pypdf>=4.0.0
python-dotenv>=1.0.0
openai>=1.0.0
anthropic>=0.25.0
```

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

**If deploying to HuggingFace Spaces:**
- Use `PersistentClient` for ChromaDB with absolute paths
- Include `chroma_db/` directory in deployment
- Store API keys in HF Spaces secrets, not .env

**If PDF documents have complex structure (tables, skills matrices):**
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

---
*Stack research for: RAG Chatbot / CV Assistant*
*Researched: 2026-06-10*
