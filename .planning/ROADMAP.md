# Roadmap: CV Chatbot

**Created:** 2026-06-10
**Phases:** 4
**Mode:** MVP (Vertical slices)

## Overview

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 1 | Project Setup & Indexing | Working document indexing pipeline | SETUP-01,02,03, IDX-01,02,03,04,05,06 |
| 2 | RAG Pipeline | Functional retrieval and prompt building | RAG-01,02,03,04 |
| 3 | Chainlit Application | Complete chat interface with streaming | UI-01,02,03,04,05, LANG-01,02,03 |
| 4 | Deployment | Live on HuggingFace Spaces with QR code | DEP-01,02,03,04, SETUP-04 |

---

## Phase Details

### Phase 1: Project Setup & Indexing
**Goal:** Create the document indexing pipeline that processes CV documents into a searchable vector store
**Mode:** mvp
**Requirements:** SETUP-01, SETUP-02, SETUP-03, IDX-01, IDX-02, IDX-03, IDX-04, IDX-05, IDX-06
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Project foundation: requirements.txt, .env.example, .gitignore, test infrastructure
- [x] 01-02-PLAN.md — Indexing pipeline: indexer.py with load, chunk, embed, persist

**Success Criteria:**
1. Running `python indexer.py` successfully indexes all documents from /docs
2. ChromaDB collection is persisted in /chroma_db with correct PersistentClient configuration
3. Can query the collection via Python REPL and get relevant chunks back
4. requirements.txt includes all dependencies with pinned versions
5. .env.example documents OPENAI_API_KEY requirement

**Deliverables:**
- `requirements.txt` — pinned dependencies
- `.env.example` — environment variable template
- `.gitignore` — exclude .env and local artifacts
- `docs/` — placeholder structure (user provides actual documents)
- `indexer.py` — document loading, chunking, embedding, persistence

**Notes:**
- Test with sample documents before user's real CV
- Verify ChromaDB persistence survives script restart
- Handle OpenAI rate limits with retry logic

---

### Phase 2: RAG Pipeline
**Goal:** Build the retrieval and prompt construction module that can be tested independently
**Mode:** mvp
**Requirements:** RAG-01, RAG-02, RAG-03, RAG-04
**Plans:** 1 plan

Plans:
- [x] 02-01-PLAN.md — RAG module: retrieve(), build_prompt(), system prompt, tests, CLI verification

**Success Criteria:**
1. `retrieve("What are Etienne's skills?", k=5)` returns relevant chunks
2. `build_prompt(question, chunks)` constructs a well-formatted prompt with system instructions
3. System prompt enforces "I don't know" behavior for missing information
4. Can test RAG quality via CLI before UI integration

**Deliverables:**
- `rag.py` — retrieve() and build_prompt() functions
- System prompt text with grounding rules
- CLI test script or REPL examples

**Notes:**
- Test with adversarial questions (things not in CV)
- Verify k=5 returns good coverage without noise
- System prompt is critical for tone and honesty

---

### Phase 3: Chainlit Application
**Goal:** Complete chat interface with streaming responses and starter questions
**Mode:** mvp
**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05, LANG-01, LANG-02, LANG-03
**Plans:** 1 plan

Plans:
- [ ] 03-01-PLAN.md — Chainlit app: dependencies, app.py with starters/streaming, tests

**Success Criteria:**
1. `chainlit run app.py` launches the chat interface
2. Welcome message displays on first load
3. 5 starter questions are clickable and send automatically
4. User question triggers RAG retrieval and Claude Haiku response
5. Response streams token-by-token (not waits for completion)
6. French questions get French answers, English questions get English answers

**Deliverables:**
- `app.py` — Chainlit application with all chat logic
- Starter questions configuration
- Integration with rag.py and Claude Haiku API

**UI hint:** yes

**Notes:**
- Test streaming on slow network to verify UX
- Verify language detection works correctly
- Adjust starter questions based on testing

---

### Phase 4: Deployment
**Goal:** Deploy to HuggingFace Spaces with stable public URL for QR code
**Mode:** mvp
**Requirements:** DEP-01, DEP-02, DEP-03, DEP-04, SETUP-04

**Success Criteria:**
1. Application deploys successfully to HuggingFace Spaces
2. API keys configured via HF Spaces secrets (not in code)
3. chroma_db/ is included in deployment and loads correctly
4. Public URL is accessible and stable
5. README.md documents local setup and deployment process

**Deliverables:**
- HuggingFace Spaces deployment
- `README.md` — complete documentation
- QR code pointing to public URL

**Notes:**
- Test deployment early to catch persistence issues
- Verify cold start time is acceptable
- Create QR code only after URL is confirmed stable

---

## Milestone: v1.0

**Definition of Done:**
- [ ] All 22 v1 requirements complete
- [ ] Deployed to HuggingFace Spaces
- [ ] QR code generated and tested
- [ ] README.md complete
- [ ] Tested with 10+ sample recruiter questions

**Success Metrics:**
- Response time < 5 seconds for typical questions
- RAG retrieves relevant context for 90%+ of questions
- Zero hallucinations about candidate information

---

## Phase Dependencies

```
Phase 1 (Indexing)
    ↓
Phase 2 (RAG Pipeline)
    ↓
Phase 3 (Chainlit App)
    ↓
Phase 4 (Deployment)
```

All phases are sequential — each depends on the previous.

---
*Roadmap created: 2026-06-10*
*Last updated: 2026-06-10*
