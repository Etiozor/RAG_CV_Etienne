# Phase 4: Deployment - Research

**Researched:** 2026-06-11
**Domain:** HuggingFace Spaces Docker Deployment with Chainlit
**Confidence:** HIGH

## Summary

Deploying a Chainlit application to HuggingFace Spaces requires the Docker SDK (not Gradio or Streamlit). The deployment involves creating a Dockerfile that runs Chainlit on port 7860 with headless mode (`-h`) and host `0.0.0.0`, configuring API keys as HuggingFace Spaces secrets, and including the pre-indexed ChromaDB directory in the Docker image.

HuggingFace Spaces provides stable public URLs in the format `https://<username>-<space-name>.hf.space`, which is ideal for QR code linking. Free tier spaces sleep after 48 hours of inactivity and experience cold starts of up to 1 minute when waking, but this is acceptable for a portfolio/CV chatbot use case.

**Primary recommendation:** Use Docker SDK with a production-ready Dockerfile, include `chroma_db/` in the image via COPY, configure ANTHROPIC_API_KEY and OPENAI_API_KEY as runtime secrets, and test locally with Docker before pushing to HuggingFace.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Chat UI serving | HuggingFace Spaces (Docker) | -- | HF Spaces hosts the Docker container, serves the Chainlit UI |
| API key management | HF Spaces Secrets | -- | Secrets injected as runtime environment variables |
| Vector store | Embedded in container | -- | ChromaDB SQLite files included in Docker image |
| LLM inference | External API (Anthropic) | -- | Claude API called from container at runtime |
| Embeddings | External API (OpenAI) | -- | OpenAI embeddings API called from container |

## Standard Stack

### Core Deployment Components

| Component | Specification | Purpose | Why Standard |
|-----------|--------------|---------|--------------|
| HuggingFace Spaces | Docker SDK | Container hosting | Free, stable URLs, supports websockets [CITED: huggingface.co/docs/hub] |
| Docker | Python 3.11 base | Container runtime | Matches project Python version, official HF template [CITED: huggingface.co/docs/hub/spaces-sdks-docker] |
| Chainlit | 2.11.x | Chat UI framework | Already in use, v2.x has production improvements [VERIFIED: pip registry] |
| ChromaDB | 1.x | Vector store | Current project version, SQLite-backed persistence [VERIFIED: pip registry] |

### Required Files for Deployment

| File | Purpose | Required |
|------|---------|----------|
| `Dockerfile` | Container build instructions | Yes |
| `README.md` | Space metadata (YAML header) | Yes |
| `app.py` | Chainlit application | Yes (exists) |
| `rag.py` | RAG module | Yes (exists) |
| `requirements.txt` | Python dependencies | Yes (exists, needs update) |
| `chainlit.md` | Welcome message | Yes (exists) |
| `.chainlit/config.toml` | Chainlit config | Yes (exists) |
| `chroma_db/` | Pre-indexed vectors | Yes (exists, needs inclusion) |

**Version verification:**
- chainlit: 2.11.1 (latest) [VERIFIED: pip registry 2026-06-11]
- chromadb: 1.5.9 (latest) [VERIFIED: pip registry 2026-06-11]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| chainlit | PyPI | 3+ yrs | High | github.com/Chainlit/chainlit | OK | Approved |
| chromadb | PyPI | 3+ yrs | High | github.com/chroma-core/chroma | OK | Approved |
| langchain | PyPI | 3+ yrs | Very High | github.com/langchain-ai/langchain | OK | Approved |
| anthropic | PyPI | 2+ yrs | High | github.com/anthropics/anthropic-sdk-python | OK | Approved |
| openai | PyPI | 4+ yrs | Very High | github.com/openai/openai-python | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### Deployment Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    HuggingFace Spaces                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Docker Container                        │  │
│  │                                                           │  │
│  │  ┌─────────┐    ┌─────────┐    ┌──────────────────────┐  │  │
│  │  │ Chainlit│───►│ rag.py  │───►│ chroma_db/ (SQLite)  │  │  │
│  │  │ app.py  │    │         │    │ (embedded in image)  │  │  │
│  │  └────┬────┘    └────┬────┘    └──────────────────────┘  │  │
│  │       │              │                                    │  │
│  │       ▼              ▼                                    │  │
│  │  ┌─────────┐    ┌─────────┐                              │  │
│  │  │Anthropic│    │ OpenAI  │  ◄── API keys via           │  │
│  │  │   API   │    │   API   │      HF Secrets              │  │
│  │  └─────────┘    └─────────┘                              │  │
│  │                                                           │  │
│  │  Port 7860 ◄─────────────────────────────────────────────│──┼──► Public URL
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Secrets: ANTHROPIC_API_KEY, OPENAI_API_KEY                     │
│  URL: https://<username>-<space-name>.hf.space                  │
└─────────────────────────────────────────────────────────────────┘
```

### Dockerfile Pattern (Production)

**What:** Multi-stage Dockerfile with proper user permissions for HF Spaces
**When to use:** All HuggingFace Spaces Docker deployments
**Example:**

```dockerfile
# Source: https://huggingface.co/docs/hub/spaces-sdks-docker
FROM python:3.11-slim

# Create non-root user (HF Spaces runs as UID 1000)
RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install dependencies first (layer caching)
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=user app.py rag.py chainlit.md ./
COPY --chown=user .chainlit ./.chainlit

# Copy pre-indexed ChromaDB (critical for RAG)
COPY --chown=user chroma_db ./chroma_db

# Chainlit production flags:
# -h: headless (no browser open)
# --host 0.0.0.0: accept external connections
# --port 7860: HF Spaces default port
CMD ["chainlit", "run", "app.py", "-h", "--host", "0.0.0.0", "--port", "7860"]
```

### README.md YAML Header Pattern

**What:** HuggingFace Space metadata in README.md
**When to use:** Required for all HF Spaces
**Example:**

```yaml
---
title: CV Chatbot Etienne
emoji: 💼
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---
```

### Anti-Patterns to Avoid

- **Running as root:** HF Spaces runs as UID 1000; root causes permission errors
- **Using `--host 127.0.0.1`:** Container won't accept external connections
- **Forgetting `-h` flag:** Opens browser server-side, breaks deployment
- **Putting chroma_db in .gitignore for HF:** Must be included in deployment
- **Hardcoding API keys:** Use HF Secrets, never commit keys
- **Using persistent storage path (`/data`):** Not available at build time, only runtime

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Container orchestration | Custom deployment scripts | HF Spaces Docker SDK | Handles scaling, restarts, HTTPS automatically |
| Secrets management | .env files in repo | HF Spaces Secrets | Secure injection, never in git history |
| Public URL/SSL | nginx + certbot | HF Spaces | Automatic HTTPS, stable subdomain |
| Health checks | Custom endpoint | HF Spaces built-in | Automatic container health monitoring |

**Key insight:** HuggingFace Spaces abstracts away infrastructure complexity. Focus on the Dockerfile and let HF handle SSL, routing, restarts.

## Common Pitfalls

### Pitfall 1: ChromaDB Path Issues
**What goes wrong:** App can't find chroma_db at runtime, returns "no documents found"
**Why it happens:** Relative paths work differently in Docker; chroma_db not copied to image
**How to avoid:**
- Use `COPY --chown=user chroma_db ./chroma_db` in Dockerfile
- Verify path in rag.py matches container working directory
- Test locally with `docker build` and `docker run` before pushing
**Warning signs:** "FileNotFoundError: chroma_db" or empty RAG responses

### Pitfall 2: Permission Denied Errors
**What goes wrong:** Container fails to start or write files
**Why it happens:** HF Spaces runs as UID 1000, not root
**How to avoid:**
- Always use `RUN useradd -m -u 1000 user` and `USER user`
- Use `COPY --chown=user` for all file copies
- Don't try to write to system directories
**Warning signs:** "Permission denied" in build or runtime logs

### Pitfall 3: WebSocket Connection Failures
**What goes wrong:** Chat UI loads but messages don't send/receive
**Why it happens:** Missing `--host 0.0.0.0` or websocket not enabled
**How to avoid:**
- Use `--host 0.0.0.0` in CMD
- Ensure `allow_origins = ["*"]` in .chainlit/config.toml (already set)
- HF Spaces supports websockets natively
**Warning signs:** "Unable to connect to server" in browser console

### Pitfall 4: Cold Start API Timeout
**What goes wrong:** First request after sleep times out
**Why it happens:** Free tier sleeps after 48h; wake + model load can take ~1 min
**How to avoid:**
- This is expected behavior on free tier
- First user sees brief loading; subsequent requests are fast
- For critical use: upgrade to paid tier or use ping service
**Warning signs:** 504 timeout on first request after long inactivity

### Pitfall 5: API Key Not Found
**What goes wrong:** App crashes with "API key not found" error
**Why it happens:** Secrets not configured in HF Spaces settings
**How to avoid:**
- Add ANTHROPIC_API_KEY and OPENAI_API_KEY in Space Settings > Secrets
- Secrets are injected as environment variables at runtime
- Test locally with `docker run -e ANTHROPIC_API_KEY=xxx`
**Warning signs:** ValueError or KeyError for API key on startup

## Code Examples

### Dockerfile (Complete Production Version)

```dockerfile
# Source: https://huggingface.co/docs/hub/spaces-sdks-docker
# Combined with Chainlit deployment best practices
FROM python:3.11-slim

# Security: Create non-root user matching HF Spaces UID
RUN useradd -m -u 1000 user
USER user

# Environment setup
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

WORKDIR $HOME/app

# Dependencies first for Docker layer caching
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Application code
COPY --chown=user app.py rag.py indexer.py chainlit.md ./
COPY --chown=user .chainlit ./.chainlit

# Pre-indexed vector store (critical: must not be in .gitignore for deployment)
COPY --chown=user chroma_db ./chroma_db

# Expose port for HF Spaces
EXPOSE 7860

# Production Chainlit command
# -h: headless mode (no browser open on server)
# --host 0.0.0.0: accept connections from any IP
# --port 7860: HF Spaces default port
CMD ["chainlit", "run", "app.py", "-h", "--host", "0.0.0.0", "--port", "7860"]
```

### README.md for HuggingFace Space

```markdown
---
title: CV Chatbot Etienne
emoji: 💼
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
short_description: RAG chatbot for recruiter questions about Etienne's profile
---

# CV Chatbot - Etienne Lepironnec

An AI assistant that answers recruiter questions about Etienne's professional profile using RAG (Retrieval-Augmented Generation).

## Features
- Natural language Q&A about experience, skills, and projects
- French and English support
- Source-grounded responses (no hallucination)

## Usage
Simply ask questions like:
- "Quelle est l'expérience d'Étienne en data engineering?"
- "What are Etienne's technical skills?"

## Technology
- **LLM:** Claude (Anthropic)
- **Embeddings:** OpenAI text-embedding-3-small
- **Vector Store:** ChromaDB
- **UI:** Chainlit
```

### Local Docker Testing Commands

```bash
# Build the image locally
docker build -t cv-chatbot .

# Run with API keys (for local testing)
docker run -p 7860:7860 \
  -e ANTHROPIC_API_KEY="your-key-here" \
  -e OPENAI_API_KEY="your-key-here" \
  cv-chatbot

# Access at http://localhost:7860
```

### HuggingFace Deployment Commands

```bash
# Option 1: Push directly to HuggingFace Space
# First, create space at huggingface.co/new-space with Docker SDK

# Clone the space
git clone https://huggingface.co/spaces/<username>/cv-chatbot-etienne
cd cv-chatbot-etienne

# Copy files from project (including chroma_db!)
cp ../app.py ../rag.py ../indexer.py ../chainlit.md ../requirements.txt .
cp -r ../.chainlit .
cp -r ../chroma_db .
# Create Dockerfile and README.md with HF header

# Push to HuggingFace
git add .
git commit -m "Initial deployment"
git push

# Option 2: Add HF Space as remote to existing repo
git remote add space https://huggingface.co/spaces/<username>/cv-chatbot-etienne
git push space main
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Gradio for all chatbots | Chainlit for chat-specific | 2024+ | Better streaming, sessions, starters |
| ChromaDB 0.4.x | ChromaDB 1.x | 2024 | New API, better SQLite support |
| .env files in Docker | HF Secrets | Always | Security best practice |
| Manual HTTPS setup | HF Spaces automatic | Always | Free SSL certificates |

**Deprecated/outdated:**
- `--watch` flag in production: Development only, use `-h` instead
- DuckDB backend for ChromaDB: Removed in 0.4.0, SQLite only

## Open Questions

1. **Exact Space naming convention**
   - What we know: URL will be `https://<username>-<space-name>.hf.space`
   - What's unclear: Exact username for the HF account
   - Recommendation: Use descriptive name like `cv-chatbot-etienne` for clean QR code URL

2. **Cold start acceptable?**
   - What we know: Free tier sleeps after 48h, ~1 min cold start
   - What's unclear: How often recruiters will hit cold starts
   - Recommendation: Accept for MVP; document expected wait in chainlit.md; upgrade if usage warrants

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Local testing | Check locally | -- | Push directly to HF (builds there) |
| Python 3.11 | Runtime | Yes | 3.11+ | Docker base image handles this |
| HuggingFace account | Deployment | Required | -- | Create free account at huggingface.co |
| git | Deployment push | Yes | -- | Use HF web UI file upload |

**Missing dependencies with no fallback:**
- HuggingFace account (free to create)

**Missing dependencies with fallback:**
- Docker for local testing (can push to HF and test there instead)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 8.x |
| Config file | None (default discovery) |
| Quick run command | `pytest tests/ -x -q` |
| Full suite command | `pytest tests/ -v` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEP-01 | App deploys to HF Spaces | manual | Push and verify URL loads | N/A |
| DEP-02 | API keys configured via secrets | manual | Check app responds after deploy | N/A |
| DEP-03 | chroma_db included in deployment | integration | `docker build && docker run` test | Wave 0 |
| DEP-04 | Public URL stable for QR | manual | Verify URL format | N/A |
| SETUP-04 | README with instructions | manual | Review documentation | N/A |

### Sampling Rate
- **Per task commit:** Local Docker build test
- **Per wave merge:** Full deploy to HF Spaces staging
- **Phase gate:** Production URL accessible and functional

### Wave 0 Gaps
- [ ] Local Docker build script for CI
- [ ] Smoke test for ChromaDB accessibility in container

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Public chatbot, no user auth |
| V3 Session Management | No | Stateless chat sessions |
| V4 Access Control | No | Public access intended |
| V5 Input Validation | Yes | LLM prompt construction (handled by rag.py) |
| V6 Cryptography | No | API keys handled by HF Secrets |

### Known Threat Patterns for Deployment Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key exposure | Information Disclosure | HF Secrets (never in code/git) |
| Prompt injection | Tampering | System prompt grounding rules in rag.py |
| Container escape | Elevation of Privilege | Non-root user (UID 1000) |
| Denial of service | Denial of Service | HF Spaces rate limiting (built-in) |

## Sources

### Primary (HIGH confidence)
- [HuggingFace Docker Spaces Documentation](https://huggingface.co/docs/hub/en/spaces-sdks-docker) - Container setup, permissions, secrets
- [HuggingFace Spaces Config Reference](https://huggingface.co/docs/hub/en/spaces-config-reference) - YAML header fields
- [Chainlit Deploy Overview](https://docs.chainlit.io/deploy/overview) - Production flags, websocket requirements

### Secondary (MEDIUM confidence)
- [HuggingFace Spaces Overview](https://huggingface.co/docs/hub/en/spaces-overview) - Sleep behavior, URL format
- [StefanoDUrso/Chainlit-docker Example](https://huggingface.co/spaces/StefanoDUrso/Chainlit-docker) - Working deployment reference

### Tertiary (LOW confidence)
- [HF Community Forums](https://discuss.huggingface.co/) - Cold start timing estimates

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cold start takes ~1 minute | Common Pitfalls | Users may timeout; acceptable for CV chatbot |
| A2 | Free tier sufficient for CV chatbot traffic | Open Questions | May need paid tier if high volume |

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official HF docs + verified package versions
- Architecture: HIGH - Multiple working examples on HF Spaces
- Pitfalls: HIGH - Documented in official docs and community forums

**Research date:** 2026-06-11
**Valid until:** 2026-07-11 (30 days - stable deployment platform)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEP-01 | Application deploys to HuggingFace Spaces | Docker SDK with Dockerfile pattern documented; port 7860 required |
| DEP-02 | API keys configured via HF Spaces secrets | Runtime secrets injected as env vars; documented in Security Domain |
| DEP-03 | chroma_db/ directory included in deployment | COPY --chown=user in Dockerfile; must not be gitignored for HF |
| DEP-04 | Public URL stable for QR code | Format: https://username-spacename.hf.space; documented in summary |
| SETUP-04 | README.md with setup/deployment instructions | README pattern with YAML header documented in Code Examples |
</phase_requirements>
