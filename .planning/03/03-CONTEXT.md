# Phase 3 Context: Chainlit Application

**Phase:** 3
**Name:** Chainlit Application
**Goal:** Complete chat interface with streaming responses and starter questions

## Requirements

| ID | Description |
|----|-------------|
| UI-01 | Chainlit app.py displays welcome message on load |
| UI-02 | Starter questions are displayed via cl.Starter for quick engagement |
| UI-03 | User questions trigger RAG retrieval and Claude Haiku generation |
| UI-04 | Responses stream to the user in real-time (not wait for full completion) |
| UI-05 | Chat maintains professional but accessible tone |
| LANG-01 | Bot responds in French by default |
| LANG-02 | Bot switches to English if recruiter writes in English |
| LANG-03 | System prompt instructs language detection and matching |

## Success Criteria

1. `chainlit run app.py` launches the chat interface
2. Welcome message displays on first load
3. 5 starter questions are clickable and send automatically
4. User question triggers RAG retrieval and Claude Haiku response
5. Response streams token-by-token (not waits for completion)
6. French questions get French answers, English questions get English answers

## Dependencies

- Phase 2 complete: rag.py with retrieve() and build_prompt()
- ChromaDB indexed with 19 chunks from CV documents
- langchain-anthropic for Claude Haiku integration

## Deliverables

- `app.py` — Chainlit application with all chat logic
- Starter questions configuration
- Integration with rag.py and Claude Haiku API

## Technical Constraints

- LLM: Claude Haiku via Anthropic API (economic, excellent French support)
- UI: Chainlit (turnkey chatbot UI, clean, deployable)
- Must integrate with existing rag.py module
- Streaming required for good UX

## Notes

- Test streaming on slow network to verify UX
- Verify language detection works correctly
- Adjust starter questions based on testing
- UI hint marked in ROADMAP.md
