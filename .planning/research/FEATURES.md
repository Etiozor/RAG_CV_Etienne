# Feature Research

**Domain:** RAG Chatbot / CV Assistant
**Researched:** 2026-06-10
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Natural language Q&A | Core value - recruiters ask questions, get answers | MEDIUM | RAG pipeline handles this |
| Accurate responses from CV | Recruiters trust the info comes from real documents | MEDIUM | Proper chunking + retrieval critical |
| Fast responses | Modern chat UX expectation | LOW | Streaming solves perceived latency |
| Professional tone | Representing a professional candidate | LOW | System prompt handles this |
| Mobile-friendly UI | Recruiters on phones scanning QR | LOW | Chainlit responsive by default |
| Always available | QR code must work anytime | LOW | HF Spaces provides uptime |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Starter questions | Reduces friction - one click to engage | LOW | Chainlit cl.Starter native feature |
| Bilingual (FR/EN) | Widens recruiter reach | LOW | Language detection in system prompt |
| Honest "I don't know" | Builds trust vs hallucinating | LOW | System prompt instruction |
| QR code access | Novel, memorable, low-friction | LOW | Just a URL shortcut |
| Streaming responses | Modern UX, feels responsive | LOW | Chainlit + Anthropic native |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-candidate support | "Scale it up" | Massive complexity, not the use case | Single-candidate focus |
| User authentication | "Track who's asking" | Friction kills engagement, privacy concerns | Anonymous access |
| Analytics/tracking | "Know who's interested" | GDPR concerns, creepy factor | None - respect privacy |
| Real-time CV updates | "Always current" | Index complexity, deployment overhead | Re-index on deploy |
| Voice input | "Modern UX" | Browser compatibility, added complexity | Text-only v1 |
| Chat history persistence | "Continue conversations" | Storage, privacy, complexity | Stateless sessions |

## Feature Dependencies

```
[Document Indexing]
    └──requires──> [Document Loading (PDF + MD)]
                       └──requires──> [Chunking Strategy]

[RAG Retrieval] ──requires──> [Document Indexing]

[Chat Response] ──requires──> [RAG Retrieval]
                ──requires──> [LLM API (Claude Haiku)]

[Chainlit UI] ──requires──> [Chat Response]
              ──enhances──> [Starter Questions]
              ──enhances──> [Streaming]

[HF Spaces Deployment] ──requires──> [All above working locally]
```

### Dependency Notes

- **Chat Response requires RAG Retrieval:** Can't answer without context
- **RAG Retrieval requires Document Indexing:** Must have vectors before querying
- **Chainlit UI enhances Starter Questions:** Starters only work with Chainlit

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] Document indexing (PDF + Markdown → ChromaDB)
- [x] RAG retrieval pipeline (query → relevant chunks)
- [x] Claude Haiku integration with streaming
- [x] Chainlit UI with welcome message
- [x] Starter questions for quick engagement
- [x] System prompt: professional tone, honest about unknowns
- [x] French default, English if recruiter writes in English
- [x] Deployed on HuggingFace Spaces with public URL

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Improved chunking based on actual query failures
- [ ] System prompt refinements based on recruiter feedback
- [ ] Additional starter questions based on common queries

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Multiple document format support (DOCX, etc.)
- [ ] Conversation memory within session
- [ ] Custom styling/branding

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| RAG Q&A | HIGH | MEDIUM | P1 |
| Streaming responses | HIGH | LOW | P1 |
| Starter questions | HIGH | LOW | P1 |
| Bilingual support | MEDIUM | LOW | P1 |
| Honest unknowns | HIGH | LOW | P1 |
| HF Spaces deploy | HIGH | LOW | P1 |
| Session memory | LOW | MEDIUM | P3 |
| Analytics | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Traditional CV | LinkedIn | Our Approach |
|---------|----------------|----------|--------------|
| Q&A on experience | None - static doc | Limited search | Natural language conversation |
| Availability | PDF/paper only | Requires login | QR → instant access |
| Personalized interaction | None | None | Feels like talking to someone who knows candidate |
| Language flexibility | Fixed language | Fixed language | Responds in recruiter's language |

## Sources

- Chainlit documentation (starters, streaming)
- RAG chatbot best practices
- Recruiter UX research

---
*Feature research for: RAG Chatbot / CV Assistant*
*Researched: 2026-06-10*
