---
phase: 1
slug: project-setup-indexing
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-10
updated: 2026-06-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `pytest tests/test_indexer.py -x -v` |
| **Full suite command** | `pytest tests/ -v` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest tests/test_indexer.py -x -v`
- **After every plan wave:** Run `pytest tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | SETUP-01 | — | N/A | unit | `pytest tests/test_setup.py::test_requirements_txt_exists -x` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 0 | SETUP-02 | T-01-01 | API key not hardcoded | unit | `pytest tests/test_setup.py::test_env_example_documents_keys -x` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 0 | SETUP-03 | T-01-01 | .env excluded from git | unit | `pytest tests/test_setup.py::test_gitignore_excludes_secrets -x` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | IDX-01 | T-01-02 | PDF paths validated | integration | `pytest tests/test_indexer.py::test_load_pdf_documents -x` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | IDX-02 | T-01-02 | MD paths validated | integration | `pytest tests/test_indexer.py::test_load_markdown_documents -x` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | IDX-03 | — | N/A | unit | `pytest tests/test_indexer.py::test_chunking_size_and_overlap -x` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | IDX-04 | T-01-03 | HTTPS for API calls | integration | `pytest tests/test_indexer.py::test_embedding_generation -x` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 1 | IDX-05 | — | N/A | integration | `pytest tests/test_indexer.py::test_chromadb_persistence -x` | ❌ W0 | ⬜ pending |
| 01-02-06 | 02 | 1 | IDX-06 | — | N/A | integration | `pytest tests/test_indexer.py::test_chroma_directory_exists -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave Structure

| Wave | Plans | Purpose |
|------|-------|---------|
| 0 | 01-01 | Test infrastructure and project setup (requirements.txt, .env.example, .gitignore, test fixtures) |
| 1 | 01-02 | Indexer implementation (document loading, chunking, embedding, persistence) |

---

## Wave 0 Requirements

Plan 01-01 creates the test infrastructure that Plan 01-02 depends on:

- [x] `tests/test_setup.py` — covers SETUP-01, SETUP-02, SETUP-03
- [x] `tests/test_indexer.py` — covers IDX-01 through IDX-06 (scaffolds initially, filled in Wave 1)
- [x] `tests/conftest.py` — shared fixtures (temp directories, mock documents)
- [x] `tests/fixtures/` — minimal mock documents for testing
- [x] `pip install pytest` — add to requirements.txt

---

## IDX-03 Overlap Reconciliation

**REQUIREMENTS.md IDX-03** specifies "50 token overlap".
**CONTEXT.md D-05** (locked decision) specifies "200 characters".

**Resolution:** These are equivalent. Per RESEARCH.md Common Pitfalls section, the standard character-to-token ratio is approximately 4:1 for English/French text. Therefore:

- 200 characters ÷ 4 = 50 tokens

Plan 01-02 Task 2 implements `chunk_overlap=200` (characters) per the locked decision D-05, which satisfies the requirement IDX-03 (50 tokens).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ChromaDB query returns relevant chunks | Success Criteria 3 | Relevance is subjective | Run `python -c "from test_persistence import test_query; test_query()"` and verify Power BI-related queries return CV chunks |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] Wave numbering consistent (Plan 01-01 = Wave 0, Plan 01-02 = Wave 1)
- [x] IDX-03 / D-05 overlap discrepancy reconciled (200 chars ≈ 50 tokens)
- [x] Key links documented for test file → fixture connections

**Approval:** validated
