# Phase 4 Context: Deployment

**Phase:** 4
**Name:** Deployment
**Goal:** Deploy to HuggingFace Spaces with stable public URL for QR code

## Requirements

| ID | Description |
|----|-------------|
| DEP-01 | Application deploys to HuggingFace Spaces |
| DEP-02 | API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY) configured via HF Spaces secrets |
| DEP-03 | chroma_db/ directory included in deployment (pre-indexed) |
| DEP-04 | Public URL is stable and suitable for QR code |
| SETUP-04 | README.md with setup and deployment instructions |

## Success Criteria

1. Application deploys successfully to HuggingFace Spaces
2. API keys configured via HF Spaces secrets (not in code)
3. chroma_db/ is included in deployment and loads correctly
4. Public URL is accessible and stable
5. README.md documents local setup and deployment process

## Dependencies

- Phase 3 complete: app.py working with streaming RAG
- Pre-indexed ChromaDB with 19 chunks
- Working requirements.txt with all dependencies

## Technical Decisions

### Locked Decisions (from research)
- **SDK:** Docker SDK (not Gradio or Streamlit)
- **Port:** 7860 (HuggingFace Spaces default)
- **User:** Non-root user with UID 1000 (HF requirement)
- **Secrets:** HF Spaces Secrets for API keys
- **ChromaDB:** Included in Docker image via COPY

### Claude's Discretion
- QR code generation tool/service
- Exact Space naming convention

## Deliverables

- `Dockerfile` — Container build instructions
- `README.md` — Complete documentation with HF YAML header
- HuggingFace Spaces deployment
- QR code pointing to public URL

## Notes

- Test Docker build locally before pushing to HF
- Free tier sleeps after 48h inactivity (~1 min cold start)
- URL format: `https://<username>-<space-name>.hf.space`
