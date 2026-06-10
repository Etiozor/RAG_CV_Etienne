# Requirements: CV Chatbot

**Defined:** 2026-06-10
**Core Value:** Recruiters can instantly get accurate, contextual answers about the candidate's experience and skills

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Indexing

- [ ] **IDX-01**: indexer.py loads PDF documents from /docs using pypdf
- [ ] **IDX-02**: indexer.py loads Markdown documents from /docs
- [ ] **IDX-03**: Documents are chunked into ~500 token segments with 50 token overlap
- [ ] **IDX-04**: Chunks are embedded using OpenAI text-embedding-3-small
- [ ] **IDX-05**: Embeddings are persisted to ChromaDB with PersistentClient
- [ ] **IDX-06**: ChromaDB index is stored in /chroma_db directory

### RAG Pipeline

- [ ] **RAG-01**: rag.py provides retrieve(question, k=5) function returning top-k relevant chunks
- [ ] **RAG-02**: rag.py provides build_prompt(question, chunks) function constructing the final prompt
- [ ] **RAG-03**: System prompt presents bot as assistant speaking about the candidate (not as the candidate)
- [ ] **RAG-04**: System prompt instructs honest "I don't know" when information is missing

### Chat Interface

- [ ] **UI-01**: Chainlit app.py displays welcome message on load
- [ ] **UI-02**: Starter questions are displayed via cl.Starter for quick engagement
- [ ] **UI-03**: User questions trigger RAG retrieval and Claude Haiku generation
- [ ] **UI-04**: Responses stream to the user in real-time (not wait for full completion)
- [ ] **UI-05**: Chat maintains professional but accessible tone

### Language Support

- [ ] **LANG-01**: Bot responds in French by default
- [ ] **LANG-02**: Bot switches to English if recruiter writes in English
- [ ] **LANG-03**: System prompt instructs language detection and matching

### Deployment

- [ ] **DEP-01**: Application deploys to HuggingFace Spaces
- [ ] **DEP-02**: API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY) configured via HF Spaces secrets
- [ ] **DEP-03**: chroma_db/ directory included in deployment (pre-indexed)
- [ ] **DEP-04**: Public URL is stable and suitable for QR code

### Project Setup

- [ ] **SETUP-01**: requirements.txt with pinned dependencies
- [ ] **SETUP-02**: .env.example documenting required environment variables
- [ ] **SETUP-03**: .gitignore excluding .env and local chroma_db/ (but chroma_db/ deployed to HF)
- [ ] **SETUP-04**: README.md with setup and deployment instructions

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Indexing

- **IDX-V2-01**: Support for DOCX document format
- **IDX-V2-02**: Semantic chunking based on CV sections (jobs, skills, education)
- **IDX-V2-03**: Metadata extraction (dates, company names) for filtering

### Enhanced UX

- **UX-V2-01**: Conversation memory within session
- **UX-V2-02**: Source citation showing which document answered the question
- **UX-V2-03**: Custom branding/styling

### Operations

- **OPS-V2-01**: Basic analytics (question count, popular topics)
- **OPS-V2-02**: Error alerting when API calls fail

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-candidate support | Single-candidate focus, massive complexity for no value |
| User authentication | Friction kills engagement, QR code is anonymous access |
| Recruiter tracking/analytics | Privacy concerns, GDPR, "creepy factor" |
| Real-time document updates | Index once at deploy, re-deploy to update |
| Voice input | Browser compatibility issues, added complexity |
| Chat history persistence | Storage requirements, privacy, stateless is simpler |
| Mobile app | Web is sufficient, Chainlit responsive by default |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| SETUP-03 | Phase 1 | Pending |
| SETUP-04 | Phase 4 | Pending |
| IDX-01 | Phase 1 | Pending |
| IDX-02 | Phase 1 | Pending |
| IDX-03 | Phase 1 | Pending |
| IDX-04 | Phase 1 | Pending |
| IDX-05 | Phase 1 | Pending |
| IDX-06 | Phase 1 | Pending |
| RAG-01 | Phase 2 | Pending |
| RAG-02 | Phase 2 | Pending |
| RAG-03 | Phase 2 | Pending |
| RAG-04 | Phase 2 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| LANG-01 | Phase 3 | Pending |
| LANG-02 | Phase 3 | Pending |
| LANG-03 | Phase 3 | Pending |
| DEP-01 | Phase 4 | Pending |
| DEP-02 | Phase 4 | Pending |
| DEP-03 | Phase 4 | Pending |
| DEP-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-10*
*Last updated: 2026-06-10 after initial definition*
